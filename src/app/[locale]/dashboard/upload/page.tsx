import { getLocale } from "next-intl/server"

import { redirect } from "@/i18n/navigation"

import { getCurrentUser } from "@/lib/supabase/server"
import { getCategoryOptions, getLicenseOptionsForForm } from "@/lib/data/designer"
import { getTranslations } from "next-intl/server"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ListingForm } from "@/components/forms/listing-form"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/upload">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "listing" })
  return { title: t("newTitle") }
}

export default async function UploadPage() {
  const t = await getTranslations("listing")
  const locale = await getLocale()
  const user = await getCurrentUser()
  if (!user) return redirect({ href: "/login?next=/dashboard/upload", locale })

  const [categories, licenses] = await Promise.all([
    getCategoryOptions(),
    getLicenseOptionsForForm(),
  ])

  return (
    <>
      <SiteHeader solid />

      <main id="main-content" className="flex-1 pt-16">
        <div className="shell max-w-3xl py-10">
          <h1 className="text-2xl font-semibold tracking-tight">{t("newTitle")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("newBody")}
          </p>

          <div className="mt-8">
            <ListingForm categories={categories} licenses={licenses} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
