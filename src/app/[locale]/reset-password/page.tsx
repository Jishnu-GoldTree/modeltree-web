import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, Check } from "lucide-react"

import { Logo } from "@/components/layout/logo"
import { Thumb } from "@/components/marketplace/thumb"
import { ResetPasswordForm } from "@/components/forms/reset-password-form"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reset-password">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "auth" })
  return { title: t("resetTitle") }
}

/**
 * The landing point of the recovery email, once the callback has exchanged the
 * code for a session. Mirrors /login's split layout; the form itself relies on
 * that session already being in place.
 */

const BENEFITS = ["login1", "login2", "login3"]

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth")
  const aside = await getTranslations("authAside")

  return (
    <main id="main-content" className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-white lg:flex">
        <Thumb
          seed="modeltree-signup"
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
      </aside>

      <div className="flex flex-col px-4 py-8 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Logo tone="dark" />
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            {t("backToLogin")}
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("resetTitle")}
          </h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
            {t("resetSubtitle")}
          </p>

          <ResetPasswordForm />
        </div>
      </div>
    </main>
  )
}
