import "server-only"

import { createClient } from "@/lib/supabase/server"
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
  const supabase = await createClient()
  const { data } = await supabase
    .from("models")
    .select(
      "id, slug, title, status, price_cents, download_count, review_count, rating, formats, updated_at, categories ( slug ), model_images ( storage_key, position )",
    )
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
