import "server-only"

import { cookies } from "next/headers"

import { getLicenseOptions, getModel, type CatalogModel } from "@/lib/data/catalog"

/**
 * Cart state, kept in a cookie.
 *
 * A cookie rather than a table because there's no database yet, and rather than
 * localStorage because the cart page renders on the server — reading it in the
 * page means no empty-then-populated flash. Guests keep a cart without an
 * account, which is how most of a marketplace's traffic shops.
 *
 * The trade-off is the 4KB cookie limit, hence MAX_ITEMS. When orders move to a
 * database this module is the only thing that changes.
 */

const COOKIE = "mt_cart"
const MAX_ITEMS = 40

/** Digital goods: one licence per model, so there's no quantity. */
export type CartEntry = { slug: string; license: string }

export type CartLine = {
  model: CatalogModel
  license: string
  licenseName: string
  price: number
}

export async function readCart(): Promise<CartEntry[]> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (entry): entry is CartEntry =>
          typeof entry?.slug === "string" && typeof entry?.license === "string",
      )
      .slice(0, MAX_ITEMS)
  } catch {
    // A malformed cookie is the user's problem to not have; drop it silently
    // rather than 500 the cart page.
    return []
  }
}

export async function writeCart(entries: CartEntry[]) {
  const store = await cookies()
  if (entries.length === 0) {
    store.delete(COOKIE)
    return
  }
  store.set(COOKIE, JSON.stringify(entries.slice(0, MAX_ITEMS)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

/**
 * Resolves entries to models and prices. Anything whose slug or licence no
 * longer exists is dropped rather than rendered as a broken row.
 *
 * Async because the catalog is a database now: each entry needs a lookup, and
 * they run concurrently rather than one after another.
 */
export async function toLines(entries: CartEntry[]): Promise<CartLine[]> {
  const resolved = await Promise.all(
    entries.map(async (entry) => {
      const model = await getModel(entry.slug)
      if (!model) return null
      const options = await getLicenseOptions(model)
      const option = options.find((o) => o.id === entry.license) ?? options[0]
      if (!option) return null
      return {
        model,
        license: option.id,
        licenseName: option.name,
        price: option.price,
      }
    }),
  )
  return resolved.filter((line): line is CartLine => line !== null)
}

export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, line) => sum + line.price, 0)
  return { subtotal, itemCount: lines.length, total: subtotal }
}

export async function getCart() {
  const lines = await toLines(await readCart())
  return { lines, ...cartTotals(lines) }
}
