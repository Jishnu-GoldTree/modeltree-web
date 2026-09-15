/**
 * Landing-page figures, as a static snapshot.
 *
 * These were live Supabase reads. The landing page is dynamic like every other
 * route, so every hit — crawlers included — cost five round trips to render
 * numbers that change a few times a week, and caching them still left the reads
 * on the critical path of every cold render. They are now constants, taken from
 * a real query on the date below rather than invented: the original figures
 * ("890K models") were placeholder, and a visitor who counts the catalog must
 * not catch us out.
 *
 * They do go stale. Refresh them by hand when the catalog moves — the snapshot
 * query is a single read against `models`/`profiles` filtered to
 * `status = 'published'` / `account_type = 'designer'`, matching what the
 * removed `getMarketplaceStats`/`getFacetCounts` ran (see git history of this
 * file for the exact queries).
 *
 * Snapshot taken: 2026-09-15.
 */

export type MarketplaceStats = {
  models: number
  designers: number
  downloads: number
}

/**
 * Formats a stat for display. Thousands separators, no abbreviation — "1,204"
 * reads as a real count where "1.2K" reads as marketing.
 */
export function formatStat(value: number) {
  return value.toLocaleString("en-US")
}

export const MARKETPLACE_STATS: MarketplaceStats = {
  models: 30,
  designers: 33,
  downloads: 8015,
}

/**
 * Per-facet tallies for the landing page's browse lists.
 *
 * Keys are the stored values, lowercase — `formats` especially: the rows hold
 * "stl"/"3dm", not "STL"/"3DM". The live version was keyed off the uppercase
 * display label, so every format row rendered 0; `browse-by-catalog` now looks
 * these up by `format.value`.
 *
 * A model counts once per format it ships, so the `formats` totals exceed the
 * model count. Facets with no published models are absent; callers already
 * default a missing key to 0, which is the honest answer for an empty facet.
 */
export const FACET_COUNTS = {
  metals: {
    "yellow-gold": 15,
    "white-gold": 7,
    "rose-gold": 7,
    platinum: 1,
  } as Record<string, number>,
  stones: {
    round: 24,
    oval: 1,
    marquise: 1,
    none: 4,
  } as Record<string, number>,
  formats: {
    stl: 30,
    "3dm": 29,
    obj: 23,
    "3mf": 4,
  } as Record<string, number>,
  categories: {
    "engagement-rings": 15,
    rings: 9,
    "wedding-bands": 6,
  } as Record<string, number>,
}
