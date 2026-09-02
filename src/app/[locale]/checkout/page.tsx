import { Link } from "@/i18n/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { FileDown, ShoppingCart } from "lucide-react"

import { getCart } from "@/lib/cart"
import { formatPrice } from "@/lib/money"
import type { Locale } from "@/i18n/routing"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"
import { CheckoutConsent } from "@/components/checkout/checkout-consent"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "checkout" })
  return { title: t("title") }
}

export default async function CheckoutPage() {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations("checkout")
  const lic = await getTranslations("license")
  const free = await getTranslations("catalog")
  const { lines, subtotal, itemCount, total } = await getCart()

  const money = (agorot: number) =>
    formatPrice(agorot, locale, { freeLabel: free("free") }).primary

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="flex-1 pt-26">
        <div className="shell py-10">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

          {itemCount === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-xl border py-20 text-center">
              <ShoppingCart className="size-8 text-muted-foreground" aria-hidden />
              <h2 className="mt-4 font-semibold">{t("empty")}</h2>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                {t("emptyBody")}
              </p>
              <Button
                asChild
                className="mt-6 h-10 bg-brand text-brand-foreground hover:bg-brand/85"
              >
                <Link href="/3d-models">{t("emptyAction")}</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <section aria-labelledby="order-summary">
                <h2 id="order-summary" className="font-semibold">
                  {t("summaryTitle")}
                </h2>
                <ul className="mt-4 flex flex-col divide-y rounded-xl border">
                  {lines.map((line) => (
                    <li
                      key={line.model.slug}
                      className="flex items-center justify-between gap-4 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{line.model.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {lic(line.license)}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {money(line.price * 100)}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 flex items-start gap-2 rounded-lg border bg-brand-muted p-3 text-xs text-muted-foreground">
                  <FileDown
                    className="mt-px size-4 shrink-0 text-brand-accent"
                    aria-hidden
                  />
                  {t("digitalNote")}
                </p>
              </section>

              <aside className="lg:sticky lg:top-28">
                <div className="rounded-xl border p-5">
                  <dl className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">
                        {t("subtotal", { count: itemCount })}
                      </dt>
                      <dd className="tabular-nums">{money(subtotal * 100)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{t("tax")}</dt>
                      <dd className="text-muted-foreground">{t("taxNote")}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-baseline justify-between border-t pt-4">
                    <span className="font-semibold">{t("total")}</span>
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      {money(total * 100)}
                    </span>
                  </div>

                  <CheckoutConsent />
                </div>

                <Button asChild variant="outline" className="mt-3 h-10 w-full">
                  <Link href="/cart">{t("backToCart")}</Link>
                </Button>
              </aside>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
