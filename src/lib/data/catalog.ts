import type { ModelCard } from "@/lib/data/landing"
import { supabasePublic } from "@/lib/supabase/public"
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

export type License = "royalty-free" | "editorial" | "extended"

/**
 * Jewellery facets. These replaced rigged/animated/pbr, which are game-asset
 * properties: jewellery is dense static geometry, so those filtered nothing.
 * What a jeweler narrows by is metal, stone and how the piece is produced.
 */
export const METALS = [
  "yellow-gold", "white-gold", "rose-gold", "platinum", "silver", "unspecified",
] as const
export const STONES = [
  "round", "princess", "oval", "emerald", "pear", "marquise", "cushion", "none",
] as const
export const PRODUCTION = ["cast", "print", "both"] as const

export type Metal = (typeof METALS)[number]
export type Stone = (typeof STONES)[number]
export type Production = (typeof PRODUCTION)[number]

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
}

/**
 * Deliverable formats, named by extension throughout — never by the
 * application that writes them. 3DM rather than "Rhino", MAX rather than
 * "3ds Max": a jeweler asks a supplier for a file, not for a licence.
 */
export const FORMATS = [
  { value: "stl", label: "STL" },
  { value: "obj", label: "OBJ" },
  { value: "fbx", label: "FBX" },
  { value: "3dm", label: "3DM" },
  { value: "3mf", label: "3MF" },
  { value: "step", label: "STEP" },
  { value: "max", label: "MAX" },
] as const

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
  "royalty-free": "Royalty-free",
  editorial: "Editorial use",
  extended: "Extended commercial",
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
  formats, file_summary,
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
    license: row.license_code,
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
  if (q.q) out = out.ilike("title", `%${q.q}%`) as T
  return out
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
    formats, file_summary,
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
      const codes: License[] = ["royalty-free", "editorial", "extended"]
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
    blurb:
      model.license === "editorial"
        ? "Editorial and non-commercial use. One seat."
        : "One seat. Commercial use in games, film and visualisation.",
  }

  if (model.license === "extended") return [standard]

  const { data } = await supabasePublic
    .from("licenses")
    .select("code, label, blurb, price_multiplier")
    .eq("code", "extended")
    .maybeSingle()

  const multiplier = Number(data?.price_multiplier ?? 2.5)
  return [
    standard,
    {
      id: "extended",
      name: data?.label ?? LICENSE_LABELS.extended,
      price: base === 0 ? 29 : Math.round((base * multiplier) / 5) * 5,
      blurb: data?.blurb ?? "Unlimited seats, resale in end products, and merchandising.",
    },
  ]
}
