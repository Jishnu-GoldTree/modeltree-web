import { getTranslations } from "next-intl/server"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, Check } from "lucide-react"

import { Logo } from "@/components/layout/logo"
import { SignupForm } from "@/components/forms/signup-form"
import { ENABLED_OAUTH_PROVIDERS } from "@/lib/auth-config"

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

const BENEFITS = ["signup1", "signup2", "signup3"]

export default async function SignupPage({
  searchParams,
}: PageProps<"/[locale]/signup">) {
  const t = await getTranslations("auth")
  const aside = await getTranslations("authAside")
  const { next } = await searchParams

  // Same guard as /login: only same-site relative paths, since "//evil.com" is
  // protocol-relative and would make this an open redirect. Defaults to the
  // profile, which is where sign-up landed before anything passed `next`.
  const target = typeof next === "string" ? next : ""
  const redirectTo =
    target.startsWith("/") && !target.startsWith("//") ? target : "/profile"
  return (
    <main id="main-content" className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-white lg:flex">
        {/* unoptimized: the file is already a hand-tuned webp, so let Next serve
            it verbatim rather than re-encoding it at its default quality and
            softening the fine wireframe lines. Dimmed so the white copy and teal
            accents keep contrast over it — the art is a backdrop, not the message. */}
        <Image
          src="/images/auth-cover.webp"
          alt=""
          fill
          unoptimized
          className="absolute inset-0 object-cover opacity-70"
        />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            {aside("asideTitle")}
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 text-sm text-white/80"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {aside(benefit)}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative max-w-md text-sm text-white/60">
          {aside("freeToJoin")}
        </p>
      </aside>

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

          <SignupForm
            enabledProviders={ENABLED_OAUTH_PROVIDERS}
            redirectTo={redirectTo}
          />
        </div>
      </div>
    </main>
  )
}
