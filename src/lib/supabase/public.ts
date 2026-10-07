import { createClient } from "@supabase/supabase-js"

/**
 * Anon client with no cookie binding.
 *
 * Published listings are public, so catalog reads need no session — and this
 * client works during `generateStaticParams` and at build time, where the
 * cookie-bound server client cannot run. RLS still applies: it sees exactly
 * what an anonymous visitor sees, which is the correct blast radius for a
 * client that touches no private data.
 */
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
