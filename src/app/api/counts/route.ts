import { NextResponse } from "next/server"

import { getCart } from "@/lib/cart"
import { readFavorites } from "@/lib/favorites"

/**
 * Cart and saved counts for the header badges, which can't read the cookies
 * themselves. One endpoint rather than two so a navigation costs one request.
 */
export async function GET() {
  const [{ itemCount }, saved] = await Promise.all([getCart(), readFavorites()])
  return NextResponse.json(
    { cart: itemCount, favorites: saved.length },
    // Per-visitor and changes on every mutation — a shared cache would show
    // one shopper another's counts.
    { headers: { "Cache-Control": "no-store, private" } },
  )
}
