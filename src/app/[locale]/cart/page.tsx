import { Link } from "@/i18n/navigation"
import { Lock, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react"

import { getCart } from "@/lib/cart"
import { getLicenseOptions } from "@/lib/data/catalog"
import { clearCart, removeFromCart, setLineLicense } from "@/lib/actions/cart"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Thumb } from "@/components/marketplace/thumb"
import { Button } from "@/components/ui/button"
import { getLocale, getTranslations } from "next-intl/server"

import { formatPrice } from "@/lib/money"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cart">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "cart" })
  return { title: t("title") }
}



export default async function CartPage() {
  const locale = await getLocale()
  const free = await getTranslations("catalog")
  // Shekels are the stored currency; formatPrice adds the indicative $ for
  // English readers and omits it in Hebrew.
  const money = (agorot: number) =>
    formatPrice(agorot, locale as Locale, { freeLabel: free("free") }).primary
  const t = await getTranslations("cart")
  const lic = await getTranslations("license")
  const { lines, subtotal, itemCount, total } = await getCart()
  const optionsBySlug = new Map(
    await Promise.all(
      lines.map(async (l) => [l.model.slug, await getLicenseOptions(l.model)] as const),
    ),
  )

  return (
    <>
      <SiteHeader solid />

      <main id="main-content" className="flex-1 pt-16">
        <div className="shell py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            {itemCount > 0 && (
              <form action={clearCart}>
                <button
                  type="submit"
                  className="rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
                >
                  {t("clear")}
                </button>
              </form>
            )}
          </div>

          {itemCount === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-xl border py-20 text-center">
              <ShoppingCart className="size-8 text-muted-foreground" aria-hidden />
              <h2 className="mt-4 font-semibold">{t("empty")}</h2>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                {t("emptyBody")}
              </p>
              <Button asChild className="mt-6 h-10 bg-brand text-brand-foreground hover:bg-brand/85">
                <Link href="/3d-models">{t("emptyAction")}</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <ul className="flex flex-col gap-4">
                {lines.map((line) => {
                  const options = optionsBySlug.get(line.model.slug) ?? []
                  return (
                    <li
                      key={line.model.slug}
                      className="flex flex-wrap gap-4 rounded-xl border p-4"
                    >
                      <Link
                        href={`/3d-model/${line.model.slug}`}
                        className="shrink-0 outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
                      >
                        <Thumb
                          seed={line.model.seed}
                          sizes="160px"
                          className="aspect-4/3 w-36 rounded-lg"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/3d-model/${line.model.slug}`}
                          className="font-medium hover:underline"
                        >
                          {line.model.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          by {line.model.author} · {line.model.formats.join(", ")}
                        </p>

                        {options.length > 1 ? (
                          <form action={setLineLicense} className="mt-3">
                            <input type="hidden" name="slug" value={line.model.slug} />
                            <label
                              htmlFor={`license-${line.model.slug}`}
                              className="text-xs text-muted-foreground"
                            >
                              License
                            </label>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <select
                                id={`license-${line.model.slug}`}
                                name="license"
                                defaultValue={line.license}
                                className="h-8 rounded-lg border bg-transparent px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
                              >
                                {options.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {lic(option.id)} ({money(option.price * 100)})
                                  </option>
                                ))}
                              </select>
                              {/* Submit button rather than an onChange handler,
                                  so changing a licence works without JS. */}
                              <Button type="submit" variant="outline" size="sm">
                                Update
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <p className="mt-3 text-xs text-muted-foreground">
                            {line.licenseName}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end justify-between gap-3">
                        <span className="font-semibold tabular-nums">
                          {money(line.price * 100)}
                        </span>
                        <form action={removeFromCart}>
                          <input type="hidden" name="slug" value={line.model.slug} />
                          <button
                            type="submit"
                            aria-label={`Remove ${line.model.title}`}
                            className="inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground outline-none hover:text-destructive focus-visible:ring-3 focus-visible:ring-brand/50"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            Remove
                          </button>
                        </form>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <aside className="lg:sticky lg:top-24">
                <div className="rounded-xl border p-5">
                  <h2 className="font-semibold">{t("summary")}</h2>

                  <dl className="mt-4 flex flex-col gap-2 text-sm">
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

                  <Button
                    asChild
                    className="mt-5 h-10 w-full bg-brand text-brand-foreground hover:bg-brand/85"
                  >
                    <Link href="/checkout">
                      <Lock className="size-4" aria-hidden />
                      {t("checkout")}
                    </Link>
                  </Button>

                  <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="mt-px size-4 shrink-0 text-brand-accent" aria-hidden />
                    Instant download after payment, with an invoice for every
                    purchase.
                  </p>
                </div>

                <Button asChild variant="outline" className="mt-3 h-10 w-full">
                  <Link href="/3d-models">{t("keepBrowsing")}</Link>
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
