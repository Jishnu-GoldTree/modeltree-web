import Link from "next/link"
import { MessagesSquare, Sparkles } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"

/**
 * The subscription bundle, as specified by the client: ₪55 a month for two
 * models. This replaced invented placeholder pricing ("$2.36 per model, billed
 * annually at $59/mo") that had been written to fill the layout.
 *
 * Priced in shekels because that is what the client quoted. Note the catalog
 * itself is priced in USD (`models.currency` defaults to 'USD'), so this is
 * currently the only shekel figure on the site — see the currency question
 * raised alongside this change.
 */
export async function PromoBanner() {
  const t = await getTranslations("promo")

  return (
    // The negative top margin lifts this card onto the hero's dark base.
    <section className="shell -mt-12 pb-16 sm:pb-20">
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(at 90% 20%, oklch(0.93 0.05 300) 0px, transparent 55%), radial-gradient(at 10% 90%, oklch(0.95 0.04 200) 0px, transparent 50%)",
          }}
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand-accent">
              <Sparkles className="size-3.5" aria-hidden />
              {t("badge")}
            </span>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-balance sm:text-2xl">
              {t("title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("body")}</p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-brand text-brand-foreground hover:bg-brand/85"
              >
                <Link href="/pricing">{t("cta")}</Link>
              </Button>
              {/* Commissioning is the client's second ask: order bespoke models
                  from a designer on top of the bundle. The flow is not built
                  yet; this points at the existing custom-work route. */}
              <Button asChild variant="outline" size="lg">
                <Link href="/custom-work">
                  <MessagesSquare className="size-4" aria-hidden />
                  {t("commission")}
                </Link>
              </Button>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border bg-background/80 p-5 backdrop-blur">
            <p className="text-xs text-muted-foreground">{t("priceLabel")}</p>
            <p className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                ₪55
              </span>
              <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t("included")}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
