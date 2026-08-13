import "server-only"

import { cookies } from "next/headers"

import { getModel, type CatalogModel } from "@/lib/data/catalog"

/**
 * Saved models, kept in a cookie for the same reasons as the cart: no database
 * yet, guests can save without an account, and the page renders server-side
 * with no empty-then-populated flash.
 *
 * A cookie is per-browser, not per-account — signing in on a second machine
 * won't bring saved models along. That's the thing a users table fixes.
 */

const COOKIE = "mt_saved"
const MAX_ITEMS = 100

export async function readFavorites(): Promise<string[]> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is string => typeof s === "string").slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

export async function writeFavorites(slugs: string[]) {
  const store = await cookies()
  if (slugs.length === 0) {
    store.delete(COOKIE)
    return
  }
  store.set(COOKIE, JSON.stringify(slugs.slice(0, MAX_ITEMS)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  })
}

/** Newest first — the last thing you saved is the thing you're looking for. */
export async function getFavoriteModels(): Promise<CatalogModel[]> {
  const slugs = await readFavorites()
  const models = await Promise.all(slugs.map((slug) => getModel(slug)))
  return models
    .filter((model): model is CatalogModel => model !== undefined)
    .reverse()
}

/** Set form, for marking cards in a grid without an O(n²) scan. */
export async function getFavoriteSet(): Promise<Set<string>> {
  return new Set(await readFavorites())
}
