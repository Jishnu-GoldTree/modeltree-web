"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { createClient } from "@/lib/supabase/server"

/**
 * Auth mutations against Supabase.
 *
 * Password sign-in and sign-up run client-side (see the forms) so the browser
 * client's session updates in place. These are the flows that must happen on
 * the server: OAuth needs the request origin to build a callback URL, and sign
 * out must clear the httpOnly cookie.
 */

export async function signInWithProvider(provider: string, redirectTo = "/") {
  const supabase = await createClient()
  const origin = (await headers()).get("origin") ?? ""

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google" | "facebook",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  })

  if (error || !data.url) {
    return { error: "Could not start sign-in with that provider." }
  }

  // Supabase returns the provider's authorize URL rather than redirecting.
  redirect(data.url)
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}
