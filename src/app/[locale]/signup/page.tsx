import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowLeft } from "lucide-react"

import { Logo } from "@/components/layout/logo"
import { AuthAside } from "@/components/auth/auth-aside"
import { SignupForm } from "@/components/forms/signup-form"
import { ENABLED_OAUTH_PROVIDERS } from "@/lib/auth-config"
import { Skeleton } from "@/components/ui/skeleton"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/signup">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "auth" })
  return { title: t("signUpTitle") }
}

/**
 * Mirrors /login: same split layout and same reasons for dropping the site
 * nav. The brand panel sells the seller side, since that's the side that needs
 * convincing — buyers can browse without an account at all.
 */


async function SignupFormFromParams({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/signup">["searchParams"]
}) {
  const { next } = await searchParams

  // Same guard as /login: only same-site relative paths, since "//evil.com" is
  // protocol-relative and would make this an open redirect. Defaults to the
  // profile, which is where sign-up landed before anything passed `next`.
  const target = typeof next === "string" ? next : ""
  const redirectTo =
    target.startsWith("/") && !target.startsWith("//") ? target : "/profile"

  return <SignupForm enabledProviders={ENABLED_OAUTH_PROVIDERS} redirectTo={redirectTo} />
}

function SignupFormSkeleton() {
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
        <Skeleton className="h-21" />
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-10" />
      </div>
    </div>
  )
}

export default async function SignupPage({
  searchParams,
}: PageProps<"/[locale]/signup">) {
  const t = await getTranslations("auth")

  return (
    <main id="main-content" className="grid min-h-svh lg:grid-cols-2">
      <AuthAside variant="signup" />

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
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("signUpTitle")}
          </h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
            {t("signUpSubtitle")}
          </p>

          <Suspense fallback={<SignupFormSkeleton />}>
            <SignupFormFromParams searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
