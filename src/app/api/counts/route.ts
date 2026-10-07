import { NextResponse } from "next/server"

import { cartCount } from "@/lib/cart"
import { readFavorites } from "@/lib/favorites"

/**
 * Per-visitor cookie state the prerendered pages can't read themselves: the
 * header's cart and saved counts, and which models are saved. One endpoint
 * rather than three so a navigation costs one request.
 *
 * The saved *slugs* are here, not just their count, because the heart on every
 * model card needs them. Reading them during render is what used to make the
 * landing page and both catalog routes dynamic — the card already documented
 * that it takes `favorited` as a prop for exactly this reason, and this is the
 * other half of that: the pages prerender, and the hearts fill in from here.
 *
 * All three read cookies only — no database. This endpoint used to resolve the
 * whole cart through the catalog (`getCart`) just to count it, a Supabase
 * fan-out that ran on every navigation.
 */
export async function GET() {
  const [cart, saved] = await Promise.all([cartCount(), readFavorites()])
  return NextResponse.json(
    { cart, favorites: saved.length, saved },
    // Per-visitor and changes on every mutation — a shared cache would show
    // one shopper another's counts.
    { headers: { "Cache-Control": "no-store, private" } },
  )
}
