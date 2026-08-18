"use server"

import { revalidatePath } from "next/cache"
import { redirect as externalRedirect } from "next/navigation"
import { getLocale } from "next-intl/server"

import { redirect } from "@/i18n/navigation"

import { withFlash } from "@/lib/flash"
import { z } from "zod"

import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { FORMATS, METALS, PRODUCTION, STONES } from "@/lib/data/catalog"
import { headObject, keyPrefix, presignDownload, type StoredObject } from "@/lib/r2/presign"

/**
 * Designer-side writes.
 *
 * Every one runs through the cookie-bound client, so RLS is what actually
 * enforces ownership — these checks are for good error messages, not security.
 * A designer_id spoofed in the form is rejected by the database regardless.
 */

const FORMAT_VALUES = FORMATS.map((f) => f.value) as [string, ...string[]]

/** Client-uploaded file metadata. The bytes are supposed to already live in R2;
 *  this says where to look. Nothing here is trusted — the key is re-derived
 *  against the caller's namespace below, and the size and digest are read back
 *  off R2 rather than accepted from the form. */
const uploadedFileSchema = z.object({
  format: z.enum(FORMAT_VALUES),
  storageKey: z.string().min(1),
})

const uploadedImageSchema = z.object({
  storageKey: z.string().min(1),
  position: z.number().int().min(0).max(19),
  // Measured in the browser, since the bytes never reach this server. Only
  // used to reserve layout space, so a wrong value costs a reflow and nothing
  // more — which is why it isn't verified against the stored object.
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
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
  return storageKey.startsWith(`${keyPrefix()}${prefix}/${userId}/`)
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

  // And a preview, or the listing has no thumbnail and shows blank in the
  // catalog. The client disables the publish button without one; this is the
  // same rule enforced server-side so a direct POST can't slip a coverless
  // listing into the catalog.
  if (v.publish && v.uploadedImages.length === 0) {
    return { fieldErrors: { uploadedImages: "Add at least one preview image before publishing" } }
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

  // Ask R2 what it actually holds. A presigned URL is permission to upload, not
  // evidence of one — a PUT that failed, stalled or was abandoned leaves the key
  // empty while the form still reports success. Checking here turns that into an
  // error the designer can act on immediately, instead of a live listing that
  // 404s the first time somebody downloads it.
  let storedFiles: (StoredObject | null)[]
  let storedImages: (StoredObject | null)[]
  try {
    ;[storedFiles, storedImages] = await Promise.all([
      Promise.all(v.uploadedFiles.map((f) => headObject(f.storageKey))),
      Promise.all(v.uploadedImages.map((img) => headObject(img.storageKey))),
    ])
  } catch {
    // R2 itself is unreachable or misconfigured. Distinct from a missing key:
    // the designer did nothing wrong and retrying is the right advice.
    return { error: "Could not reach file storage. Please try again in a moment." }
  }

  const fileRows: {
    format: string
    storageKey: string
    size: number
    checksum: string | null
  }[] = []
  for (const [i, f] of v.uploadedFiles.entries()) {
    const stored = storedFiles[i]
    if (!stored || stored.size === 0) {
      return {
        fieldErrors: {
          uploadedFiles: `The ${f.format.toUpperCase()} file did not finish uploading. Attach it again and retry.`,
        },
      }
    }
    fileRows.push({
      format: f.format,
      storageKey: f.storageKey,
      size: stored.size,
      checksum: stored.checksum,
    })
  }

  // Images carry no checksum column — they're public, replaceable and not what
  // a buyer pays for. Existence is the only thing worth confirming.
  for (let i = 0; i < v.uploadedImages.length; i++) {
    const stored = storedImages[i]
    if (!stored || stored.size === 0) {
      return {
        fieldErrors: {
          uploadedImages: "A preview image did not finish uploading. Attach it again and retry.",
        },
      }
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
      // Live immediately: every file backing this listing has just been
      // confirmed present in R2, which is the only thing `processing` was ever
      // waiting on.
      status: v.publish ? "published" : "draft",
      // The catalog's browse index orders by this, so a published row without
      // it sorts as null and effectively disappears.
      published_at: v.publish ? new Date().toISOString() : null,
      price_cents: Math.round(v.price * 100),
      license_code: v.licenseCode,
      metal: v.metal,
      stone: v.stone,
      production: v.production,
      weight_grams: v.weightGrams ?? null,
    })
    .select("id, slug")
    .single()

  if (error || !model) {
    return { error: error?.message ?? "Could not save the listing. Try again." }
  }

  // Real file rows — bytes confirmed in R2 under storage_key, sized and
  // digested from what R2 reported. The trigger mirrors formats onto
  // models.formats, which is what the catalog reads.
  if (fileRows.length > 0) {
    const files = fileRows.map((f) => ({
      model_id: model.id,
      format: f.format,
      storage_key: f.storageKey,
      size_bytes: f.size,
      checksum: f.checksum,
    }))
    const { error: fileError } = await supabase.from("model_files").insert(files)
    if (fileError) return { error: fileError.message }
  }

  if (v.uploadedImages.length > 0) {
    const images = v.uploadedImages.map((img) => ({
      model_id: model.id,
      storage_key: img.storageKey,
      position: img.position,
      width: img.width ?? null,
      height: img.height ?? null,
    }))
    const { error: imageError } = await supabase.from("model_images").insert(images)
    if (imageError) return { error: imageError.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/3d-models")
  redirect({ href: withFlash("/dashboard", v.publish ? "listingPublished" : "listingCreated"), locale })
  // Unreachable: redirect() throws. Present so the action satisfies its
  // declared ListingState return type, which next-intl's redirect no longer
  // narrows away the way next/navigation's `never` return did.
  return {}
}

/**
 * Edits an existing listing.
 *
 * Mirrors createListing's validation exactly — the same schema, the same
 * publish gates, the same "is this key really mine and really in R2" checks —
 * but reconciles files and images against what is already stored instead of
 * inserting fresh. An upload the designer left untouched keeps its row (and its
 * checksum) rather than being re-verified and rewritten; a removed one is
 * deleted; a newly added one is headObject'd and inserted. The slug never
 * changes, so existing links and search rankings survive a retitle.
 */
export async function updateListing(
  _prev: ListingState,
  formData: FormData,
): Promise<ListingState> {
  const locale = await getLocale()
  const user = await getCurrentUser()
  if (!user) {
    redirect({ href: "/login?next=/dashboard", locale })
    return {}
  }

  const modelId = String(formData.get("modelId") ?? "")
  if (!z.string().uuid().safeParse(modelId).success) {
    return { error: "Could not find that listing." }
  }

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId") ?? "",
    licenseCode: formData.get("licenseCode"),
    price: formData.get("price") || 0,
    formats: formData.getAll("formats").map(String),
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

  if (v.publish && v.uploadedFiles.length === 0) {
    return { fieldErrors: { uploadedFiles: "Upload at least one model file before publishing" } }
  }
  if (v.publish && v.uploadedImages.length === 0) {
    return { fieldErrors: { uploadedImages: "Add at least one preview image before publishing" } }
  }

  const uploadedFormats = new Set(v.uploadedFiles.map((f) => f.format))
  const missingFormats = v.formats.filter((f) => !uploadedFormats.has(f))
  if (v.publish && missingFormats.length > 0) {
    return { fieldErrors: { uploadedFiles: `Missing file for: ${missingFormats.join(", ")}` } }
  }

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

  // Ownership check with a clean error. RLS's models_update_own also guards the
  // write below, so this is for the message, not the security.
  const { data: current } = await supabase
    .from("models")
    .select("id, slug, published_at")
    .eq("id", modelId)
    .eq("designer_id", user.id)
    .maybeSingle()
  if (!current) return { error: "Could not find that listing." }
  const currentRow = current as { id: string; slug: string; published_at: string | null }

  const [{ data: existingFiles }, { data: existingImages }] = await Promise.all([
    supabase.from("model_files").select("storage_key").eq("model_id", modelId),
    supabase.from("model_images").select("storage_key, position").eq("model_id", modelId),
  ])
  const existingFileKeys = new Set(
    (existingFiles ?? []).map((r) => (r as { storage_key: string }).storage_key),
  )
  const existingImageRows = (existingImages ?? []) as { storage_key: string; position: number }[]
  const existingImageKeys = new Set(existingImageRows.map((r) => r.storage_key))

  // Only the genuinely new uploads need proving in R2 — the rest are already
  // stored and verified from when they were first added.
  const newFiles = v.uploadedFiles.filter((f) => !existingFileKeys.has(f.storageKey))
  const newImages = v.uploadedImages.filter((img) => !existingImageKeys.has(img.storageKey))

  let storedFiles: (StoredObject | null)[]
  let storedImages: (StoredObject | null)[]
  try {
    ;[storedFiles, storedImages] = await Promise.all([
      Promise.all(newFiles.map((f) => headObject(f.storageKey))),
      Promise.all(newImages.map((img) => headObject(img.storageKey))),
    ])
  } catch {
    return { error: "Could not reach file storage. Please try again in a moment." }
  }

  const newFileRows: { format: string; storageKey: string; size: number; checksum: string | null }[] = []
  for (const [i, f] of newFiles.entries()) {
    const stored = storedFiles[i]
    if (!stored || stored.size === 0) {
      return {
        fieldErrors: {
          uploadedFiles: `The ${f.format.toUpperCase()} file did not finish uploading. Attach it again and retry.`,
        },
      }
    }
    newFileRows.push({ format: f.format, storageKey: f.storageKey, size: stored.size, checksum: stored.checksum })
  }
  for (let i = 0; i < newImages.length; i++) {
    const stored = storedImages[i]
    if (!stored || stored.size === 0) {
      return {
        fieldErrors: {
          uploadedImages: "A preview image did not finish uploading. Attach it again and retry.",
        },
      }
    }
  }

  const { error: updateError } = await supabase
    .from("models")
    .update({
      category_id: v.categoryId,
      title: v.title,
      description: v.description,
      status: v.publish ? "published" : "draft",
      // Stamp the first publish only. Re-publishing an edit must not bump the
      // date, or the catalog reshuffles the listing to the top on every save.
      published_at: v.publish ? currentRow.published_at ?? new Date().toISOString() : currentRow.published_at,
      price_cents: Math.round(v.price * 100),
      license_code: v.licenseCode,
      metal: v.metal,
      stone: v.stone,
      production: v.production,
      weight_grams: v.weightGrams ?? null,
    })
    .eq("id", modelId)
    .eq("designer_id", user.id)
  if (updateError) return { error: updateError.message }

  // Files: drop the ones no longer present (removed or replaced), then add the
  // new ones. Delete precedes insert so a re-uploaded format frees its
  // (model_id, format) unique slot before the replacement lands.
  const keptFileKeys = new Set(v.uploadedFiles.map((f) => f.storageKey))
  const removeFileKeys = [...existingFileKeys].filter((k) => !keptFileKeys.has(k))
  if (removeFileKeys.length > 0) {
    const { error } = await supabase
      .from("model_files")
      .delete()
      .eq("model_id", modelId)
      .in("storage_key", removeFileKeys)
    if (error) return { error: error.message }
  }
  if (newFileRows.length > 0) {
    const { error } = await supabase.from("model_files").insert(
      newFileRows.map((f) => ({
        model_id: modelId,
        format: f.format,
        storage_key: f.storageKey,
        size_bytes: f.size,
        checksum: f.checksum,
      })),
    )
    if (error) return { error: error.message }
  }

  // Images: same delete-then-add, but positions for the new ones start past the
  // highest kept position so a fresh upload never ties an existing one for
  // "cover" (lowest position wins).
  const keptImageKeys = new Set(v.uploadedImages.map((img) => img.storageKey))
  const removeImageKeys = existingImageRows
    .filter((r) => !keptImageKeys.has(r.storage_key))
    .map((r) => r.storage_key)
  if (removeImageKeys.length > 0) {
    const { error } = await supabase
      .from("model_images")
      .delete()
      .eq("model_id", modelId)
      .in("storage_key", removeImageKeys)
    if (error) return { error: error.message }
  }
  if (newImages.length > 0) {
    const keptPositions = existingImageRows
      .filter((r) => keptImageKeys.has(r.storage_key))
      .map((r) => r.position)
    let nextPosition = (keptPositions.length > 0 ? Math.max(...keptPositions) : -1) + 1
    const rows = newImages.map((img) => ({
      model_id: modelId,
      storage_key: img.storageKey,
      position: nextPosition++,
      width: img.width ?? null,
      height: img.height ?? null,
    }))
    const { error } = await supabase.from("model_images").insert(rows)
    if (error) return { error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/3d-models")
  revalidatePath(`/3d-model/${currentRow.slug}`)
  redirect({ href: withFlash("/dashboard", v.publish ? "listingPublished" : "listingUpdated"), locale })
  return {}
}

/**
 * Hands a buyer the source file they paid for.
 *
 * The entitlement check is the database, not this code: model_files_read only
 * returns a row to the model's designer or to someone with a paid order, so a
 * hit on the file lookup *is* proof of entitlement. Everyone else — anonymous,
 * signed-in-but-unpaid, or asking for a format that doesn't exist — is bounced
 * back to the product page where the buy box lives. The bytes never touch this
 * server: R2 signs a five-minute URL and the browser follows it directly.
 */
export async function downloadModelFile(formData: FormData) {
  const slug = formData.get("slug")
  const format = formData.get("format")
  if (typeof slug !== "string" || typeof format !== "string") return

  const locale = await getLocale()
  const user = await getCurrentUser()
  if (!user) {
    redirect({ href: `/login?next=/3d-model/${slug}`, locale })
    return
  }

  const supabase = await createClient()

  const { data: model } = await supabase
    .from("models")
    .select("id, title")
    .eq("slug", slug)
    .maybeSingle()
  if (!model) {
    redirect({ href: `/3d-model/${slug}`, locale })
    return
  }

  const { data: file } = await supabase
    .from("model_files")
    .select("storage_key")
    .eq("model_id", model.id)
    .eq("format", format)
    .maybeSingle()
  if (!file) {
    redirect({ href: `/3d-model/${slug}`, locale })
    return
  }

  const filename = `${slugify(model.title) || "model"}.${format.toLowerCase()}`
  const url = await presignDownload(file.storage_key, filename)
  externalRedirect(url)
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
