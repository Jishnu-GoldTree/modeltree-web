import { unstable_cache } from "next/cache"

import type { ModelCard } from "@/lib/data/landing"
import { supabasePublic } from "@/lib/supabase/public"
import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { previewImageUrl } from "@/lib/r2/presign"

/**
 * Catalog reads, backed by Postgres.
 *
 * The exported shapes are unchanged from the generated-fixture version this
 * replaced, so pages and components did not have to move. What changed is
 * underneath: filtering, sorting, paging and facet counts now happen in the
 * database instead of over an in-memory array.
 *
 * Reads go through the anon client. Published listings are public, and RLS
 * limits this to exactly what an anonymous visitor may see — so the same code
 * serves a signed-out browser and a build-time prerender.
 *
 * Money is stored as integer cents; `price` is exposed as whole dollars (or
 * "free") because that is what the UI has always rendered.
 */

export type License = "standard" | "extended"

// Constants and enums live in `./catalog-facets` so client components can
// import them without pulling this file's server-only module graph
// (Supabase + R2 presign). Re-exported here so existing callers keep working.
import {
  FORMATS,
  METALS,
  PRODUCTION,
  STONES,
  type Metal,
  type Production,
  type Stone,
} from "./catalog-facets"
export { FORMATS, METALS, PRODUCTION, STONES }
export type { Metal, Production, Stone }

/**
 * Cache tags for the `unstable_cache`-wrapped public reads below. Mutation
 * actions call `updateTag(...)` with these so an edit or a new review is
 * reflected immediately instead of waiting out the TTL. `catalog` covers model
 * rows, related lists, images and licence pricing; `reviews` covers the review
 * list (a new review also bumps a model's denormalized rating, so a review
 * write must expire both).
 */
export const CATALOG_TAG = "catalog"
export const REVIEWS_TAG = "reviews"

export type CatalogModel = ModelCard & {
  id: string
  category: string
  license: License
  metal: Metal
  stone: Stone
  production: Production
  /** Authoritative amount in agorot. `price` is a major-unit convenience. */
  priceAgorot: number
  weightGrams: number | null
  sizeMm: number | null
  downloads: number
  polygons: number
  vertices: number
  description: string
  publishedAt: string
  /** Designer-supplied keywords. Also drive the `?tag=` browse filter. */
  tags: string[]
}

export const SORTS = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const

export type SortValue = (typeof SORTS)[number]["value"]

export const PAGE_SIZE = 24

export const LICENSE_LABELS: Record<License, string> = {
  standard: "Standard commercial",
  extended: "Extended commercial",
}

// Legacy catalogs carry retired license codes (royalty-free, editorial); the
// app now models just two tiers. Fold anything that isn't `extended` into
// `standard` so labels resolve instead of leaking the raw `license.<code>` key.
function normalizeLicense(code: string): License {
  return code === "extended" ? "extended" : "standard"
}

export type CatalogQuery = {
  category?: string
  format?: string
  price?: "free" | "paid"
  license?: License
  metal?: Metal
  stone?: Stone
  production?: Production
  tag?: string
  q?: string
  sort?: SortValue
  page?: number
}

/**
 * Path segments under /3d-models that are named filters rather than categories.
 * They exist because the nav already links them.
 */
/**
 * Path segments under /3d-models that are named filters rather than categories.
 * Titles live in the message catalog (`segment.*`) so both locales get one;
 * only the query patch belongs in code.
 */
export const COLLECTION_SEGMENTS: Record<string, { patch: Partial<CatalogQuery> }> = {
  free: { patch: { price: "free" } },
  "cast-ready": { patch: { production: "cast" } },
  "print-ready": { patch: { production: "print" } },
}

export type CatalogResult = {
  items: CatalogModel[]
  total: number
  page: number
  pageCount: number
  facets: {
    categories: Record<string, number>
    formats: Record<string, number>
    licenses: Record<string, number>
    metals: Record<string, number>
    stones: Record<string, number>
  }
}

/* ────────────────────────────────── mapping ─────────────────────────────── */

/** Shape returned by the select below; kept narrow so a schema change surfaces here. */
type ModelRow = {
  id: string
  slug: string
  title: string
  description: string | null
  price_cents: number
  license_code: License
  metal: Metal
  stone: Stone
  production: Production
  weight_grams: number | null
  size_mm: number | null
  polygons: number | null
  vertices: number | null
  download_count: number
  rating: number | null
  review_count: number
  published_at: string | null
  formats: string[]
  tags: string[]
  file_summary: { format: string; size_bytes: number }[]
  categories: { slug: string } | null
  profiles: { handle: string } | null
  /** Every preview image on this model. The cover is whichever has the lowest
   *  `position`, resolved in `toModel`. */
  model_images: { storage_key: string; position: number }[]
}

const SELECT = `
  id, slug, title, description, price_cents, license_code,
  metal, stone, production, weight_grams, size_mm, polygons, vertices,
  download_count, rating, review_count, published_at,
  formats, tags, file_summary,
  categories ( slug ),
  profiles!models_designer_id_fkey ( handle ),
  model_images ( storage_key, position )
`

/** Picks the cover key (lowest `position`) out of the images embed. */
function coverKey(images: ModelRow["model_images"]): string | undefined {
  if (!images?.length) return undefined
  return [...images].sort((a, b) => a.position - b.position)[0]?.storage_key
}

async function toModel(row: ModelRow): Promise<CatalogModel> {
  const key = coverKey(row.model_images)
  // Resolve the cover's public URL. `<Thumb>` falls back to a deterministic
  // placeholder if `cover` stays undefined, so a model with no images is
  // still renderable — we don't block on that.
  const cover = key ? await previewImageUrl(key) : undefined
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    author: row.profiles?.handle ?? "unknown",
    price: row.price_cents === 0 ? "free" : row.price_cents / 100,
    rating: row.rating ?? 0,
    reviews: row.review_count,
    formats: row.formats,
    // The generated artwork is keyed off a stable string; the slug serves that
    // role now that seeds are no longer part of the data.
    seed: row.slug,
    cover,
    category: row.categories?.slug ?? "",
    license: normalizeLicense(row.license_code),
    priceAgorot: row.price_cents,
    metal: row.metal,
    stone: row.stone,
    production: row.production,
    weightGrams: row.weight_grams,
    sizeMm: row.size_mm,
    downloads: row.download_count,
    polygons: row.polygons ?? 0,
    vertices: row.vertices ?? 0,
    publishedAt: row.published_at ?? "",
    tags: row.tags ?? [],
  }
}

/* ────────────────────────────────── queries ─────────────────────────────── */

/** Names the PostgREST builder type; the value is never called. */
 
type Builder = ReturnType<typeof baseQuery>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function baseQuery(select: string, options?: { count?: "exact"; head?: boolean }) {
  return supabasePublic
    .from("models")
    .select(select, options)
    .eq("status", "published")
}

/** Applies everything except pagination and ordering. */
function applyFilters<T extends Builder>(query: T, q: CatalogQuery): T {
  let out = query
  if (q.category) out = out.eq("categories.slug", q.category) as T
  if (q.price === "free") out = out.eq("price_cents", 0) as T
  if (q.price === "paid") out = out.gt("price_cents", 0) as T
  if (q.license) out = out.eq("license_code", q.license) as T
  if (q.metal) out = out.eq("metal", q.metal) as T
  if (q.stone) out = out.eq("stone", q.stone) as T
  // "both" is a superset, so a cast/print filter must also match it.
  if (q.production === "cast") out = out.in("production", ["cast", "both"]) as T
  if (q.production === "print") out = out.in("production", ["print", "both"]) as T
  if (q.format) {
    // Matched on the display label ("STL") until now, but the column stores the
    // extension as written in the URL ("stl"). Every `?format=` filter returned
    // an empty catalogue and every format facet counted 0. Validated against
    // FORMATS so only a known extension reaches PostgREST.
    const format = FORMATS.find((f) => f.value === q.format)?.value
    if (format) out = out.contains("formats", [format]) as T
  }
  // Exact-tag browse filter (?tag=engagement). Stored tags are lowercased, so a
  // hand-typed uppercase value is folded to match rather than silently missing.
  if (q.tag) {
    const tag = q.tag.trim().toLowerCase()
    if (tag) out = out.contains("tags", [tag]) as T
  }
  if (q.q) {
    // Search now spans title and tags. `.or()` takes a raw filter string, so the
    // term is interpolated by hand — sanitise it down to the same character set
    // tags allow (letters/numbers/space/hyphen) so a stray comma or paren can't
    // break PostgREST's grammar. Inside `or`, the ilike wildcard is `*`, not `%`.
    const term = searchTerm(q.q)
    if (term) out = out.or(`title.ilike.*${term}*,tags.cs.{"${term}"}`) as T
  }
  return out
}

/** Strips a free-text query to characters safe to splice into a PostgREST
 *  `or` filter, lowercased so it matches the stored (lowercased) tags. */
function searchTerm(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function applySort<T extends Builder>(query: T, sort: SortValue): T {
  switch (sort) {
    case "newest":
      return query.order("published_at", { ascending: false }) as T
    case "price-asc":
      return query.order("price_cents", { ascending: true }) as T
    case "price-desc":
      return query.order("price_cents", { ascending: false }) as T
    case "rating":
      return query
        .order("rating", { ascending: false, nullsFirst: false })
        .order("review_count", { ascending: false }) as T
    default:
      // "Trending" has no event data yet, so approximate with downloads.
      return query.order("download_count", { ascending: false }) as T
  }
}

/**
 * Category lives in a joined table, and PostgREST cannot filter a parent by a
 * child column without an inner join. `!inner` forces one; without it a
 * category filter silently returns every model with a null category.
 *
 * Format needs no join: it is a public array column on models, because
 * model_files is gated behind purchase and unreadable to a browsing visitor.
 */
function joinedSelect(q: CatalogQuery) {
  const category = q.category ? "categories!inner ( slug )" : "categories ( slug )"
  return `
    id, slug, title, description, price_cents, license_code,
    metal, stone, production, weight_grams, size_mm, polygons, vertices,
    download_count, rating, review_count, published_at,
    formats, tags, file_summary,
    ${category},
    profiles!models_designer_id_fkey ( handle ),
    model_images ( storage_key, position )
  `
}

const EMPTY_FACETS: CatalogResult["facets"] = {
  categories: {},
  formats: {},
  licenses: {},
  metals: {},
  stones: {},
}

// The listing rows, cached across requests via the Data Cache and keyed by the
// full query (page and sort included). Identical for every anonymous visitor
// (the anon client carries no cookies) and expired on any model or review write
// via CATALOG_TAG (see src/lib/actions/{models,reviews}.ts), with a 1h TTL
// backstop. The catalog page itself stays dynamic (it reads cookies for
// favourites) — this only spares it from re-running the Supabase listing read
// per hit.
const listModelsCached = unstable_cache(
  async (query: CatalogQuery): Promise<Omit<CatalogResult, "facets">> => {
    const page = Math.max(query.page ?? 1, 1)
    const from = (page - 1) * PAGE_SIZE

    let q = supabasePublic
      .from("models")
      .select(joinedSelect(query), { count: "exact" })
      .eq("status", "published")
    q = applyFilters(q as Builder, query) as typeof q
    const listQuery = applySort(q as Builder, query.sort ?? "trending").range(
      from,
      from + PAGE_SIZE - 1,
    )

    const { data, count, error } = await (listQuery as unknown as Promise<{
      data: ModelRow[] | null
      count: number | null
      error: { message: string } | null
    }>)

    if (error) throw new Error(`catalog query failed: ${error.message}`)

    const total = count ?? 0
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

    return {
      items: await Promise.all((data ?? []).map(toModel)),
      total,
      page: Math.min(page, pageCount),
      pageCount,
    }
  },
  ["catalog-list"],
  { revalidate: 3600, tags: [CATALOG_TAG] },
)

// Facets are the ~30-count fan-out (see computeFacets). They count the whole
// filtered set, not a page of it — neither computeFacets nor applyFilters ever
// look at page or sort — so they're cached under their own key built from the
// filter dimensions alone (see facetQuery). Walking pagination or flipping the
// sort on the same filters therefore reuses one computation instead of
// re-running the fan-out per permutation, which is the access pattern a catalog
// crawler hits hardest. Same TTL and CATALOG_TAG invalidation as the listing.
const facetsCached = unstable_cache(
  (query: CatalogQuery): Promise<CatalogResult["facets"]> => computeFacets(query),
  ["catalog-facets"],
  { revalidate: 3600, tags: [CATALOG_TAG] },
)

// The facet-relevant slice of a query: everything except paging and sort, which
// facets don't depend on. Used as the facet cache key so every page and sort of
// the same filter set collapses onto one entry.
function facetQuery(query: CatalogQuery): CatalogQuery {
  const filters = { ...query }
  delete filters.page
  delete filters.sort
  return filters
}

export async function queryModels(
  query: CatalogQuery,
  options: { facets?: boolean } = {},
): Promise<CatalogResult> {
  // Only the catalog route's sidebar renders facets; the landing trending row
  // and infinite-scroll pages discard them, so they opt out and skip the fan-out
  // entirely. Listing rows and facets are cached under different keys and
  // fetched in parallel.
  const withFacets = options.facets ?? true
  const [list, facets] = await Promise.all([
    listModelsCached(query),
    withFacets ? facetsCached(facetQuery(query)) : Promise.resolve(EMPTY_FACETS),
  ])
  return { ...list, facets }
}

/**
 * Facet counts, each computed with its own dimension dropped so the numbers
 * show what you would get by switching to that value rather than always
 * reading zero.
 */
/**
 * Every facet count, from one query per distinct filter set rather than one
 * query per offered value.
 *
 * This used to issue a HEAD count per value — roughly 37 round trips for a
 * single sidebar. That is bad enough per render, and the sidebar links multiply
 * it: each one is a `<Link>` to another filter combination, so Next prefetching
 * them renders each of those routes too, at 37 queries apiece. A single visitor
 * scrolling the filter menu could ask Supabase for a four-figure number of
 * counts. It was the largest source of API traffic on the project by an order
 * of magnitude.
 *
 * The counts are the same. For a dimension the visitor is filtering on, the
 * offered counts replace that filter rather than narrow it, so the rows to
 * count are "everything matching the other filters" — fetch those once, tally
 * the dimension's column in JS. Dimensions the visitor is not filtering on all
 * share the same row set, which is the common case and the one crawlers hit:
 * one query for the whole sidebar.
 *
 * Tallying in JS rather than grouping in Postgres because this project's
 * PostgREST rejects aggregate functions (PGRST123) — the same constraint
 * `lib/data/stats.ts` documents. That puts a ceiling on this: FACET_ROW_CAP
 * rows are fetched and no more, so counts stay exact only while the published
 * catalogue is smaller than that. Past it the numbers quietly understate, so
 * that is the point to move this to a `facet_counts()` RPC. At 30 published
 * models there is roughly 30x headroom.
 */
const FACET_ROW_CAP = 1000

/** The dimensions the sidebar offers counts for, and their row columns. */
const FACET_DIMENSIONS = ["category", "format", "license", "metal", "stone"] as const
type FacetDimension = (typeof FACET_DIMENSIONS)[number]

type FacetRow = {
  metal: string | null
  stone: string | null
  formats: string[] | null
  license_code: string | null
  categories: { slug: string } | null
}

/** The facet-bearing columns of every published row matching `query`. */
async function facetRows(query: CatalogQuery): Promise<FacetRow[]> {
  // Same rule as joinedSelect: a category filter compares a child column, which
  // needs an inner join or it matches rows with no category at all.
  const join = query.category ? "categories!inner ( slug )" : "categories ( slug )"
  let q = supabasePublic
    .from("models")
    .select(`metal, stone, formats, license_code, ${join}`)
    .eq("status", "published")
  q = applyFilters(q as unknown as Builder, query) as unknown as typeof q

  const { data, error } = await q.range(0, FACET_ROW_CAP - 1)
  if (error) throw new Error(`facet query failed: ${error.message}`)
  return (data ?? []) as unknown as FacetRow[]
}

function tally(rows: FacetRow[], read: (row: FacetRow) => string[]) {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    for (const value of read(row)) counts[value] = (counts[value] ?? 0) + 1
  }
  return counts
}

async function computeFacets(query: CatalogQuery): Promise<CatalogResult["facets"]> {
  // Group the dimensions by the query they need counted, so dimensions the
  // visitor has not filtered on collapse onto a single round trip.
  const groups = new Map<string, { query: CatalogQuery; dimensions: FacetDimension[] }>()
  for (const dimension of FACET_DIMENSIONS) {
    const reduced = { ...query }
    delete reduced[dimension]
    delete reduced.page
    delete reduced.sort
    const key = JSON.stringify(reduced, Object.keys(reduced).sort())
    const group = groups.get(key)
    if (group) group.dimensions.push(dimension)
    else groups.set(key, { query: reduced, dimensions: [dimension] })
  }

  // Seeded with every value the sidebar offers, so a facet with no matches
  // reads "0" rather than going blank — a filter that would empty the results
  // is worth showing as such.
  const categorySlugs = await allCategorySlugs()
  const facets: CatalogResult["facets"] = {
    categories: Object.fromEntries(categorySlugs.map((slug) => [slug, 0])),
    formats: Object.fromEntries(FORMATS.map((f) => [f.value, 0])),
    licenses: { standard: 0, extended: 0 },
    metals: Object.fromEntries(METALS.filter((m) => m !== "unspecified").map((m) => [m, 0])),
    stones: Object.fromEntries(STONES.filter((s) => s !== "none").map((s) => [s, 0])),
  }

  const READ: Record<FacetDimension, [keyof CatalogResult["facets"], (row: FacetRow) => string[]]> = {
    category: ["categories", (row) => (row.categories?.slug ? [row.categories.slug] : [])],
    // A model counts once per format it ships, so these exceed the model count.
    format: ["formats", (row) => row.formats ?? []],
    license: ["licenses", (row) => (row.license_code ? [row.license_code] : [])],
    metal: ["metals", (row) => (row.metal ? [row.metal] : [])],
    stone: ["stones", (row) => (row.stone ? [row.stone] : [])],
  }

  await Promise.all(
    [...groups.values()].map(async ({ query: reduced, dimensions }) => {
      const rows = await facetRows(reduced)
      for (const dimension of dimensions) {
        const [key, read] = READ[dimension]
        Object.assign(facets[key], tally(rows, read))
      }
    }),
  )

  return facets
}

// Cached across requests: the product route is force-dynamic (it reads the
// signed-in viewer per request), so without this every view would re-run all
// these public Supabase reads. The anon client carries no cookies, so the
// result is identical for every visitor and safe to share. Keyed by slug;
// expired on model writes via CATALOG_TAG, with a 1h TTL as a backstop for any
// out-of-band change (e.g. the worker bumping download_count).
export const getModel = unstable_cache(
  async (slug: string): Promise<CatalogModel | undefined> => {
    const { data } = await supabasePublic
      .from("models")
      .select(SELECT)
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle()
    return data ? await toModel(data as unknown as ModelRow) : undefined
  },
  ["catalog-model"],
  { revalidate: 3600, tags: [CATALOG_TAG] },
)

// Keyed by the primitives it actually queries on (slug, category, limit) rather
// than the whole model, so the cache key stays stable when unrelated fields on
// the source model change.
const getRelatedCached = unstable_cache(
  async (slug: string, category: string, limit: number): Promise<CatalogModel[]> => {
    const { data } = await supabasePublic
      .from("models")
      .select(`${SELECT}`)
      .eq("status", "published")
      .neq("slug", slug)
      .eq("category_id", await categoryIdFor(category))
      .order("download_count", { ascending: false })
      .limit(limit)
    return Promise.all(((data ?? []) as unknown as ModelRow[]).map(toModel))
  },
  ["catalog-related"],
  { revalidate: 3600, tags: [CATALOG_TAG] },
)

export async function getRelated(model: CatalogModel, limit = 4): Promise<CatalogModel[]> {
  return getRelatedCached(model.slug, model.category, limit)
}

async function categoryIdFor(slug: string) {
  const { data } = await supabasePublic
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()
  return data?.id ?? null
}

/**
 * Public URLs for every preview image on this model, in gallery order.
 * The product page falls back to placeholder art when this returns [].
 */
export const getModelImages = unstable_cache(
  async (modelId: string): Promise<string[]> => {
    const { data } = await supabasePublic
      .from("model_images")
      .select("storage_key, position")
      .eq("model_id", modelId)
      .order("position", { ascending: true })

    const rows = (data ?? []) as { storage_key: string; position: number }[]
    return Promise.all(rows.map((r) => previewImageUrl(r.storage_key)))
  },
  ["catalog-model-images"],
  { revalidate: 3600, tags: [CATALOG_TAG] },
)

export async function allModelSlugs(): Promise<string[]> {
  const { data } = await supabasePublic
    .from("models")
    .select("slug")
    .eq("status", "published")
  return (data ?? []).map((m) => m.slug)
}

/** Published model slugs with their publish timestamp, for `<lastmod>`. */
export async function allModelSitemapEntries(): Promise<
  { slug: string; publishedAt: string | null }[]
> {
  const { data } = await supabasePublic
    .from("models")
    .select("slug, published_at")
    .eq("status", "published")
  return (data ?? []).map((m) => ({
    slug: (m as { slug: string }).slug,
    publishedAt: (m as { published_at: string | null }).published_at,
  }))
}

/** Every category slug — the browseable `/3d-models/[segment]` category pages. */
export async function allCategorySlugs(): Promise<string[]> {
  const { data } = await supabasePublic.from("categories").select("slug")
  return (data ?? []).map((c) => (c as { slug: string }).slug)
}

/* ──────────────────────────── designer storefront ───────────────────────── */

export type Designer = {
  handle: string
  fullName: string | null
  bio: string | null
  location: string | null
  /** Raw ISO timestamp; the page formats it for the active locale. */
  memberSince: string
  models: CatalogModel[]
  stats: {
    published: number
    downloads: number
    reviews: number
    /** Mean rating across this designer's rated models; 0 when none are rated. */
    rating: number
  }
}

/**
 * A designer's public storefront: their profile plus every model they've
 * published, most-downloaded first. Reads through the anon client, so RLS
 * limits it to the same rows a signed-out visitor sees. Returns undefined for
 * an unknown handle, which the page turns into a 404.
 */
export async function getDesigner(handle: string): Promise<Designer | undefined> {
  const { data: profile } = await supabasePublic
    .from("profiles")
    .select("id, handle, full_name, bio, location, created_at")
    .eq("handle", handle)
    .maybeSingle()
  if (!profile) return undefined

  const p = profile as {
    id: string
    handle: string
    full_name: string | null
    bio: string | null
    location: string | null
    created_at: string
  }

  const { data } = await supabasePublic
    .from("models")
    .select(SELECT)
    .eq("status", "published")
    .eq("designer_id", p.id)
    .order("download_count", { ascending: false })

  const models = await Promise.all(((data ?? []) as unknown as ModelRow[]).map(toModel))

  const downloads = models.reduce((sum, m) => sum + m.downloads, 0)
  const reviews = models.reduce((sum, m) => sum + m.reviews, 0)
  const rated = models.filter((m) => m.reviews > 0)
  const rating = rated.length
    ? rated.reduce((sum, m) => sum + m.rating, 0) / rated.length
    : 0

  return {
    handle: p.handle,
    fullName: p.full_name,
    bio: p.bio,
    location: p.location,
    memberSince: p.created_at,
    models,
    stats: { published: models.length, downloads, reviews, rating },
  }
}

/** Handles of designers with at least one published model — the storefronts
 *  worth prerendering. */
export async function allDesignerHandles(): Promise<string[]> {
  const { data } = await supabasePublic
    .from("models")
    .select("profiles!models_designer_id_fkey ( handle )")
    .eq("status", "published")
  const handles = (data ?? [])
    .map((r) => (r as unknown as { profiles: { handle: string } | null }).profiles?.handle)
    .filter((h): h is string => Boolean(h))
  return [...new Set(handles)]
}

/* ─────────────────────────── product-page extras ────────────────────────── */

export type Review = {
  id: string
  author: string
  rating: number
  daysAgo: number
  body: string
}

// Only the DB read is cached (keyed by model id, expired on any review write
// via REVIEWS_TAG). `daysAgo` is derived from the cached `createdAt` at read
// time, so the relative label stays correct on a cache hit rather than freezing
// at whatever it was when the entry was written.
const getReviewRowsCached = unstable_cache(
  async (modelId: string) => {
    const { data } = await supabasePublic
      .from("reviews")
      .select("id, rating, body, created_at, profiles ( handle )")
      .eq("model_id", modelId)
      .order("created_at", { ascending: false })
      .limit(4)

    return (data ?? []).map((r) => {
      const row = r as unknown as {
        id: string
        rating: number
        body: string | null
        created_at: string
        profiles: { handle: string } | null
      }
      return {
        id: row.id,
        author: row.profiles?.handle ?? "buyer",
        rating: row.rating,
        createdAt: row.created_at,
        body: row.body ?? "",
      }
    })
  },
  ["catalog-reviews"],
  { revalidate: 3600, tags: [REVIEWS_TAG] },
)

export async function getReviews(model: CatalogModel): Promise<Review[]> {
  const rows = await getReviewRowsCached(model.id)
  return rows.map((row) => ({
    id: row.id,
    author: row.author,
    rating: row.rating,
    daysAgo: Math.max(
      0,
      Math.round((Date.now() - new Date(row.createdAt).getTime()) / 86_400_000),
    ),
    body: row.body,
  }))
}

/**
 * The "What you get" panel. Reads the public summary on models, not
 * model_files — a visitor deciding whether to buy has to see what is included,
 * but must not be able to read storage keys.
 */
export async function getFiles(model: CatalogModel) {
  const { data } = await supabasePublic
    .from("models")
    .select("file_summary")
    .eq("id", model.id)
    .maybeSingle()

  const summary = (data?.file_summary ?? []) as { format: string; size_bytes: number }[]
  return summary.map((f) => ({
    format: f.format,
    size: `${(f.size_bytes / 1_048_576).toFixed(1)} MB`,
  }))
}

/**
 * Which formats the signed-in viewer is actually allowed to download.
 *
 * Runs through the cookie-bound client, so RLS's `model_files_read` does the
 * deciding: it returns rows only to the designer who owns the model or a buyer
 * with a paid order. An empty set therefore means "not entitled" — anonymous
 * visitors and browsers get nothing, and the product page shows no download
 * buttons. The keys never leave the server; only the format labels do.
 */
export async function getDownloadableFormats(modelId: string): Promise<Set<string>> {
  const user = await getCurrentUser()
  if (!user) return new Set()

  const supabase = await createClient()
  const { data } = await supabase
    .from("model_files")
    .select("format")
    .eq("model_id", modelId)

  return new Set((data ?? []).map((row) => (row as { format: string }).format))
}

/**
 * Licence tiers. The upgrade is priced from the model's own price via the
 * multiplier on the licences table, so pricing policy is data, not code.
 *
 * A model already sold as extended has nothing to upgrade to and gets one tier
 * — otherwise the panel offers "Extended commercial" twice at two prices.
 */
// The one DB read here is the extended-tier row, which is pricing config shared
// by every model — cache it once under a static key rather than per model.
const getExtendedLicense = unstable_cache(
  async () => {
    const { data } = await supabasePublic
      .from("licenses")
      .select("label, price_multiplier")
      .eq("code", "extended")
      .maybeSingle()
    return (data ?? null) as { label: string; price_multiplier: number | string } | null
  },
  ["catalog-license-extended"],
  { revalidate: 3600, tags: [CATALOG_TAG] },
)

export async function getLicenseOptions(model: CatalogModel) {
  const base = model.price === "free" ? 0 : model.price
  const standard = {
    id: model.license,
    name: LICENSE_LABELS[model.license],
    price: base,
  }

  if (model.license === "extended") return [standard]

  const data = await getExtendedLicense()

  const multiplier = Number(data?.price_multiplier ?? 2.5)
  return [
    standard,
    {
      id: "extended",
      name: data?.label ?? LICENSE_LABELS.extended,
      price: base === 0 ? 29 : Math.round((base * multiplier) / 5) * 5,
    },
  ]
}
