import { Link } from "@/i18n/navigation"
import { Gem, Ruler, ScanLine, Sparkles } from "lucide-react"

import { useTranslations } from "next-intl"

import { CRAFT_POINTS, SITE } from "@/lib/data/landing"
import { Button } from "@/components/ui/button"
import { StoneDiagram } from "@/components/landing/stone-diagram"

const ICONS = {
  scan: ScanLine,
  ruler: Ruler,
  gem: Gem,
} as const

/**
 * The quality claim, made concrete.
 *
 * "High quality" is what every marketplace says, so the section spends its
 * space on the three things a jeweler can check instead: is the mesh closed,
 * are the dimensions stated, will it come off the plate or out of the mould.
 * The drawing beside it carries the same argument without a sentence — this is
 * geometry, not a render.
 *
 * The band is ink, like Custom solutions, and deliberately sits far from it in
 * the page order so the page does not read as two dark stripes.
 */
export function CraftStandard() {
  const t = useTranslations("landing.craft")

  return (
    <section className="bg-ink text-ink-foreground section-band">
      <div className="shell">
        {/*
          The drawing comes second in the DOM so a screen reader and a narrow
          viewport both reach the claim before the decoration. On wide screens
          the grid places it in the first column, and in Hebrew the whole thing
          mirrors for free — nothing here is pinned to a physical side.
        */}
        {/*
          `items-stretch` rather than `items-center`, so the drawing column is
          as tall as the copy column and the artwork can fill it edge to edge.
          Centring would leave the panel floating with ink above and below it.
        */}
        <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-14">
          {/*
            From lg the negative margin cancels `.section-band`'s own py-20, so
            the drawing runs the full height of the band rather than sitting
            inset within it with ink above and below. It is exactly the padding
            being undone — not a guess — so the artwork meets the band's edges
            and nothing else moves.

            Only from lg. Stacked, the columns are above one another, and a
            negative margin there would pull the drawing straight into the
            heading. On that layout it takes an explicit height instead, since
            it has no neighbouring column to inherit one from.

            The rounding goes with it: a full-bleed panel with rounded corners
            shows four notches of band colour where it meets the edge.
          */}
          <div className="order-2 lg:order-1 lg:-my-20">
            <div className="h-64 w-full overflow-hidden rounded-2xl sm:h-80 lg:h-full lg:min-h-[30rem] lg:rounded-none">
              <StoneDiagram />
            </div>
          </div>

          <div className="order-1 flex flex-col justify-center lg:order-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <Sparkles className="size-3.5" aria-hidden />
              {t("badge")}
            </span>

            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {t("title")}
            </h2>

            <p className="mt-3 max-w-xl text-sm text-pretty text-white/65">
              {t("body", { name: SITE.name })}
            </p>

            <ul className="mt-8 space-y-5">
              {CRAFT_POINTS.map((point) => {
                const Icon = ICONS[point.icon]
                return (
                  <li key={point.key} className="flex gap-4">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-semibold tracking-tight">
                        {t(`${point.key}Title`)}
                      </h3>
                      <p className="mt-1 text-sm text-pretty text-white/60">
                        {t(`${point.key}Body`)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>

            <Button
              asChild
              size="lg"
              className="mt-8 bg-brand text-brand-foreground hover:bg-brand/85"
            >
              <Link href="/3d-models">{t("cta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
