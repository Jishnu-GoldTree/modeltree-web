/**
 * Auth configuration read by both server and client components.
 *
 * Deliberately not in `lib/actions/auth.ts`: a "use server" module may only
 * export async functions, so a plain const there is a build error.
 */

/**
 * OAuth providers enabled in the Supabase dashboard (Authentication →
 * Providers). Buttons for anything not listed render as unavailable rather
 * than dead-ending on a provider Supabase will reject.
 */
export const ENABLED_OAUTH_PROVIDERS = (
  process.env.SUPABASE_OAUTH_PROVIDERS ?? ""
)
  .split(",")
  .map((provider) => provider.trim().toLowerCase())
  .filter(Boolean)
