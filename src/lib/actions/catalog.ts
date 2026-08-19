"use server"

import {
  queryModels,
  type CatalogModel,
  type CatalogQuery,
} from "@/lib/data/catalog"
import { toQuery } from "@/lib/data/catalog-params"
import { getFavoriteSet } from "@/lib/favorites"

export type CatalogPageResult = {
  items: CatalogModel[]
  /** Slugs among `items` the current visitor has saved, so appended cards mount
   *  with the correct heart state. */
  favoritedSlugs: string[]
  pageCount: number
}

/**
 * Fetches one page of the catalog for infinite scroll. Page 1 is server-rendered
 * by the route; this drives pages 2+ appended on the client.
 *
 * `params` is untrusted — it comes straight from the browser — so it runs back
 * through `toQuery`, the same validator the route uses, before touching the
 * database. `patch` carries the segment's locked filter (category/collection);
 * it only narrows public published rows, so tampering changes what's shown, not
 * what's reachable.
 */
export async function loadCatalogPage(
  params: Record<string, string | undefined>,
  patch: Partial<CatalogQuery>,
  page: number,
): Promise<CatalogPageResult> {
  const result = await queryModels({ ...toQuery(params), ...patch, page })
  const favorites = await getFavoriteSet()

  return {
    items: result.items,
    favoritedSlugs: result.items
      .filter((model) => favorites.has(model.slug))
      .map((model) => model.slug),
    pageCount: result.pageCount,
  }
}
