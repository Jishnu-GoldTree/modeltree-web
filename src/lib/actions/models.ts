"use server"

import { revalidatePath } from "next/cache"
import { getLocale } from "next-intl/server"

import { redirect } from "@/i18n/navigation"

import { withFlash } from "@/lib/flash"
import { z } from "zod"

import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { FORMATS, METALS, PRODUCTION, STONES } from "@/lib/data/catalog"

/**
 * Designer-side writes.
 *
 * Every one runs through the cookie-bound client, so RLS is what actually
 * enforces ownership — these checks are for good error messages, not security.
 * A designer_id spoofed in the form is rejected by the database regardless.
 */

const FORMAT_VALUES = FORMATS.map((f) => f.value) as [string, ...string[]]

/** Client-uploaded file metadata. The bytes already live in R2; this row just
 *  records where. Sizes are what R2 recorded, so a fake size in a hidden field
 *  would be caught the moment we go to serve the file. */
const uploadedFileSchema = z.object({
  format: z.enum(FORMAT_VALUES),
  storageKey: z.string().min(1),
  size: z.number().int().min(0).max(500 * 1024 * 1024),
})

const uploadedImageSchema = z.object({
  storageKey: z.string().min(1),
  position: z.number().int().min(0).max(19),
  size: z.number().int().min(0).max(10 * 1024 * 1024),
})

const listingSchema = z.object({
  title: z.string().trim().min(4, "Give the model a title of at least 4 characters").max(120),
  description: z
    .string()
    .trim()
    .min(30, "Describe the model in at least 30 characters. Buyers rely on this")
    .max(4000),
  // A missing select posts null, which would otherwise surface Zod's raw
  // "expected string, received null" to the designer.
  categoryId: z.string().min(1, "Pick a category").uuid("Pick a category"),
  licenseCode: z.string().min(1),
  // Dollars in the form, cents in the database. Parsing here keeps the
  // conversion in one place rather than scattered through the UI.
  price: z.coerce.number().min(0, "Price cannot be negative").max(10_000),
  formats: z.array(z.enum(FORMAT_VALUES)).min(1, "Select at least one file format"),
  polygons: z.coerce.number().int().min(0).max(100_000_000).optional(),
  metal: z.enum(METALS),
  stone: z.enum(STONES),
  production: z.enum(PRODUCTION),
  weightGrams: z.coerce.number().min(0).max(9999).optional(),
  publish: z.boolean(),
  // Filled by the client after the browser PUTs each file to R2. Empty arrays
  // are allowed for a draft — a designer might save mid-flight — but a publish
  // without files is rejected further down.
  uploadedFiles: z.array(uploadedFileSchema).max(20).default([]),
  uploadedImages: z.array(uploadedImageSchema).max(20).default([]),
})

export type ListingState = { error?: string; fieldErrors?: Record<string, string> }

/** Client-echoed storage keys are trusted only after this: R2 only accepts
 *  keys under the caller's userId thanks to the presign endpoint, but we
 *  double-check here so a forged FormData field can't graft an unrelated key
 *  onto the listing. */
function ownsKey(storageKey: string, userId: string, prefix: "models" | "images") {
  return storageKey.startsWith(`${prefix}/${userId}/`)
}

function parseJsonField(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || raw.length === 0) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

/** Slugs are public URLs, so they must be stable, lowercase and collision-free. */
function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

export async function createListing(
  _prev: ListingState,
  formData: FormData,
): Promise<ListingState> {
  const locale = await getLocale()
  const user = await getCurrentUser()
  // redirect() throws; the return keeps the action's declared type honest.
  if (!user) {
    redirect({ href: "/login?next=/dashboard/upload", locale })
    return {}
  }

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId") ?? "",
    licenseCode: formData.get("licenseCode"),
    price: formData.get("price") || 0,
    formats: formData.getAll("formats").map(String),
    polygons: formData.get("polygons") || undefined,
    metal: formData.get("metal"),
    stone: formData.get("stone"),
    production: formData.get("production"),
    weightGrams: formData.get("weightGrams") || undefined,
    publish: formData.get("publish") === "1",
    uploadedFiles: parseJsonField(formData.get("uploadedFiles")),
    uploadedImages: parseJsonField(formData.get("uploadedImages")),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form")
      fieldErrors[key] ??= issue.message
    }
    return { fieldErrors }
  }

  const v = parsed.data

  // A publish must ship something buyers can download. Drafts are allowed to
  // sit empty — a designer may want to save the descriptive fields and come
  // back to attach files.
  if (v.publish && v.uploadedFiles.length === 0) {
    return { fieldErrors: { uploadedFiles: "Upload at least one model file before publishing" } }
  }

  // Every checked format must have exactly one uploaded file. Mismatch means
  // the client got out of sync (e.g. checkbox toggled after upload) and would
  // otherwise create rows with missing bytes.
  const uploadedFormats = new Set(v.uploadedFiles.map((f) => f.format))
  const missingFormats = v.formats.filter((f) => !uploadedFormats.has(f))
  if (v.publish && missingFormats.length > 0) {
    return { fieldErrors: { uploadedFiles: `Missing file for: ${missingFormats.join(", ")}` } }
  }

  // Reject any storage key the presign endpoint would not have issued for
  // this user — the browser is trusted with the URL, not with the key path.
  for (const f of v.uploadedFiles) {
    if (!ownsKey(f.storageKey, user.id, "models")) {
      return { error: "Upload could not be verified. Please retry." }
    }
  }
  for (const img of v.uploadedImages) {
    if (!ownsKey(img.storageKey, user.id, "images")) {
      return { error: "Upload could not be verified. Please retry." }
    }
  }

  const supabase = await createClient()

  // Collisions are likely — two designers both publish "Rally Car". Walk a
  // numeric suffix until the unique index is satisfied.
  const base = slugify(v.title) || "model"
  let slug = base
  for (let n = 2; n < 50; n++) {
    const { data: taken } = await supabase
      .from("models")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
    if (!taken) break
    slug = `${base}-${n}`
  }

  const { data: model, error } = await supabase
    .from("models")
    .insert({
      designer_id: user.id,
      category_id: v.categoryId,
      slug,
      title: v.title,
      description: v.description,
      // Files are not uploaded yet, so a "published" listing would have nothing
      // to download. Publishing puts it in `processing` until the pipeline
      // exists; saving keeps it a draft.
      status: v.publish ? "processing" : "draft",
      price_cents: Math.round(v.price * 100),
      license_code: v.licenseCode,
      metal: v.metal,
      stone: v.stone,
      production: v.production,
      weight_grams: v.weightGrams ?? null,
      polygons: v.polygons ?? null,
    })
    .select("id, slug")
    .single()

  if (error || !model) {
    return { error: error?.message ?? "Could not save the listing. Try again." }
  }

  // Real file rows — bytes already live in R2 under storage_key. The trigger
  // mirrors formats onto models.formats, which is what the catalog reads.
  if (v.uploadedFiles.length > 0) {
    const files = v.uploadedFiles.map((f) => ({
      model_id: model.id,
      format: f.format,
      storage_key: f.storageKey,
      size_bytes: f.size,
    }))
    const { error: fileError } = await supabase.from("model_files").insert(files)
    if (fileError) return { error: fileError.message }
  }

  if (v.uploadedImages.length > 0) {
    const images = v.uploadedImages.map((img) => ({
      model_id: model.id,
      storage_key: img.storageKey,
      position: img.position,
    }))
    const { error: imageError } = await supabase.from("model_images").insert(images)
    if (imageError) return { error: imageError.message }
  }

  // No enqueue here: a database trigger fires on the transition into
  // `processing`, so the job commits with the row. Doing it from the client
  // needed permissions on a service-role-only table and would have been a
  // separate transaction besides.

  revalidatePath("/dashboard")
  revalidatePath("/3d-models")
  redirect({ href: withFlash("/dashboard", v.publish ? "listingPublished" : "listingCreated"), locale })
  // Unreachable: redirect() throws. Present so the action satisfies its
  // declared ListingState return type, which next-intl's redirect no longer
  // narrows away the way next/navigation's `never` return did.
  return {}
}

export async function deleteListing(formData: FormData) {
  const id = formData.get("id")
  if (typeof id !== "string") return

  const supabase = await createClient()
  // No ownership check here on purpose: RLS's models_delete_own decides, so a
  // forged id deletes nothing instead of someone else's listing.
  await supabase.from("models").delete().eq("id", id)
  revalidatePath("/dashboard")
}
