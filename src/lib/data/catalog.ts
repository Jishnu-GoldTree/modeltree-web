import type { ModelCard } from "@/lib/data/landing"
import { supabasePublic } from "@/lib/supabase/public"

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

export type CatalogModel = ModelCard & {
  id: string
  category: string
  license: License
  rigged: boolean
  animated: boolean
  pbr: boolean
  downloads: number
  polygons: number
  vertices: number
  description: string
  publishedAt: string
}

export const FORMATS = [
  { value: "obj", label: "OBJ" },
  { value: "fbx", label: "FBX" },
  { value: "max", label: "3ds Max" },
  { value: "stl", label: "STL" },
  { value: "blend", label: "Blender" },
  { value: "c4d", label: "Cinema 4D" },
  { value: "ma", label: "Maya" },
  { value: "gltf", label: "glTF" },
  { value: "uasset", label: "Unreal Engine" },
  { value: "unity", label: "Unity 3D" },
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
  rigged?: boolean
  animated?: boolean
  pbr?: boolean
  maxPolygons?: number
  tag?: string
  q?: string
  sort?: SortValue
  page?: number
}

/**
 * Path segments under /3d-models that are named filters rather than categories.
 * They exist because the nav already links them.
 */
export const COLLECTION_SEGMENTS: Record<
  string,
  { title: string; description: string; patch: Partial<CatalogQuery> }
> = {
  free: {
    title: "Free 3D models",
    description: "Zero-cost assets with commercial licensing.",
    patch: { price: "free" },
  },
  rigged: {
    title: "Rigged 3D models",
    description: "Production-ready characters and creatures with skeletons.",
    patch: { rigged: true },
  },
  "low-poly": {
    title: "Low poly 3D models",
    description: "Game-optimized meshes under 10k triangles.",
    patch: { maxPolygons: 10_000 },
  },
  scanned: {
    title: "Scanned 3D models",
    description: "Photogrammetry captures of real-world objects.",
    patch: { tag: "scanned" },
  },
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
  rigged: boolean
  animated: boolean
  pbr: boolean
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
}

const SELECT = `
  id, slug, title, description, price_cents, license_code,
  rigged, animated, pbr, polygons, vertices,
  download_count, rating, review_count, published_at,
  formats, file_summary,
  categories ( slug ),
  profiles!models_designer_id_fkey ( handle )
`

function toModel(row: ModelRow): CatalogModel {
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
    category: row.categories?.slug ?? "",
    license: row.license_code,
    rigged: row.rigged,
    animated: row.animated,
    pbr: row.pbr,
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
  if (q.rigged) out = out.eq("rigged", true) as T
  if (q.animated) out = out.eq("animated", true) as T
  if (q.pbr) out = out.eq("pbr", true) as T
  if (q.maxPolygons) out = out.lte("polygons", q.maxPolygons) as T
  if (q.format) {
    const label = FORMATS.find((f) => f.value === q.format)?.label
    if (label) out = out.contains("formats", [label]) as T
  }
  if (q.tag === "scanned") out = out.ilike("title", "%Photoscan%") as T
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
    rigged, animated, pbr, polygons, vertices,
    download_count, rating, review_count, published_at,
    formats, file_summary,
    ${category},
    profiles!models_designer_id_fkey ( handle )
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
    items: (data ?? []).map(toModel),
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

  const [categories, formats, licenses] = await Promise.all([
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
  ])

  return { categories, formats, licenses }
}

export async function getModel(slug: string): Promise<CatalogModel | undefined> {
  const { data } = await supabasePublic
    .from("models")
    .select(SELECT)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle()
  return data ? toModel(data as unknown as ModelRow) : undefined
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
  return ((data ?? []) as unknown as ModelRow[]).map(toModel)
}

async function categoryIdFor(slug: string) {
  const { data } = await supabasePublic
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()
  return data?.id ?? null
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
