import { Link } from "@/i18n/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { ArrowRight, Check, Gem, MessagesSquare, ShoppingBag } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Locale } from "@/i18n/routing"
import { MEMBERSHIP, getTypicalTwoModelCost } from "@/lib/data/pricing"
import { formatPrice } from "@/lib/money"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"

export async function generateMetadata({ params }: PageProps<"/[locale]/pricing">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "pricing" })
  return { title: t("metaTitle"), description: t("metaDescription") }
}

/**
 * Membership and pricing.
 *
 * Three columns, one price. ₪55 for two models a month is the only figure the
 * client has given, so it is the only figure stated: the other two tiers are
 * "free" and "quoted", which is what they actually are. The comparison strip
 * below is computed from the live catalog rather than written down, so the
 * claim that the membership pays for itself stays true as prices change.
 */
export default async function PricingPage() {
  const t = await getTranslations("pricing")
  const locale = (await getLocale()) as Locale
  const twoModels = await getTypicalTwoModelCost()

  const money = (agorot: number) =>
    formatPrice(agorot, locale, { freeLabel: t("free") })

  const memberPrice = money(MEMBERSHIP.priceAgorot)

  const plans = [
    {
      key: "free",
      Icon: ShoppingBag,
      price: t("free"),
      note: null as string | null,
      href: "/3d-models",
      features: ["freeF1", "freeF2", "freeF3", "freeF4"],
      featured: false,
    },
    {
      key: "member",
      Icon: Gem,
      price: memberPrice.primary,
      note: t("perMonth"),
      href: "/signup",
      features: ["memberF1", "memberF2", "memberF3", "memberF4", "memberF5", "memberF6"],
      featured: true,
    },
    {
      key: "custom",
      Icon: MessagesSquare,
      price: t("quoted"),
      note: null,
      href: "/custom-work",
      features: ["customF1", "customF2", "customF3", "customF4"],
      featured: false,
    },
  ] as const

  const faqs = [1, 2, 3, 4] as const

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="flex-1 pt-26">
        <section className="border-b bg-ink text-ink-foreground">
          <div className="shell py-16 text-center md:py-20">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand/15 px-3 py-1 text-xs font-medium text-brand">
              <Gem className="size-3.5" aria-hidden />
              {t("eyebrow")}
            </span>
            <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-pretty text-white/70 sm:text-base">
              {t("subtitle")}
            </p>
          </div>
        </section>

        <div className="shell py-14 sm:py-16">
          <ul className="grid items-start gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <li
                key={plan.key}
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border bg-card p-6 sm:p-7",
                  // The membership is the thing being sold; it gets the weight.
                  plan.featured && "border-brand shadow-lg lg:-mt-4 lg:pb-10",
                )}
              >
                {plan.featured && (
                  <span className="absolute -top-3 start-6 rounded-md bg-brand px-3 py-1 text-xs font-medium text-brand-foreground">
                    {t("popular")}
                  </span>
                )}

                <span
                  className={cn(
                    "inline-flex size-11 items-center justify-center rounded-xl",
                    plan.featured
                      ? "bg-brand text-brand-foreground"
                      : "bg-brand/15 text-brand-accent",
                  )}
                >
                  <plan.Icon className="size-5" aria-hidden />
                </span>

                <h2 className="mt-4 text-lg font-semibold tracking-tight">
                  {t(`${plan.key}Name`)}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`${plan.key}Tagline`)}
                </p>

                <p className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">
                    {plan.price}
                  </span>
                  {plan.note && (
                    <span className="text-sm text-muted-foreground">{plan.note}</span>
                  )}
                </p>
                {plan.featured && memberPrice.secondary && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    ≈{memberPrice.secondary} {t("perMonth")}
                  </p>
                )}

                <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm">
                      <Check
                        aria-hidden
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          plan.featured ? "text-brand-accent" : "text-muted-foreground",
                        )}
                      />
                      <span className="text-pretty">
                        {t.rich(feature, {
                          b: (chunks) => <strong className="font-semibold">{chunks}</strong>,
                        })}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={cn(
                    "mt-7 h-11",
                    plan.featured
                      ? "bg-brand text-brand-foreground hover:bg-brand/85"
                      : "",
                  )}
                  variant={plan.featured ? "default" : "outline"}
                >
                  <Link href={plan.href}>{t(`${plan.key}Cta`)}</Link>
                </Button>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-center text-xs text-muted-foreground">{t("vat")}</p>

          {/* Only rendered when the catalog can actually back the claim. */}
          {twoModels !== null && twoModels > MEMBERSHIP.priceAgorot && (
            <section className="mt-14 rounded-2xl border bg-brand-muted p-6 sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight">
                {t("compareTitle")}
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                {t("compareBody")}
              </p>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-background p-5">
                  <dt className="text-sm text-muted-foreground">
                    {t("compareModels")}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-muted-foreground line-through">
                    {money(twoModels).primary}
                  </dd>
                </div>
                <div className="rounded-xl border border-brand bg-background p-5">
                  <dt className="text-sm text-muted-foreground">
                    {t("compareMember")}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-brand-accent">
                    {memberPrice.primary}
                    <span className="ms-1 text-sm font-normal text-muted-foreground">
                      {t("perMonth")}
                    </span>
                  </dd>
                </div>
              </dl>

              <p className="mt-4 text-xs text-muted-foreground">{t("compareNote")}</p>
            </section>
          )}

          <section className="mx-auto mt-14 max-w-3xl">
            <h2 className="text-center text-lg font-semibold tracking-tight">
              {t("faqTitle")}
            </h2>
            <dl className="mt-6 flex flex-col gap-4">
              {faqs.map((n) => (
                <div key={n} className="rounded-xl border p-5">
                  <dt className="font-medium">{t(`faq${n}Q`)}</dt>
                  <dd className="mt-1.5 text-sm text-pretty text-muted-foreground">
                    {t(`faq${n}A`)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="mt-12 flex justify-center">
            <Button asChild variant="outline" className="h-11">
              <Link href="/custom-work">
                {t("customCta")}
                <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
