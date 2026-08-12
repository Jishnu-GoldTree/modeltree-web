"use server"

import { AuthError } from "next-auth"

import { signIn, signOut } from "@/auth"

/**
 * Starts an OAuth sign-in. Called from the provider buttons.
 *
 * `signIn` redirects by throwing a Next redirect error, so nothing after it
 * runs on the happy path — the catch only sees genuine auth failures, and must
 * rethrow anything else or it would swallow the redirect.
 */
export async function signInWithProvider(provider: string, redirectTo = "/") {
  try {
    await signIn(provider, { redirectTo })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Could not start sign-in with that provider." }
    }
    throw error
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}
