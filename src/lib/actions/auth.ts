"use server"

import { redirect as externalRedirect } from "next/navigation"
import { getLocale } from "next-intl/server"

import { getPathname, redirect } from "@/i18n/navigation"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { createClient } from "@/lib/supabase/server"
import { withFlash } from "@/lib/flash"
import { SITE_ORIGIN } from "@/lib/site-url"

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
  const locale = await getLocale()
  const origin = (await headers()).get("origin") ?? SITE_ORIGIN

  // /auth/callback sits outside [locale] and redirects verbatim, so it gets
  // the localised path. A bare "/next" would always land on the Hebrew root.
  const callback = new URL("/auth/callback", origin)
  callback.searchParams.set("next", getPathname({ href: redirectTo, locale }))
  callback.searchParams.set("locale", locale)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google" | "facebook",
    options: { redirectTo: callback.toString() },
  })

  if (error || !data.url) {
    return { error: "Could not start sign-in with that provider." }
  }

  // Supabase returns the provider's authorize URL rather than redirecting.
  externalRedirect(data.url)
}

export async function signOutAction() {
  const locale = await getLocale()
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect({ href: withFlash("/", "signedOut"), locale })
}
