import "server-only"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

/**
 * Server Supabase client, bound to the request's cookies.
 *
 * `setAll` is wrapped in try/catch because Server Components are not allowed to
 * write cookies — only Server Actions and Route Handlers are. Token refresh
 * during a render therefore fails silently here, which is fine: middleware
 * refreshes the session on every request, so the write always has somewhere
 * legitimate to happen.
 */
export async function createClient() {
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
            // Called from a Server Component — middleware handles the refresh.
          }
        },
      },
    },
  )
}

/**
 * The signed-in user, or null.
 *
 * Always `getUser()`, never `getSession()`: getSession reads the cookie without
 * verifying it, so a forged cookie would pass. getUser revalidates the JWT with
 * Supabase, which is the difference between a check and a suggestion.
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
