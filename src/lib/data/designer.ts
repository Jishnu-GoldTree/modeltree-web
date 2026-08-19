import "server-only"

import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { presignGet } from "@/lib/r2/presign"

/**
 * Designer-side reads.
 *
 * These use the cookie-bound client, not the public one: a designer must see
 * their own drafts, and RLS decides that from the session. If this ever gets
 * swapped for the anon client, drafts silently disappear rather than leaking —
 * which is the failure direction we want.
 */

export type DesignerModel = {
  id: string
  slug: string
  title: string
  status: "draft" | "processing" | "published" | "rejected" | "archived"
  priceCents: number
  downloads: number
  reviewCount: number
  rating: number | null
  formats: string[]
  updatedAt: string
  categorySlug: string | null
  /** Signed URL to the lowest-position preview image, if any. */
  cover?: string
}

export async function getMyModels(): Promise<DesignerModel[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  // Scope to the caller explicitly. RLS's models_read also grants every
  // *published* row to everyone (the public catalog needs that), so relying on
  // RLS alone here would surface the whole marketplace as "your listings".
  const { data } = await supabase
    .from("models")
    .select(
      "id, slug, title, status, price_cents, download_count, review_count, rating, formats, updated_at, categories ( slug ), model_images ( storage_key, position )",
    )
    .eq("designer_id", user.id)
    .order("updated_at", { ascending: false })

  return Promise.all(
    (data ?? []).map(async (m) => {
      const row = m as unknown as {
        id: string; slug: string; title: string; status: DesignerModel["status"]
        price_cents: number; download_count: number; review_count: number
        rating: number | null; formats: string[]; updated_at: string
        categories: { slug: string } | null
        model_images: { storage_key: string; position: number }[]
      }
      const coverImage = [...(row.model_images ?? [])].sort(
        (a, b) => a.position - b.position,
      )[0]
      const cover = coverImage ? await presignGet(coverImage.storage_key) : undefined
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        status: row.status,
        priceCents: row.price_cents,
        downloads: row.download_count,
        reviewCount: row.review_count,
        rating: row.rating,
        formats: row.formats ?? [],
        updatedAt: row.updated_at,
        categorySlug: row.categories?.slug ?? null,
        cover,
      }
    }),
  )
}

/**
 * Everything the edit form needs to pre-fill itself, or null when the caller
 * does not own the listing.
 *
 * Ownership is enforced twice on purpose: the explicit `designer_id` filter
 * gives a clean "not found" instead of leaking that a row exists, and RLS
 * backstops it. Storage keys for the existing files and images come back too —
 * the owner may see their own (model_files_read / model_images_read both admit
 * the designer) and the form echoes them so an untouched upload is preserved on
 * save rather than re-uploaded.
 */
export type ListingEditData = {
  id: string
  title: string
  description: string
  categoryId: string | null
  licenseCode: string
  /** Major units (shekels) — the price input works in whole ILS, not agorot. */
  priceIls: number
  metal: string
  stone: string
  production: string
  weightGrams: number | null
  tags: string[]
  files: { format: string; storageKey: string; sizeBytes: number }[]
  images: {
    storageKey: string
    previewUrl: string
    width: number | null
    height: number | null
  }[]
}

export async function getListingForEdit(id: string): Promise<ListingEditData | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: model } = await supabase
    .from("models")
    .select(
      "id, title, description, category_id, license_code, price_cents, metal, stone, production, weight_grams, tags",
    )
    .eq("id", id)
    .eq("designer_id", user.id)
    .maybeSingle()
  if (!model) return null

  const m = model as unknown as {
    id: string; title: string; description: string | null
    category_id: string | null; license_code: string; price_cents: number
    metal: string; stone: string; production: string; weight_grams: number | null
    tags: string[] | null
  }

  const [{ data: fileRows }, { data: imageRows }] = await Promise.all([
    supabase.from("model_files").select("format, storage_key, size_bytes").eq("model_id", id),
    supabase
      .from("model_images")
      .select("storage_key, position, width, height")
      .eq("model_id", id)
      .order("position", { ascending: true }),
  ])

  const files = (
    (fileRows ?? []) as { format: string; storage_key: string; size_bytes: number }[]
  ).map((f) => ({ format: f.format, storageKey: f.storage_key, sizeBytes: Number(f.size_bytes) }))

  const images = await Promise.all(
    (
      (imageRows ?? []) as {
        storage_key: string; position: number; width: number | null; height: number | null
      }[]
    ).map(async (img) => ({
      storageKey: img.storage_key,
      previewUrl: await presignGet(img.storage_key),
      width: img.width,
      height: img.height,
    })),
  )

  return {
    id: m.id,
    title: m.title,
    description: m.description ?? "",
    categoryId: m.category_id,
    licenseCode: m.license_code,
    priceIls: m.price_cents / 100,
    metal: m.metal,
    stone: m.stone,
    production: m.production,
    weightGrams: m.weight_grams,
    tags: m.tags ?? [],
    files,
    images,
  }
}

/**
 * Earnings, read from order_items rather than orders: RLS lets a designer see
 * the lines they earned on but not the buyer's order, which is exactly the
 * split we want.
 */
export async function getDesignerEarnings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("order_items")
    .select("designer_share_cents, created_at")

  const rows = (data ?? []) as { designer_share_cents: number; created_at: string }[]
  const now = Date.now()
  const last30 = rows.filter(
    (r) => now - new Date(r.created_at).getTime() < 30 * 86_400_000,
  )

  return {
    salesCount: rows.length,
    grossCents: rows.reduce((sum, r) => sum + r.designer_share_cents, 0),
    last30Cents: last30.reduce((sum, r) => sum + r.designer_share_cents, 0),
  }
}

export async function getCategoryOptions() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("categories")
    .select("id, slug, label, kind")
    .order("kind")
    .order("position")
  return (data ?? []) as { id: string; slug: string; label: string; kind: string }[]
}

export async function getLicenseOptionsForForm() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("licenses")
    .select("code, label, blurb")
    .order("position")
  return (data ?? []) as { code: string; label: string; blurb: string }[]
}
