import { getLocale, getTranslations } from "next-intl/server"

import { ArrowLeft } from "lucide-react"

import { Link, redirect } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { getCurrentUser } from "@/lib/supabase/server"
import { getAdjustableModels } from "@/lib/data/requests"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { RequestForm } from "@/components/requests/request-form"

export async function generateMetadata({ params }: PageProps<"/[locale]/requests/new">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "requests" })
  return { title: t("new") }
}

export default async function NewRequestPage({
  searchParams,
}: PageProps<"/[locale]/requests/new">) {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations("requests")
  const user = await getCurrentUser()
  if (!user) return redirect({ href: "/login?next=/requests/new", locale })

  const { model, kind } = await searchParams
  const owned = await getAdjustableModels()

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="flex-1 pt-26">
        <div className="shell max-w-2xl py-10">
          <Link
            href="/requests"
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            {t("back")}
          </Link>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">{t("new")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>

          <div className="mt-8">
            <RequestForm
              ownedModels={owned}
              // Deep-linked from a model page: preselect it and open on the
              // adjustment tab, so the buyer does not re-pick what they just
              // clicked from.
              preselectedModelId={typeof model === "string" ? model : undefined}
              preselectedKind={kind === "commission" ? "commission" : undefined}
            />
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
