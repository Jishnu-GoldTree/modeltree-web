import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { CheckCircle2 } from "lucide-react"

import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout/success">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "checkout" })
  return { title: t("successTitle") }
}

/**
 * Order confirmation. This is the return URL the payment provider will send a
 * buyer to after a successful charge; `?ref=` carries the order reference so the
 * confirmation names the order. It renders standalone today so the completed
 * flow can be reviewed before the provider is wired.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/[locale]/checkout/success">) {
  const t = await getTranslations("checkout")
  const { ref } = await searchParams
  const reference = typeof ref === "string" ? ref : null

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="flex-1 pt-26">
        <div className="shell py-16">
          <div className="mx-auto max-w-lg rounded-2xl border p-8 text-center">
            <CheckCircle2
              className="mx-auto size-12 text-brand-accent"
              aria-hidden
            />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">
              {t("successTitle")}
            </h1>
            <p className="mt-3 text-sm text-pretty text-muted-foreground">
              {t("successBody")}
            </p>

            {reference && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{t("orderRef")}</span>
                <span className="font-mono font-medium">{reference}</span>
              </p>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
              >
                <Link href="/profile">{t("successDownloads")}</Link>
              </Button>
              <Button asChild variant="outline" className="h-10">
                <Link href="/3d-models">{t("successKeep")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
