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
 * Live counts per metal and per stone, for the landing page's browse lists.
 *
 * One query, grouped in memory: eleven `head: true` counts would be eleven
 * round trips to render one card.
 */
export async function getFacetCounts() {
  const { data } = await supabasePublic
    .from("models")
    .select("metal, stone")
    .eq("status", "published")

  const metals: Record<string, number> = {}
  const stones: Record<string, number> = {}
  for (const row of data ?? []) {
    metals[row.metal] = (metals[row.metal] ?? 0) + 1
    stones[row.stone] = (stones[row.stone] ?? 0) + 1
  }
  return { metals, stones }
}
