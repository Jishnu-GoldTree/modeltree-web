"use client"

import { useQuery } from "@tanstack/react-query"

export type Counts = { cart: number; favorites: number; saved: string[] }

export const countsKey = ["counts"] as const

const EMPTY: Counts = { cart: 0, favorites: 0, saved: [] }

/**
 * Per-visitor cookie state for the header and the model cards.
 *
 * These live in httpOnly cookies the browser cannot read, so the client has to
 * ask the server — and reading them during render would make every prerendered
 * page dynamic. Everything that needs them shares this one query, so it costs
 * one request per navigation no matter how many hearts and badges are on screen.
 *
 * Inherits the app-wide 30s staleTime rather than forcing `staleTime: 0`. The
 * old zero meant every navigation refetched /api/counts (SiteHeader remounts
 * per page), which was pure waste — the values only move when the user adds or
 * removes something. Those actions redirect with a `?flash=` marker, and
 * FlashToast invalidates this query on that signal, so the badge still updates
 * the instant it changes. Window-focus refetch (a Providers default) covers a
 * change made in another tab.
 */
export function useCounts(): Counts {
  const query = useQuery<Counts>({
    queryKey: countsKey,
    queryFn: async () => {
      const res = await fetch("/api/counts")
      if (!res.ok) throw new Error("Could not load counts")
      return res.json()
    },
    // A failed count must not blank the links; fall back to what we had.
    placeholderData: (previous) => previous ?? EMPTY,
  })

  return query.data ?? EMPTY
}

/**
 * Which models the visitor has saved, as a set for per-card lookup.
 *
 * Undefined until the query first resolves, which is the difference that
 * matters to the heart: "not saved" and "not known yet" should not look the
 * same, or every card would flash an empty heart on a prerendered page before
 * correcting itself.
 */
export function useSavedSlugs(): Set<string> | undefined {
  const { saved } = useCounts()
  return saved.length === 0 ? undefined : new Set(saved)
}
