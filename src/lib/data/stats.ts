import { supabasePublic } from "@/lib/supabase/public"

/**
 * Marketplace figures, counted from the database.
 *
 * These replaced hardcoded copy ("1.9M+ assets from 200,000+ designers") that
 * was placeholder invented while building — the catalog held 72 models at the
 * time. Numbers a visitor could check must be true by construction, so they are
 * queried rather than written down, and they grow on their own.
 */

export type MarketplaceStats = {
  models: number
  designers: number
  downloads: number
}

/** Rounds down to a "+" figure once the number is large enough to warrant it. */
export function formatStat(value: number) {
  if (value >= 1_000_000) return `${Math.floor(value / 100_000) / 10}M+`
  if (value >= 1_000) return `${Math.floor(value / 100) / 10}K+`
  return value.toLocaleString("en-US")
}

export async function getMarketplaceStats(): Promise<MarketplaceStats> {
  const [models, designers, downloads] = await Promise.all([
    supabasePublic
      .from("models")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabasePublic
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_type", "designer"),
    supabasePublic.from("models").select("download_count").eq("status", "published"),
  ])

  return {
    models: models.count ?? 0,
    designers: designers.count ?? 0,
    downloads: (downloads.data ?? []).reduce(
      (sum, m) => sum + ((m as { download_count: number }).download_count ?? 0),
      0,
    ),
  }
}

/**
 * Live counts per metal, stone, category and format, for the landing page's
 * browse lists.
 *
 * One query, grouped in memory: a per-value `head: true` count would be dozens
 * of round trips to render these cards. `formats` is an array column, so a
 * model counts once per format it ships; the values are stored uppercase
 * (STL, 3DM), matching the catalog's `?format=` filter.
 */
export async function getFacetCounts() {
  const { data } = await supabasePublic
    .from("models")
    .select("metal, stone, formats, categories ( slug )")
    .eq("status", "published")

  const metals: Record<string, number> = {}
  const stones: Record<string, number> = {}
  const formats: Record<string, number> = {}
  const categories: Record<string, number> = {}
  for (const row of (data ?? []) as unknown as {
    metal: string
    stone: string
    formats: string[] | null
    categories: { slug: string } | null
  }[]) {
    metals[row.metal] = (metals[row.metal] ?? 0) + 1
    stones[row.stone] = (stones[row.stone] ?? 0) + 1
    for (const format of row.formats ?? []) {
      formats[format] = (formats[format] ?? 0) + 1
    }
    const slug = row.categories?.slug
    if (slug) categories[slug] = (categories[slug] ?? 0) + 1
  }
  return { metals, stones, formats, categories }
}
