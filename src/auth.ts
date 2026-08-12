import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Credentials from "next-auth/providers/credentials"

import { findDemoUser } from "@/lib/data/account"

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Sessions are JWT-backed, not database-backed: without an adapter there is
 * nowhere to persist a session row, and a JWT strategy keeps the marketplace
 * deployable to Vercel's edge without provisioning a database first. Swap in an
 * adapter (and `session.strategy = "database"`) once user records need to
 * outlive the token — orders, licences and payouts will all need that.
 *
 * Providers are registered only when their credentials are present. A provider
 * with an undefined clientId throws at request time, which would take the whole
 * site down rather than just the button that can't work yet.
 */

const providers = []

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  )
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  )
}

/**
 * Fixture sign-in, so the signed-in screens can be demoed before a user
 * database exists.
 *
 * ON everywhere, production included, because the deployed site is currently a
 * demo and the client needs to sign in on it. That means anyone who finds the
 * URL can sign in as these accounts — and the login page prints the credentials
 * — so this MUST be switched off before real users exist. Two ways:
 * set AUTH_DEMO=0 in the environment, or delete this provider along with
 * `lib/data/account` once a real user table lands.
 */
export const demoAuthEnabled = process.env.AUTH_DEMO !== "0"

if (demoAuthEnabled) {
  providers.push(
    Credentials({
      id: "demo",
      name: "Demo account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== "string" || typeof password !== "string") return null

        const user = findDemoUser(email, password)
        if (!user) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
    }),
  )
}

/** OAuth provider ids the UI should render as available (demo excluded). */
export const enabledProviders = providers
  .map((provider) => provider.id)
  .filter((id) => id !== "demo")

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: "/login",
    // Send provider/callback failures back to the login page, where the form
    // reads `?error=` and explains itself, instead of Auth.js's default page.
    error: "/login",
  },
  callbacks: {
    /**
     * Persist the provider's account id onto the token so downstream code has a
     * stable user key before a database exists.
     */
    async jwt({ token, account }) {
      if (account) token.provider = account.provider
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub ?? ""
      return session
    },
  },
})
