import { NextResponse } from "next/server"

import { handleField } from "@/lib/validations/forms"
import { supabasePublic } from "@/lib/supabase/public"
import { getCurrentUser } from "@/lib/supabase/server"

/**
 * Live handle availability for the profile form. The database is still the
 * authority — a citext-unique column and the save action's own conflict check —
 * so this only saves the user a round trip of typing then being rejected.
 *
 * The read is fine on the public client: handles are already public URL
 * segments, and `profiles_read` is `using (true)`. The signed-in user's own
 * handle reads as available so keeping it isn't reported as a clash.
 */
export type HandleStatus = "available" | "taken" | "self" | "invalid"

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("value") ?? ""

  const parsed = handleField.safeParse(raw)
  if (!parsed.success) return json("invalid")
  const handle = parsed.data

  const [{ data: owner }, user] = await Promise.all([
    supabasePublic.from("profiles").select("id").eq("handle", handle).maybeSingle(),
    getCurrentUser(),
  ])

  if (!owner) return json("available")
  if (user && owner.id === user.id) return json("self")
  return json("taken")
}

function json(status: HandleStatus) {
  return NextResponse.json(
    { status },
    // Per-user (own handle reads as "self") and must reflect writes instantly,
    // so it can't sit in a shared cache.
    { headers: { "Cache-Control": "no-store, private" } },
  )
}
