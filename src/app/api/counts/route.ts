import { NextResponse } from "next/server"

import { cartCount } from "@/lib/cart"
import { readFavorites } from "@/lib/favorites"

/**
 * Cart and saved counts for the header badges, which can't read the cookies
 * themselves. One endpoint rather than two so a navigation costs one request.
 *
 * Both sides read cookies only — no database. This endpoint used to resolve the
 * whole cart through the catalog (`getCart`) just to count it, a Supabase
 * fan-out that ran on every navigation.
 */
export async function GET() {
  const [cart, saved] = await Promise.all([cartCount(), readFavorites()])
  return NextResponse.json(
    { cart, favorites: saved.length },
    // Per-visitor and changes on every mutation — a shared cache would show
    // one shopper another's counts.
    { headers: { "Cache-Control": "no-store, private" } },
  )
}
