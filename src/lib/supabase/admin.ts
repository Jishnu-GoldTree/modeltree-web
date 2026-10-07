import "server-only"

import { createClient } from "@supabase/supabase-js"

/**
 * Service-role client. Bypasses Row Level Security entirely, so it must never
 * be reachable from the browser — `server-only` makes that a build error rather
 * than a leak. Use it for seeding and admin tasks, never to serve user requests.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
