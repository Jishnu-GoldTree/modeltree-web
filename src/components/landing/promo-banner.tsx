import { Link } from "@/i18n/navigation"
import { Check, MessagesSquare, Sparkles } from "lucide-react"
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
 *
 * Everything else on the landing page is a white card on white. This one is
 * deliberately not: it wears the brand — a raspberry gradient border, a warm
 * tinted surface, a filled price block — because it is the single offer the
 * client wants a first-time visitor to leave having read. The highlight is the
 * same gradient-on-a-1px-wrapper trick the hero's numbers slab uses, so the
 * two overlapping elements read as one pair rather than two experiments.
 */
export async function PromoBanner() {
  const t = await getTranslations("promo")

  return (
    /* This card deliberately overlaps the hero's dark base, so it is the one
       section that opts out of the flow gap: the negative margin cancels the
       gap (16/20) and then lifts the card a further 12 onto the hero. */
    <section className="shell -mt-28 sm:-mt-32">
      <div
        className="rounded-2xl p-px shadow-xl shadow-brand/15"
        style={{
          backgroundImage:
            "linear-gradient(120deg, var(--brand), oklch(0.72 0.16 13) 40%, oklch(0.85 0.06 20) 70%, var(--brand))",
        }}
      >
        <div className="relative overflow-hidden rounded-[calc(var(--radius-2xl)-1px)] bg-card p-6 sm:p-8">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(at 90% 10%, oklch(0.93 0.055 12 / 0.85) 0px, transparent 55%), radial-gradient(at 8% 95%, oklch(0.95 0.035 20 / 0.8) 0px, transparent 50%)",
            }}
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1 text-xs font-medium text-brand-foreground">
                  <Sparkles className="size-3.5" aria-hidden />
                  {t("badge")}
                </span>
                {/* The second chip is the one that does the selling: "monthly
                    membership" is a category, "best value" is a verdict. */}
                <span className="inline-flex items-center rounded-md border border-brand/30 bg-background/70 px-2.5 py-1 text-xs font-medium text-brand-accent">
                  {t("highlight")}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-balance sm:text-2xl">
                {t("title")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("body")}</p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-brand text-brand-foreground shadow-md shadow-brand/25 hover:bg-brand/85"
                >
                  <Link href="/pricing">{t("cta")}</Link>
                </Button>
                {/* Commissioning is the client's second ask: order bespoke models
                    from a designer on top of the bundle. The flow is not built
                    yet; this points at the existing custom-work route. */}
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-brand/30 bg-background/70 hover:bg-background"
                >
                  <Link href="/custom-work">
                    <MessagesSquare className="size-4" aria-hidden />
                    {t("commission")}
                  </Link>
                </Button>
              </div>
            </div>

            {/* The price block is filled rather than outlined: on a tinted
                surface an outlined box would sink into the wash, and the ₪55 is
                the fact the whole card exists to deliver. */}
            <div className="shrink-0 rounded-xl bg-ink p-5 text-ink-foreground shadow-lg">
              <p className="text-xs text-white/60">{t("priceLabel")}</p>
              <p className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                  ₪55
                </span>
                <span className="text-sm text-white/60">{t("perMonth")}</span>
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-white/75">
                <Check className="size-3.5 text-brand-on-ink" aria-hidden />
                {t("included")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
