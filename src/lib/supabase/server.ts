import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { UserMetadata } from "@supabase/supabase-js"

/**
 * Server Supabase client, bound to the request's cookies.
 *
 * `setAll` is wrapped in try/catch because Server Components are not allowed to
 * write cookies — only Server Actions and Route Handlers are. Token refresh
 * during a render therefore fails silently here, which is fine: the proxy
 * refreshes the session on every request, so the write always has somewhere
 * legitimate to happen.
 *
 * Wrapped in React's `cache` so one render builds one client. Every caller used
 * to construct its own, which meant re-reading the cookie jar per call and
 * giving each client its own auth state to fetch and refresh.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a Server Component — the proxy handles the refresh.
          }
        },
      },
    },
  )
})

/**
 * The fields of the signed-in user this app actually reads. Deliberately not
 * Supabase's `User`: everything here comes out of the verified access token, so
 * the type says what is genuinely available rather than promising the full
 * profile row and then not having it.
 */
export type Viewer = {
  id: string
  email?: string
  user_metadata: UserMetadata
}

/**
 * The signed-in user, or null.
 *
 * `getClaims()`, not `getUser()`. Both verify — the point is *where*. getUser
 * asks Supabase Auth to validate the JWT over the network, once per call; this
 * project signs tokens with ES256, so getClaims verifies the signature locally
 * against the project's public key (fetched once and cached) and only reaches
 * the network to refresh an expiring token. That is the same cryptographic
 * guarantee without a round trip per render, and it was the single biggest
 * source of Supabase requests: one per page, plus one per RSC prefetch, plus
 * one per header badge poll.
 *
 * Never `getSession()`, which reads the cookie without verifying it at all.
 *
 * What this does not do is catch a token revoked mid-life (a user deleted or
 * banned inside the access token's hour). Nothing here grants access on the
 * strength of that: every read and write is authorised by RLS, which validates
 * the JWT again at the database. This decides which UI to render, not what the
 * viewer may touch.
 *
 * `cache` makes it request-scoped — a product page asks for the viewer from the
 * download panel, the review form and the favourite button independently.
 */
export const getCurrentUser = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) return null

  const { sub, email, user_metadata } = data.claims
  return { id: sub, email, user_metadata: user_metadata ?? {} }
})
