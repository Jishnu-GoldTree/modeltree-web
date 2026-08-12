import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

/**
 * OAuth landing point. Supabase sends the browser back here with a one-time
 * code, which we exchange for a session cookie.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  // Only same-site relative paths — an arbitrary `next` would make this an
  // open redirect, and "//evil.com" is protocol-relative.
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${target}`)
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
