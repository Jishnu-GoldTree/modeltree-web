"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export type Counts = { cart: number; favorites: number }

export const countsKey = ["counts"] as const

/**
 * Cart and saved counts for the header.
 *
 * These live in httpOnly cookies the browser cannot read, so the header has to
 * ask the server — and it cannot be server-rendered without making every
 * prerendered page dynamic. Both badges share one query, so this costs one
 * request regardless of how many badges render.
 *
 * `staleTime: 0` is deliberate. SiteHeader is rendered by each page rather than
 * the layout, so it remounts on every navigation; with a non-zero staleTime the
 * remount served a cached count and the badge sat at zero after adding to the
 * cart until some later navigation happened to miss the cache.
 */
export function useCounts() {
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const query = useQuery<Counts>({
    queryKey: countsKey,
    queryFn: async () => {
      const res = await fetch("/api/counts")
      if (!res.ok) throw new Error("Could not load counts")
      return res.json()
    },
    staleTime: 0,
    // A failed count must not blank the links; fall back to what we had.
    placeholderData: (previous) => previous ?? { cart: 0, favorites: 0 },
  })

  /**
   * Belt and braces for the day SiteHeader moves into the layout and stops
   * remounting. Compares against the previous pathname rather than a
   * "has mounted" flag, so it fires on a real navigation and never duplicates
   * the fetch the remount already performed.
   */
  const previousPath = useRef(pathname)
  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    queryClient.invalidateQueries({ queryKey: countsKey })
  }, [pathname, queryClient])

  return query.data ?? { cart: 0, favorites: 0 }
}
