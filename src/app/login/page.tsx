import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"

import { SITE } from "@/lib/data/landing"
import { Logo } from "@/components/layout/logo"
import { Thumb } from "@/components/marketplace/thumb"
import { LoginForm } from "@/components/forms/login-form"
import { demoAuthEnabled, enabledProviders } from "@/auth"

export const metadata = { title: "Log in" }

/**
 * Auth pages deliberately drop the marketplace header and footer: the whole
 * job of this screen is to get one of two actions done, and the full nav is a
 * wall of exits from it. The logo still links home, so the way out is obvious.
 */

const BENEFITS = [
  "1.9M+ royalty-free models, textures and print-ready assets",
  "Licenses and invoices kept in one place",
  "Sell your own work and keep up to 80% royalties",
]

/**
 * Auth.js redirects provider and callback failures here with `?error=`. Map the
 * codes to plain language — the raw values ("OAuthAccountNotLinked") mean
 * nothing to a buyer.
 */
const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email already has an account created with a different sign-in method. Use the original method instead.",
  OAuthSignin: "Could not reach that provider. Try again.",
  OAuthCallback: "That provider rejected the sign-in. Try again.",
  AccessDenied: "You cancelled the sign-in, or the provider denied access.",
  Configuration: "Sign-in is misconfigured. Check the server logs.",
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, next } = await searchParams

  // Only same-site relative paths. Accepting an arbitrary `next` would make the
  // login page an open redirect — "//evil.com" is protocol-relative and would
  // leave the site entirely.
  const target = typeof next === "string" ? next : ""
  const redirectTo =
    target.startsWith("/") && !target.startsWith("//") ? target : "/"
  const authError =
    typeof error === "string"
      ? (AUTH_ERRORS[error] ?? "Sign-in failed. Try again.")
      : undefined

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel — decorative, so it's hidden rather than stacked on
          mobile, where it would push the form below the fold. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-white lg:flex">
        {/* Seed chosen for its all-cool palette — the generator's warm hues
            fight the teal brand at this size. Blurred and dimmed because the
            art is tuned for ~300px cards and reads oversized at panel scale. */}
        <Thumb
          seed="modeltree-login"
          className="absolute inset-0 opacity-35 blur-[1px]"
        />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            {SITE.tagline}
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-white/80">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <dl className="relative flex gap-10">
          {[
            { value: "1.9M+", label: "3D models" },
            { value: "200K+", label: "Designers" },
            { value: "80%", label: "Designer royalty" },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="text-2xl font-semibold">{stat.value}</dt>
              <dd className="mt-1 text-xs text-white/60">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <div className="flex flex-col px-4 py-8 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Logo tone="dark" />
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to marketplace
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
            Log in to reach your purchases, licenses and designer dashboard.
          </p>

          <LoginForm
            enabledProviders={enabledProviders}
            authError={authError}
            demoEnabled={demoAuthEnabled}
            redirectTo={redirectTo}
          />
        </div>

        <p className="mx-auto max-w-sm text-center text-xs text-muted-foreground">
          By logging in you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
