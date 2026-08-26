"use client"

import { useQuery } from "@tanstack/react-query"

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
 * Inherits the app-wide 30s staleTime rather than forcing `staleTime: 0`. The
 * old zero meant every navigation refetched /api/counts (SiteHeader remounts
 * per page), which was pure waste — the count only moves when the user adds or
 * removes something. Those actions redirect with a `?flash=` marker, and
 * FlashToast invalidates this query on that signal, so the badge still updates
 * the instant it changes. Window-focus refetch (a Providers default) covers a
 * change made in another tab.
 */
export function useCounts() {
  const query = useQuery<Counts>({
    queryKey: countsKey,
    queryFn: async () => {
      const res = await fetch("/api/counts")
      if (!res.ok) throw new Error("Could not load counts")
      return res.json()
    },
    // A failed count must not blank the links; fall back to what we had.
    placeholderData: (previous) => previous ?? { cart: 0, favorites: 0 },
  })

  return query.data ?? { cart: 0, favorites: 0 }
}
