import type { ModelCard } from "@/lib/data/landing"
import { ASSET_CATEGORIES } from "@/lib/data/landing"

/**
 * Stand-in catalog.
 *
 * The landing page only needed eight hand-written models; a catalog needs
 * enough rows to actually exercise filtering, sorting and paging. These are
 * generated from a fixed seed, so the set is identical on server and client and
 * stable across deploys — a model keeps its price, rating and URL.
 *
 * `queryModels` is the seam: it takes the same shape a real endpoint would and
 * returns items plus facet counts. When the catalog service exists, this module
 * is what gets replaced, and the pages above it shouldn't need to change.
 */

export type License = "royalty-free" | "editorial" | "extended"

export type CatalogModel = ModelCard & {
  category: string
  license: License
  rigged: boolean
  animated: boolean
  pbr: boolean
  /** Days since publication — relative so the data never looks stale. */
  ageDays: number
  downloads: number
  polygons: number
  vertices: number
  description: string
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

/**
 * Path segments under /3d-models that aren't categories but named filters.
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

/* --------------------------------------------------------------- generation */

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Per-category vocabulary, so titles read like real listings. */
const SUBJECTS: Record<string, string[]> = {
  exterior: ["Modern Villa", "Office Tower", "Warehouse District", "Row Houses", "Petrol Station"],
  car: ["Sports Coupe", "City Hatchback", "Pickup Truck", "Rally Car", "Classic Roadster"],
  aircraft: ["Airliner", "Bush Plane", "Attack Helicopter", "Cargo Drone", "Glider"],
  furniture: ["Lounge Chair", "Modular Sofa", "Oak Dining Set", "Standing Desk", "Shelving Unit"],
  military: ["Supply Truck", "Field Radio", "Patrol Boat", "Ammo Crate", "Recon Drone"],
  character: ["Fantasy Knight", "Street Runner", "Sci-fi Marine", "Village Elder", "Cyber Courier"],
  animal: ["Grey Wolf", "Barn Owl", "Reef Shark", "Highland Cow", "Desert Fox"],
  plant: ["Broadleaf Tree Pack", "Fern Cluster", "Potted Monstera", "Wheat Field", "Coral Set"],
  food: ["Bakery Set", "Ramen Bowl", "Fruit Crate", "Coffee Service", "Street Taco Cart"],
}

const QUALIFIERS = [
  "Game Ready",
  "PBR Textured",
  "Photoscan",
  "Low Poly",
  "High Detail",
  "Modular Kit",
  "Production Ready",
]

/**
 * Only things with joints get rigged or animated. Without this the generator
 * happily produces "Modern Villa — Rigged", which reads as obviously fake to
 * anyone who works in 3D.
 */
const ARTICULATED = new Set(["character", "animal", "aircraft", "military", "car"])

const AUTHORS = [
  "kamarabay",
  "heritage3d",
  "studio.nord",
  "velocity.cg",
  "polyforge",
  "atelier9",
  "mesh.labs",
  "northlight",
]

const LICENSES: License[] = ["royalty-free", "editorial", "extended"]

function buildCatalog(): CatalogModel[] {
  const next = rng(0x4d54)
  const models: CatalogModel[] = []
  const categories = ASSET_CATEGORIES.map((c) => c.slug)

  for (const category of categories) {
    const subjects = SUBJECTS[category] ?? ["Asset"]
    for (let i = 0; i < 8; i++) {
      const subject = subjects[i % subjects.length]
      const articulated = ARTICULATED.has(category)
      const rigged = articulated && next() < 0.55
      const qualifier = rigged
        ? "Rigged"
        : QUALIFIERS[Math.floor(next() * QUALIFIERS.length)]
      const variant = i >= subjects.length ? ` Vol. ${Math.floor(i / subjects.length) + 1}` : ""
      const title = `${subject}${variant} — ${qualifier}`

      // A fifth of the catalog is free; the rest lands on a realistic curve.
      const free = next() < 0.2
      const price = free ? "free" : Math.round((9 + next() * 240) / 5) * 5

      const formatCount = 2 + Math.floor(next() * 3)
      const formats = [...FORMATS]
        .sort(() => next() - 0.5)
        .slice(0, formatCount)
        .map((f) => f.label)

      const polygons = Math.round((900 + next() ** 2 * 340_000) / 100) * 100
      const scanned = qualifier === "Photoscan"

      models.push({
        slug: `${category}-${subject.toLowerCase().replace(/[^a-z0-9]+/g, "-")}${variant ? `-v${Math.floor(i / subjects.length) + 1}` : ""}`,
        title,
        author: AUTHORS[Math.floor(next() * AUTHORS.length)],
        price,
        rating: Math.round((3.6 + next() * 1.4) * 10) / 10,
        reviews: Math.floor(next() * 480) + 4,
        formats,
        badge: next() < 0.14 ? "Top rated" : undefined,
        seed: `${category}-${i}`,
        category,
        license: LICENSES[Math.floor(next() * LICENSES.length)],
        rigged,
        animated: rigged && next() < 0.6,
        pbr: qualifier === "PBR Textured" || next() < 0.45,
        ageDays: Math.floor(next() * 720),
        downloads: Math.floor(next() * 9_400) + 12,
        polygons,
        vertices: Math.round(polygons * (0.5 + next() * 0.4)),
        description: `${subject} built for ${
          polygons < 12_000 ? "real-time engines" : "close-up renders"
        }, delivered in ${formats.join(", ")}. ${
          scanned ? "Captured from the real object by photogrammetry and retopologised." : "Clean quad topology with non-overlapping UVs."
        }`,
      })
    }
  }

  return models
}

const CATALOG = buildCatalog()

/* ------------------------------------------------------------------ queries */

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

function matches(model: CatalogModel, query: CatalogQuery) {
  if (query.category && model.category !== query.category) return false
  if (query.price === "free" && model.price !== "free") return false
  if (query.price === "paid" && model.price === "free") return false
  if (query.license && model.license !== query.license) return false
  if (query.rigged && !model.rigged) return false
  if (query.animated && !model.animated) return false
  if (query.pbr && !model.pbr) return false
  if (query.maxPolygons && model.polygons > query.maxPolygons) return false
  if (query.tag === "scanned" && !model.title.includes("Photoscan")) return false
  if (query.format) {
    const label = FORMATS.find((f) => f.value === query.format)?.label
    if (!label || !model.formats.includes(label)) return false
  }
  if (query.q) {
    const needle = query.q.toLowerCase()
    const haystack = `${model.title} ${model.author} ${model.category}`.toLowerCase()
    if (!haystack.includes(needle)) return false
  }
  return true
}

const numericPrice = (price: ModelCard["price"]) => (price === "free" ? 0 : price)

function compare(sort: SortValue) {
  switch (sort) {
    case "newest":
      return (a: CatalogModel, b: CatalogModel) => a.ageDays - b.ageDays
    case "price-asc":
      return (a: CatalogModel, b: CatalogModel) =>
        numericPrice(a.price) - numericPrice(b.price)
    case "price-desc":
      return (a: CatalogModel, b: CatalogModel) =>
        numericPrice(b.price) - numericPrice(a.price)
    case "rating":
      return (a: CatalogModel, b: CatalogModel) =>
        b.rating - a.rating || b.reviews - a.reviews
    default:
      // "Trending" has no real signal yet, so approximate it with downloads
      // weighted by rating. Swap for actual event data once it exists.
      return (a: CatalogModel, b: CatalogModel) =>
        b.downloads * b.rating - a.downloads * a.rating
  }
}

export type CatalogResult = {
  items: CatalogModel[]
  total: number
  page: number
  pageCount: number
  /** Result counts per facet value, computed against the rest of the query. */
  facets: {
    categories: Record<string, number>
    formats: Record<string, number>
    licenses: Record<string, number>
  }
}

export function queryModels(query: CatalogQuery): CatalogResult {
  const filtered = CATALOG.filter((model) => matches(model, query))

  // Each facet is counted with its own dimension dropped, so the numbers show
  // what you'd get by switching to that value rather than always reading zero.
  const countBy = <K extends keyof CatalogQuery>(
    drop: K,
    key: (model: CatalogModel) => string | string[],
  ) => {
    const rest = { ...query, [drop]: undefined }
    const counts: Record<string, number> = {}
    for (const model of CATALOG) {
      if (!matches(model, rest)) continue
      const values = key(model)
      for (const value of Array.isArray(values) ? values : [values]) {
        counts[value] = (counts[value] ?? 0) + 1
      }
    }
    return counts
  }

  const sorted = [...filtered].sort(compare(query.sort ?? "trending"))
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const page = Math.min(Math.max(query.page ?? 1, 1), pageCount)
  const start = (page - 1) * PAGE_SIZE

  return {
    items: sorted.slice(start, start + PAGE_SIZE),
    total: sorted.length,
    page,
    pageCount,
    facets: {
      categories: countBy("category", (m) => m.category),
      formats: countBy("format", (m) =>
        m.formats.map(
          (label) => FORMATS.find((f) => f.label === label)?.value ?? label,
        ),
      ),
      licenses: countBy("license", (m) => m.license),
    },
  }
}

export function getModel(slug: string) {
  return CATALOG.find((model) => model.slug === slug)
}

/** Same category, excluding the model itself. */
export function getRelated(model: CatalogModel, limit = 4) {
  return CATALOG.filter(
    (candidate) =>
      candidate.category === model.category && candidate.slug !== model.slug,
  ).slice(0, limit)
}

export function allModelSlugs() {
  return CATALOG.map((model) => model.slug)
}

export const LICENSE_LABELS: Record<License, string> = {
  "royalty-free": "Royalty-free",
  editorial: "Editorial use",
  extended: "Extended commercial",
}

/* ------------------------------------------------------ detail-page extras */

export type Review = {
  id: string
  author: string
  rating: number
  daysAgo: number
  body: string
}

const REVIEW_BODIES = [
  "Topology is clean and the UVs unwrapped without a single overlap. Dropped straight into the scene.",
  "Good value for the price. Textures are 4K and hold up in close-ups, though the normal map is a little soft.",
  "Exactly what the description says. Imported into Blender with no scale issues.",
  "Solid asset. Would have liked a lower-poly LOD included, but I made one in ten minutes.",
  "Used this on a client project last week — renders beautifully with area lights.",
  "The rig is sensible and the weight painting is better than most assets at this price.",
]

const REVIEWERS = [
  "marta.k", "j_okafor", "renderhaus", "pixelsmith", "atelier.nine", "tomek3d", "sunhee.p",
]

/**
 * Reviews for a model, derived from its slug so they stay put across renders.
 * The count is anchored to the model's own review total, so the header figure
 * and the list below it can't disagree.
 */
export function getReviews(model: CatalogModel): Review[] {
  const next = rng(hashString(model.slug))
  // Always show a few: a page claiming 400 reviews that lists one reads as
  // broken, and these stand in for a "most helpful" selection anyway.
  const count = Math.min(4, Math.max(3, Math.round(model.reviews / 90)))

  return Array.from({ length: count }, (_, i) => {
    // Keep individual scores near the model's average, clamped to 1–5.
    const drift = (next() - 0.45) * 1.6
    const rating = Math.min(5, Math.max(1, Math.round(model.rating + drift)))
    return {
      id: `${model.slug}-r${i}`,
      author: REVIEWERS[Math.floor(next() * REVIEWERS.length)],
      rating,
      daysAgo: Math.floor(next() * 240) + 2,
      body: REVIEW_BODIES[Math.floor(next() * REVIEW_BODIES.length)],
    }
  })
}

function hashString(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** Per-format file listing for the "what you get" panel. */
export function getFiles(model: CatalogModel) {
  const next = rng(hashString(`${model.slug}-files`))
  return model.formats.map((format) => ({
    format,
    // Rough size correlation with mesh density; enough to look plausible.
    size: `${(model.polygons / 42_000 + next() * 18 + 2).toFixed(1)} MB`,
  }))
}

/**
 * License tiers. The upgrade is priced as a multiple of the base rather than a
 * flat figure, so a $9 asset and a $240 asset both come out sensible.
 *
 * A model already sold under the extended license has nothing to upgrade to,
 * so it gets a single tier — otherwise the panel offers "Extended commercial"
 * twice at two different prices.
 */
export function getLicenseOptions(model: CatalogModel) {
  const base = model.price === "free" ? 0 : model.price
  const standard = {
    id: "standard",
    name: LICENSE_LABELS[model.license],
    price: base,
    blurb:
      model.license === "editorial"
        ? "Editorial and non-commercial use. One seat."
        : "One seat. Commercial use in games, film and visualisation.",
  }

  if (model.license === "extended") return [standard]

  return [
    standard,
    {
      id: "extended",
      name: LICENSE_LABELS.extended,
      price: base === 0 ? 29 : Math.round((base * 2.5) / 5) * 5,
      blurb: "Unlimited seats, resale in end products, and merchandising.",
    },
  ]
}
