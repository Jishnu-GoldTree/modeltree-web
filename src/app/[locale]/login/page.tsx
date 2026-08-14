import { formatStat, getMarketplaceStats } from "@/lib/data/stats"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, Check } from "lucide-react"

import { Logo } from "@/components/layout/logo"
import { Thumb } from "@/components/marketplace/thumb"
import { LoginForm } from "@/components/forms/login-form"
import { ENABLED_OAUTH_PROVIDERS, SHOW_DEMO_HINT } from "@/lib/auth-config"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "auth" })
  return { title: t("logInTitle") }
}

/**
 * Auth pages deliberately drop the marketplace header and footer: the whole
 * job of this screen is to get one of two actions done, and the full nav is a
 * wall of exits from it. The logo still links home, so the way out is obvious.
 */

const BENEFITS = ["login1", "login2", "login3"]

/**
 * Auth.js redirects provider and callback failures here with `?error=`. Map the
 * codes to plain language — the raw values ("OAuthAccountNotLinked") mean
 * nothing to a buyer.
 */
const AUTH_ERRORS: Record<string, string> = {
  oauth: "That sign-in didn't complete. Try again.",
  access_denied: "You cancelled the sign-in, or the provider denied access.",
  server_error: "The provider had a problem. Try again in a moment.",
}

export default async function LoginPage({ searchParams }: PageProps<"/[locale]/login">) {
  const t = await getTranslations("auth")
  const aside = await getTranslations("authAside")
  const land = await getTranslations("landing")
  const stats = await getMarketplaceStats()
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
            {aside("loginTitle")}
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-white/80">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {aside(benefit)}
              </li>
            ))}
          </ul>
        </div>

        <dl className="relative flex gap-10">
          {[
            { value: formatStat(stats.models), label: land("heroStats.models") },
            { value: formatStat(stats.designers), label: land("heroStats.designers") },
            { value: formatStat(stats.downloads), label: land("heroStats.downloads") },
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
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            {t("backToMarket")}
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight">{t("logInTitle")}</h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
            {t("logInSubtitle")}
          </p>

          <LoginForm
            enabledProviders={ENABLED_OAUTH_PROVIDERS}
            authError={authError}
            demoEnabled={SHOW_DEMO_HINT}
            redirectTo={redirectTo}
          />
        </div>

        <p className="mx-auto max-w-sm text-center text-xs text-muted-foreground">
          {t("legal")}{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            {t("terms")}
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            {t("privacy")}
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
