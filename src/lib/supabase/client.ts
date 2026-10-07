"use client"

import { createBrowserClient } from "@supabase/ssr"

/**
 * Browser Supabase client. Reads the session from cookies written by the
 * server, so client and server agree on who is signed in.
 *
 * The publishable key is meant to ship to the browser — Row Level Security is
 * what protects the data, not key secrecy.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
