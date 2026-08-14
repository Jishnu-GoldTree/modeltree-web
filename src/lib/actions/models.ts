"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { withFlash } from "@/lib/flash"
import { z } from "zod"

import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { METALS, PRODUCTION, STONES } from "@/lib/data/catalog"

/**
 * Designer-side writes.
 *
 * Every one runs through the cookie-bound client, so RLS is what actually
 * enforces ownership — these checks are for good error messages, not security.
 * A designer_id spoofed in the form is rejected by the database regardless.
 */

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
  formats: z.array(z.string()).min(1, "Select at least one file format"),
  polygons: z.coerce.number().int().min(0).max(100_000_000).optional(),
  metal: z.enum(METALS),
  stone: z.enum(STONES),
  production: z.enum(PRODUCTION),
  weightGrams: z.coerce.number().min(0).max(9999).optional(),
  publish: z.boolean(),
})

export type ListingState = { error?: string; fieldErrors?: Record<string, string> }

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
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/dashboard/upload")

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

  // Placeholder file rows so the listing carries its formats. The trigger
  // mirrors them onto models.formats, which is what the catalog reads.
  const files = v.formats.map((format) => ({
    model_id: model.id,
    format,
    storage_key: `models/${model.slug}/${format.toLowerCase().replace(/\s+/g, "-")}.zip`,
    size_bytes: 0,
  }))
  await supabase.from("model_files").insert(files)

  // No enqueue here: a database trigger fires on the transition into
  // `processing`, so the job commits with the row. Doing it from the client
  // needed permissions on a service-role-only table and would have been a
  // separate transaction besides.

  revalidatePath("/dashboard")
  revalidatePath("/3d-models")
  redirect(withFlash("/dashboard", v.publish ? "listingPublished" : "listingCreated"))
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
