import {
  METALS,
  PRODUCTION,
  SORTS,
  STONES,
  type CatalogQuery,
  type License,
  type Metal,
  type Production,
  type SortValue,
  type Stone,
} from "@/lib/data/catalog"

/**
 * Turns raw search params into a validated query.
 *
 * Search params are user input: anything can arrive, repeated or malformed.
 * Unknown values are dropped rather than passed through, so a hand-edited URL
 * narrows the catalog to nothing instead of throwing.
 */

export type RawParams = Record<string, string | string[] | undefined>

/** Repeated params (?format=obj&format=fbx) collapse to the first value. */
const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export function toParams(raw: RawParams): Record<string, string | undefined> {
  const keys = [
    "category",
    "format",
    "price",
    "license",
    "metal",
    "stone",
    "production",
    "tag",
    "sort",
    "page",
    "q",
  ]
  const out: Record<string, string | undefined> = {}
  for (const key of keys) {
    const value = one(raw[key])
    if (value) out[key] = value
  }
  return out
}

const LICENSES: License[] = ["royalty-free", "editorial", "extended"]

export function toQuery(params: Record<string, string | undefined>): CatalogQuery {
  const sort = SORTS.find((s) => s.value === params.sort)?.value as
    | SortValue
    | undefined
  const page = Number.parseInt(params.page ?? "1", 10)

  return {
    category: params.category,
    format: params.format,
    price:
      params.price === "free" || params.price === "paid" ? params.price : undefined,
    license: LICENSES.includes(params.license as License)
      ? (params.license as License)
      : undefined,
    metal: METALS.includes(params.metal as Metal) ? (params.metal as Metal) : undefined,
    stone: STONES.includes(params.stone as Stone) ? (params.stone as Stone) : undefined,
    production: PRODUCTION.includes(params.production as Production)
      ? (params.production as Production)
      : undefined,
    // Free-form, so no vocabulary to validate against — an unknown tag simply
    // matches nothing, which is the intended "narrows to empty" behaviour.
    tag: params.tag,
    q: params.q,
    sort,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}
