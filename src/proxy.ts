import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import createIntlProxy from "next-intl/middleware"

import { routing } from "@/i18n/routing"
import { COUNTRY_COOKIE, COUNTRY_HEADER } from "@/lib/geo"

/**
 * Three jobs on every request:
 *
 *   1. next-intl resolves the locale and may redirect or rewrite the URL.
 *   2. Supabase refreshes the session cookie, when there is one to refresh.
 *   3. The visitor's country is mirrored from Vercel's edge into a cookie.
 *
 * They share one response object. next-intl decides the final URL, so it runs
 * first and its response is handed to Supabase to write cookies onto. Running
 * them independently would mean one discarding the other's Set-Cookie headers.
 *
 * Named `proxy`, not `middleware`: Next 16 deprecated that file convention.
 */
const intlProxy = createIntlProxy(routing)

/**
 * Routes that must never be locale-rewritten.
 *
 * next-intl treats every path as a page, so it rewrote /api/counts to
 * /en/api/counts and /auth/callback to /he/auth/callback — both 404, which
 * silently broke the header badges and would have broken the OAuth callback the
 * moment a provider was configured. These still get the session refresh; they
 * just skip locale handling.
 */
function isNonLocalisedRoute(pathname: string) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    isMetadataImage(pathname)
  )
}

/**
 * Share cards live under `[locale]`, so their URLs carry a locale segment even
 * for the default one — `/he/opengraph-image/default`. Left to next-intl that
 * gets redirected to the unprefixed `/opengraph-image/default`, which matches
 * no route, and the Hebrew card 404s for every crawler that follows the
 * og:image tag. Serving these paths verbatim is the whole fix.
 */
function isMetadataImage(pathname: string) {
  return /\/(opengraph-image|twitter-image)(\/|$)/.test(pathname)
}

/**
 * Whether the request carries a Supabase session at all.
 *
 * Supabase stores the session in cookies named `sb-<ref>-auth-token` (chunked
 * into `.0`, `.1` suffixes once it outgrows one cookie). No such cookie means
 * an anonymous visitor — a crawler, or anyone not signed in — and there is
 * nothing to refresh. Every one of those requests used to build a Supabase
 * client and call into auth to be told exactly that.
 */
function hasSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"))
}

/**
 * Prefetches are speculative: the browser may never navigate, and Next fires
 * one per `<Link>` that scrolls into view — two dozen on a catalog page. Letting
 * them refresh the session rotates the token for links nobody clicked, and the
 * `Set-Cookie` from a prefetch races the real navigation. The refresh happens
 * on the navigation that follows.
 */
function isPrefetch(request: NextRequest) {
  return request.headers.get("next-router-prefetch") === "1"
}

export async function proxy(request: NextRequest) {
  const skipIntl = isNonLocalisedRoute(request.nextUrl.pathname)
  const start = () => (skipIntl ? NextResponse.next({ request }) : intlProxy(request))

  /**
   * Geo reaches the browser as a cookie rather than through `headers()` in the
   * layout: that call would opt the whole tree into dynamic rendering and cost
   * the catalog its static generation, for a popup. Session-scoped and rewritten
   * whenever the edge disagrees with it, so a move or a VPN corrects itself on
   * the next request.
   *
   * The header only exists on Vercel. Anywhere else the cookie is never written
   * and the visitor reads as "not Israel", which shows the language prompt —
   * the safe way to be wrong.
   */
  const country = request.headers.get(COUNTRY_HEADER)
  const withCountry = (res: NextResponse) => {
    if (country && request.cookies.get(COUNTRY_COOKIE)?.value !== country) {
      res.cookies.set(COUNTRY_COOKIE, country, { path: "/", sameSite: "lax" })
    }
    return res
  }

  let response = start()

  // A redirect from next-intl (adding the /he prefix, say) is terminal — the
  // browser comes back and the refresh happens on that request.
  if (!skipIntl && response.headers.get("location")) return withCountry(response)

  // Nothing to refresh, or nothing worth refreshing yet.
  if (!hasSessionCookie(request) || isPrefetch(request)) return withCountry(response)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          // Rebuild so any rewrite headers survive alongside the new cookies.
          const next = start()
          for (const [key, value] of response.headers) {
            if (!next.headers.has(key)) next.headers.set(key, value)
          }
          response = next
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Do not remove: this call performs the refresh. Anything between
  // createServerClient and it risks the session silently expiring.
  //
  // getClaims rather than getUser. getUser posts the JWT to Supabase Auth to be
  // validated — a network round trip on every request through here. This
  // project signs with ES256, so getClaims verifies the signature locally
  // against the project's public key and reaches the network only when the
  // token is near expiry, which is where the refresh happens anyway.
  await supabase.auth.getClaims()

  // Last, because `setAll` above rebuilds `response` from scratch.
  return withCountry(response)
}

export const config = {
  matcher: [
    /*
     * Everything except static assets, image files and the metadata routes —
     * none carry a session or need a locale, and running this on them would
     * just burn invocations.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp4)$).*)",
  ],
}
