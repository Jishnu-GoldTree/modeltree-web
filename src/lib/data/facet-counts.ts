import { FORMATS, METALS, STONES } from "./catalog-facets"
import type { CatalogQuery, CatalogResult } from "./catalog"

export type FacetRow = {
  metal: string
  stone: string
  formats: string[] | null
  license_code: string
  categories: { slug: string } | null
}

type Facets = CatalogResult["facets"]

export function emptyFacets(categories: string[]): Facets {
  const zeros = (keys: readonly string[]) => Object.fromEntries(keys.map((key) => [key, 0]))
  return {
    categories: zeros(categories),
    formats: zeros(FORMATS.map((f) => f.value)),
    licenses: zeros(["standard", "extended"]),
    metals: zeros(METALS.filter((m) => m !== "unspecified")),
    stones: zeros(STONES.filter((s) => s !== "none")),
  }
}

// Each dimension ignores its own selected value and respects the other four.
// Price, production, tag and text search have already been applied in Postgres.
export function accumulateFacets(facets: Facets, rows: FacetRow[], query: CatalogQuery) {
  const selectedFormat = FORMATS.find((f) => f.value === query.format)?.value
  const increment = (counts: Record<string, number>, value: string | undefined) => {
    if (value && Object.hasOwn(counts, value)) counts[value]++
  }
  for (const row of rows) {
    const category = !query.category || row.categories?.slug === query.category
    const format = !selectedFormat || !!row.formats?.includes(selectedFormat)
    const license = !query.license || row.license_code === query.license
    const metal = !query.metal || row.metal === query.metal
    const stone = !query.stone || row.stone === query.stone
    if (format && license && metal && stone) increment(facets.categories, row.categories?.slug)
    if (category && license && metal && stone) {
      for (const f of FORMATS) {
        if (row.formats?.includes(f.value)) increment(facets.formats, f.value)
      }
    }
    if (category && format && metal && stone) increment(facets.licenses, row.license_code)
    if (category && format && license && stone) increment(facets.metals, row.metal)
    if (category && format && license && metal) increment(facets.stones, row.stone)
  }
}
