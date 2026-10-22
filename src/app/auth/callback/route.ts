import { NextResponse } from "next/server"
import { hasLocale } from "next-intl"

import { getPathname } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import { createClient } from "@/lib/supabase/server"

/** Provider errors the login page has a message for; anything else is "oauth". */
const KNOWN_ERRORS = new Set(["access_denied", "server_error"])

/**
 * OAuth landing point. Supabase sends the browser back here with a one-time
 * code, which we exchange for a session cookie.
 *
 * This route is outside [locale], so `next` arrives already localised and the
 * `locale` param carries the language for the failure path.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const requested = searchParams.get("locale")
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  // Only same-site relative paths — an arbitrary `next` would make this an
  // open redirect, and "//evil.com" is protocol-relative.
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${target}`)
  }

  // Cancelling at the provider comes back with ?error= and no code.
  const providerError = searchParams.get("error") ?? ""
  const error = KNOWN_ERRORS.has(providerError) ? providerError : "oauth"
  const login = getPathname({
    href: { pathname: "/login", query: { error } },
    locale,
  })
  return NextResponse.redirect(`${origin}${login}`)
}
