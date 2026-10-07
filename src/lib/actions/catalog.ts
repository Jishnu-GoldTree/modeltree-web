"use server"

import {
  queryModels,
  type CatalogModel,
  type CatalogQuery,
} from "@/lib/data/catalog"
import { toQuery } from "@/lib/data/catalog-params"

export type CatalogPageResult = {
  items: CatalogModel[]
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
  // Infinite scroll only appends cards; the facet sidebar is rendered once by
  // the route and never re-read here, so skip the ~32 count queries per page.
  const result = await queryModels({ ...toQuery(params), ...patch, page }, { facets: false })

  return {
    items: result.items,
    pageCount: result.pageCount,
  }
}
