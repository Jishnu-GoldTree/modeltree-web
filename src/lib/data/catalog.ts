import type { ModelCard } from "@/lib/data/landing"
import { supabasePublic } from "@/lib/supabase/public"
import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { presignGet } from "@/lib/r2/presign"

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
  // Sign the cover on demand. `<Thumb>` falls back to a deterministic
  // placeholder if `cover` stays undefined, so a model with no images is
  // still renderable — we don't block on that.
  const cover = key ? await presignGet(key) : undefined
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
    const label = FORMATS.find((f) => f.value === q.format)?.label
    if (label) out = out.contains("formats", [label]) as T
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

export async function queryModels(query: CatalogQuery): Promise<CatalogResult> {

  const build = (select: string, count?: "exact") => {
    let q = supabasePublic
      .from("models")
      .select(select, count ? { count } : undefined)
      .eq("status", "published")
    q = applyFilters(q as Builder, query) as typeof q
    return q
  }

  const page = Math.max(query.page ?? 1, 1)
  const from = (page - 1) * PAGE_SIZE

  const listQuery = applySort(build(joinedSelect(query), "exact") as Builder, query.sort ?? "trending")
    .range(from, from + PAGE_SIZE - 1)

  const [{ data, count, error }, facets] = await Promise.all([
    listQuery as unknown as Promise<{
      data: ModelRow[] | null
      count: number | null
      error: { message: string } | null
    }>,
    computeFacets(query),
  ])

  if (error) throw new Error(`catalog query failed: ${error.message}`)

  const total = count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return {
    items: await Promise.all((data ?? []).map(toModel)),
    total,
    page: Math.min(page, pageCount),
    pageCount,
    facets,
  }
}

/**
 * Facet counts, each computed with its own dimension dropped so the numbers
 * show what you would get by switching to that value rather than always
 * reading zero.
 */
async function computeFacets(query: CatalogQuery): Promise<CatalogResult["facets"]> {
  const countFor = async (patch: CatalogQuery) => {
    const merged = { ...query, ...patch }
    let q = supabasePublic
      .from("models")
      .select(
        `id, ${merged.category ? "categories!inner ( slug )" : "categories ( slug )"}`,
        { count: "exact", head: true },
      )
      .eq("status", "published")
    q = applyFilters(q as unknown as Builder, merged) as unknown as typeof q
    const { count } = await q
    return count ?? 0
  }

  const [categories, formats, licenses, metals, stones] = await Promise.all([
    (async () => {
      const { data } = await supabasePublic.from("categories").select("slug")
      const entries = await Promise.all(
        (data ?? []).map(async (c) => [c.slug, await countFor({ category: c.slug })] as const),
      )
      return Object.fromEntries(entries)
    })(),
    (async () => {
      const entries = await Promise.all(
        FORMATS.map(async (f) => [f.value, await countFor({ format: f.value })] as const),
      )
      return Object.fromEntries(entries)
    })(),
    (async () => {
      const codes: License[] = ["standard", "extended"]
      const entries = await Promise.all(
        codes.map(async (code) => [code, await countFor({ license: code })] as const),
      )
      return Object.fromEntries(entries)
    })(),
    (async () => {
      // "unspecified" is a storage default, not something to offer as a filter.
      const entries = await Promise.all(
        METALS.filter((m) => m !== "unspecified").map(
          async (metal) => [metal, await countFor({ metal })] as const,
        ),
      )
      return Object.fromEntries(entries)
    })(),
    (async () => {
      const entries = await Promise.all(
        STONES.filter((s) => s !== "none").map(
          async (stone) => [stone, await countFor({ stone })] as const,
        ),
      )
      return Object.fromEntries(entries)
    })(),
  ])

  return { categories, formats, licenses, metals, stones }
}

export async function getModel(slug: string): Promise<CatalogModel | undefined> {
  const { data } = await supabasePublic
    .from("models")
    .select(SELECT)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle()
  return data ? await toModel(data as unknown as ModelRow) : undefined
}

export async function getRelated(model: CatalogModel, limit = 4): Promise<CatalogModel[]> {
  const { data } = await supabasePublic
    .from("models")
    .select(`${SELECT}`)
    .eq("status", "published")
    .neq("slug", model.slug)
    .eq("category_id", await categoryIdFor(model.category))
    .order("download_count", { ascending: false })
    .limit(limit)
  return Promise.all(((data ?? []) as unknown as ModelRow[]).map(toModel))
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
 * Signed URLs for every preview image on this model, in gallery order.
 * The product page falls back to placeholder art when this returns [].
 */
export async function getModelImages(modelId: string): Promise<string[]> {
  const { data } = await supabasePublic
    .from("model_images")
    .select("storage_key, position")
    .eq("model_id", modelId)
    .order("position", { ascending: true })

  const rows = (data ?? []) as { storage_key: string; position: number }[]
  return Promise.all(rows.map((r) => presignGet(r.storage_key)))
}

export async function allModelSlugs(): Promise<string[]> {
  const { data } = await supabasePublic
    .from("models")
    .select("slug")
    .eq("status", "published")
  return (data ?? []).map((m) => m.slug)
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

export async function getReviews(model: CatalogModel): Promise<Review[]> {
  const { data } = await supabasePublic
    .from("reviews")
    .select("id, rating, body, created_at, profiles ( handle )")
    .eq("model_id", model.id)
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
      daysAgo: Math.max(
        0,
        Math.round((Date.now() - new Date(row.created_at).getTime()) / 86_400_000),
      ),
      body: row.body ?? "",
    }
  })
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
export async function getLicenseOptions(model: CatalogModel) {
  const base = model.price === "free" ? 0 : model.price
  const standard = {
    id: model.license,
    name: LICENSE_LABELS[model.license],
    price: base,
  }

  if (model.license === "extended") return [standard]

  const { data } = await supabasePublic
    .from("licenses")
    .select("label, price_multiplier")
    .eq("code", "extended")
    .maybeSingle()

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
