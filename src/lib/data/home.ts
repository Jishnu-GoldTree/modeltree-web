import "server-only"

import { getCategories } from "@/lib/data/categories"
import { queryModels } from "@/lib/data/catalog"

/**
 * Homepage reads. Everything goes through `queryModels`, whose list and facet
 * reads are already cached for an hour and invalidated on catalog writes, so
 * the homepage adds no uncached database traffic of its own.
 */

/**
 * Category art until the real per-model photography lands.
 *
 * These are stills from GoldTree's own turntable renders, chosen per category
 * so each tile shows the right kind of piece. A category whose top model has a
 * real uploaded cover uses that instead; this map only fills the gap, and can
 * be deleted once every category has photographed models.
 */
const FALLBACK_ART: Record<string, string> = {
  "engagement-rings": "/videos/posters/ijewel-08.webp",
  rings: "/videos/posters/ijewel-05.webp",
  "wedding-bands": "/videos/posters/ijewel-09.webp",
  pendants: "/videos/posters/ijewel-03.webp",
  earrings: "/videos/posters/ijewel-02.webp",
  bracelets: "/videos/posters/ijewel-13.webp",
  necklaces: "/videos/posters/ijewel-06.webp",
  charms: "/videos/posters/ijewel-07.webp",
  settings: "/videos/posters/ijewel-01.webp",
  brooches: "/videos/posters/ijewel-12.webp",
  findings: "/videos/posters/ijewel-10.webp",
}
const GENERIC_ART = "/videos/posters/ijewel-04.webp"

export type HomeCategory = {
  slug: string
  count: number
  image: string
}

/**
 * Categories that actually have published models, busiest first.
 *
 * Empty categories are left out on purpose: a tile that opens onto "no models
 * found" is worse than no tile. The catalog page still lists every category
 * with its live count.
 */
export async function getHomeCategories(limit = 7): Promise<HomeCategory[]> {
  const [{ facets }, categories] = await Promise.all([
    queryModels({}, { facets: true }),
    getCategories(),
  ])

  const populated = categories
    .map((c) => ({ slug: c.slug, count: facets.categories[c.slug] ?? 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  return Promise.all(
    populated.map(async (c) => {
      const { items } = await queryModels(
        { category: c.slug, sort: "trending", page: 1 },
        { facets: false },
      )
      const cover = items.find((m) => m.cover)?.cover
      return { ...c, image: cover ?? FALLBACK_ART[c.slug] ?? GENERIC_ART }
    }),
  )
}

/** Live counts behind the cast-ready / print-ready split. */
export async function getProductionCounts() {
  const [cast, print] = await Promise.all([
    queryModels({ production: "cast", page: 1 }, { facets: false }),
    queryModels({ production: "print", page: 1 }, { facets: false }),
  ])
  return { cast: cast.total, print: print.total }
}
