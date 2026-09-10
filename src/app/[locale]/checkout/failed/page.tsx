import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { XCircle } from "lucide-react"

import { COMPANY, mailto } from "@/lib/data/company"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout/failed">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "checkout" })
  return { title: t("failedTitle") }
}

/**
 * Payment failure. The payment provider's cancel/failure return URL. No charge
 * is taken; the buyer can retry or reach support.
 */
export default async function CheckoutFailedPage() {
  const t = await getTranslations("checkout")

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="header-offset flex-1">
        <div className="shell py-16">
          <div className="mx-auto max-w-lg rounded-2xl border p-8 text-center">
            <XCircle className="mx-auto size-12 text-destructive" aria-hidden />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">
              {t("failedTitle")}
            </h1>
            <p className="mt-3 text-sm text-pretty text-muted-foreground">
              {t("failedBody")}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
              >
                <Link href="/checkout">{t("failedRetry")}</Link>
              </Button>
              <Button asChild variant="outline" className="h-10">
                <a href={mailto(COMPANY.email.support)}>{t("failedSupport")}</a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
