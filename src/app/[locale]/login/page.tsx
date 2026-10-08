import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowLeft } from "lucide-react"

import { Logo } from "@/components/layout/logo"
import { AuthAside } from "@/components/auth/auth-aside"
import { LoginForm } from "@/components/forms/login-form"
import { ENABLED_OAUTH_PROVIDERS } from "@/lib/auth-config"
import { Skeleton } from "@/components/ui/skeleton"

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

async function LoginFormFromParams({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/login">["searchParams"]
}) {
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
    <LoginForm
      enabledProviders={ENABLED_OAUTH_PROVIDERS}
      authError={authError}
      redirectTo={redirectTo}
    />
  )
}

function LoginFormSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="grid gap-2 sm:grid-cols-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-px" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-15" />
        <Skeleton className="h-15" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10" />
      </div>
    </div>
  )
}

export default async function LoginPage({ searchParams }: PageProps<"/[locale]/login">) {
  const t = await getTranslations("auth")

  return (
    <main id="main-content" className="grid min-h-svh lg:grid-cols-2">
      <AuthAside variant="login" />

      <div className="flex flex-col px-4 py-8 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Logo tone="dark" />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 self-start rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            {t("backToMarket")}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{t("logInTitle")}</h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
            {t("logInSubtitle")}
          </p>

          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginFormFromParams searchParams={searchParams} />
          </Suspense>
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
