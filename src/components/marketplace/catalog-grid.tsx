"use client"

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react"
import { Loader2 } from "lucide-react"

import { ModelCard } from "@/components/marketplace/model-card"
import { loadCatalogPage } from "@/lib/actions/catalog"
import type { CatalogModel, CatalogQuery } from "@/lib/data/catalog"

/**
 * The catalog grid with infinite scroll. Page 1 arrives server-rendered (so the
 * listing stays crawlable and RLS-gated); this appends pages 2+ on the client
 * via a server action, replacing numbered pagination.
 *
 * A `key` on this component — set by the caller from the active filters — resets
 * the accumulated pages when the query changes, since `useState` would otherwise
 * keep the previous filter's results on a client-side navigation.
 */
export function CatalogGrid({
  initialItems,
  initialFavoritedSlugs,
  params,
  patch,
  initialPage,
  pageCount,
  promo,
  loadMoreLabel,
  errorLabel,
}: {
  initialItems: CatalogModel[]
  initialFavoritedSlugs: string[]
  params: Record<string, string | undefined>
  patch: Partial<CatalogQuery>
  initialPage: number
  pageCount: number
  /** The membership strip, rendered on the server and slotted after the first
   *  row so its translated copy and links stay out of this client bundle. */
  promo: ReactNode
  loadMoreLabel: string
  errorLabel: string
}) {
  const [items, setItems] = useState(initialItems)
  const [favorited, setFavorited] = useState(() => new Set(initialFavoritedSlugs))
  const [page, setPage] = useState(initialPage)
  const [error, setError] = useState(false)
  const [pending, startTransition] = useTransition()

  const hasMore = page < pageCount
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const loadMore = useCallback(() => {
    if (pending || !hasMore) return
    const next = page + 1
    setError(false)
    startTransition(async () => {
      try {
        const result = await loadCatalogPage(params, patch, next)
        setItems((prev) => [...prev, ...result.items])
        setFavorited((prev) => {
          const merged = new Set(prev)
          for (const slug of result.favoritedSlugs) merged.add(slug)
          return merged
        })
        setPage(next)
      } catch {
        setError(true)
      }
    })
  }, [pending, hasMore, page, params, patch])

  // Prefetch the next page a little before the sentinel is on screen so the grid
  // stays ahead of a fast scroll. Skipped once every page is loaded.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: "800px 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  return (
    <>
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((model, index) => (
          <Fragment key={model.slug}>
            <li>
              <ModelCard model={model} favorited={favorited.has(model.slug)} />
            </li>
            {/* After the first full row rather than above the grid: it reaches
                someone already comparing pieces. Index 4 matches exactly one
                item and stays put as later pages append, so it shows once. */}
            {index === 4 && (
              <li className="col-span-2 sm:col-span-3 lg:col-span-4 xl:col-span-5">
                {promo}
              </li>
            )}
          </Fragment>
        ))}
      </ul>

      {hasMore && (
        <div className="flex flex-col items-center gap-3 pt-10">
          {/* The sentinel drives auto-loading; the button is the keyboard- and
              no-JS-observer fallback that does the same thing. */}
          <div ref={sentinelRef} aria-hidden className="h-px w-full" />
          <button
            type="button"
            onClick={loadMore}
            disabled={pending}
            className="inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-brand/50 disabled:opacity-60"
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {loadMoreLabel}
          </button>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {errorLabel}
            </p>
          )}
        </div>
      )}
    </>
  )
}
