import { formatStat, getMarketplaceStats } from "@/lib/data/stats"
import { Link } from "@/i18n/navigation"
import { ArrowRight, Search } from "lucide-react"

import { getTranslations } from "next-intl/server"

import { HERO_FILTERS } from "@/lib/data/landing"
import { SearchForm } from "@/components/forms/search-form"
import { Button } from "@/components/ui/button"

/**
 * Hero backdrop is drawn rather than photographed — layered SVG ridgelines over
 * a gradient. Swap `HeroBackdrop` for a next/image hero shot when art is ready.
 */
function HeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-ink">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(at 15% 0%, oklch(0.34 0.042 252) 0px, transparent 55%), radial-gradient(at 85% 10%, oklch(0.3 0.038 264) 0px, transparent 50%), linear-gradient(180deg, oklch(0.23 0.026 250), oklch(0.16 0.018 245))",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0 / 0.6) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <svg
        className="absolute inset-x-0 bottom-0 h-2/3 w-full"
        viewBox="0 0 1440 420"
        preserveAspectRatio="none"
      >
        <path
          d="M0 300 L180 180 L320 260 L470 130 L620 250 L780 160 L940 270 L1100 190 L1260 280 L1440 210 L1440 420 L0 420Z"
          fill="oklch(0.29 0.028 248)"
          opacity="0.55"
        />
        <path
          d="M0 350 L150 265 L300 330 L460 230 L610 320 L770 250 L930 340 L1090 265 L1250 345 L1440 285 L1440 420 L0 420Z"
          fill="oklch(0.21 0.022 248)"
          opacity="0.8"
        />
        <path
          d="M0 395 L200 340 L400 385 L600 325 L820 390 L1040 335 L1240 392 L1440 350 L1440 420 L0 420Z"
          fill="oklch(0.16 0.018 245)"
        />
      </svg>
    </div>
  )
}

/**
 * The catalog's real figures, presented as the marketplace's scoreboard.
 *
 * These were three loose columns of white text sitting on the backdrop. As one
 * bordered slab they read as a single claim about the library rather than three
 * decorations, and the "live" tag is honest: every figure is counted from the
 * database on each render, not written down.
 *
 * The gradient is painted on a 1px-padded wrapper with the surface laid on top,
 * which is how you get a gradient *border* with a radius — `border-image`
 * takes no radius, so a bordered rounded box squares its corners off.
 */
async function LiveNumbers() {
  const stats = await getMarketplaceStats()
  const t = await getTranslations("landing")

  const figures = [
    { value: formatStat(stats.models), label: t("heroStats.models") },
    { value: formatStat(stats.designers), label: t("heroStats.designers") },
    { value: formatStat(stats.downloads), label: t("heroStats.downloads") },
  ]

  return (
    <div
      className="mt-12 w-full max-w-4xl rounded-2xl p-px shadow-2xl shadow-black/40"
      style={{
        backgroundImage:
          "linear-gradient(100deg, oklch(0.72 0.16 13), oklch(0.55 0.1 30) 35%, oklch(1 0 0 / 0.18) 60%, oklch(0.72 0.16 13))",
      }}
    >
      <div className="rounded-[calc(var(--radius-2xl)-1px)] bg-ink/95 px-5 py-5 backdrop-blur sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white sm:text-base">
            {t.rich("heroStatsTitle", {
              hl: (chunks) => <span className="text-brand-on-ink">{chunks}</span>,
            })}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white/70 uppercase">
            {/* Two stacked dots: the ping expands and fades while the solid one
                stays put, so the tag reads as a feed rather than a label. */}
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            {t("heroStatsLive")}
          </span>
        </div>

        {/* border-s on every cell but the first, rather than divide-x: the
            logical property puts the rule on the correct side in Hebrew too. */}
        <dl className="mt-5 grid grid-cols-3 text-start">
          {figures.map((figure) => (
            <div
              key={figure.label}
              className="px-3 first:ps-0 not-first:border-s not-first:border-white/10 sm:px-6"
            >
              <dt className="sr-only">{figure.label}</dt>
              <dd className="text-2xl font-semibold text-white tabular-nums sm:text-3xl">
                {figure.value}
              </dd>
              <p className="mt-1 text-xs text-white/55 sm:text-sm">{figure.label}</p>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

export async function Hero() {
  const t = await getTranslations("landing")
  const site = await getTranslations("site")

  return (
    <section className="header-offset relative isolate">
      <HeroBackdrop />

      {/* The bottom padding is deep on purpose: the membership card that
          follows lifts itself onto this backdrop, and it has to land on empty
          gradient rather than on the numbers slab. */}
      <div className="shell relative flex flex-col items-center pt-12 pb-24 text-center sm:pt-16 sm:pb-32">
        {/* Eyebrow — what the library *is*, said before the headline says what
            it is for. It links to the cast-ready cut of the catalog, since
            that is the claim it makes. */}
        <Link
          href="/3d-models/cast-ready"
          className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pe-3 ps-1 text-xs backdrop-blur transition-colors hover:border-white/30 hover:bg-white/10"
        >
          <span className="rounded-full bg-brand px-2 py-0.5 font-semibold text-brand-foreground">
            {t("heroEyebrowTag")}
          </span>
          <span className="text-white/75 group-hover:text-white">
            {t("heroEyebrow")}
          </span>
          <ArrowRight
            className="size-3 text-white/40 transition-transform ltr:group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
            aria-hidden
          />
        </Link>

        {/* The headline carries its own markup so the phrase the business turns
            on — cast-ready — is underlined in the brand colour instead of
            sitting flat in the middle of the sentence. `site.tagline` remains
            the plain-text version the tab title and share cards use. */}
        <h1 className="mt-6 max-w-4xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl">
          {t.rich("heroTitle", {
            hl: (chunks) => (
              <span className="underline decoration-brand decoration-[3px] underline-offset-[6px] sm:decoration-4 sm:underline-offset-8">
                {chunks}
              </span>
            ),
          })}
        </h1>
        <p className="mt-4 max-w-xl text-sm text-pretty text-white/70 sm:text-base">
          {site("description")}
        </p>

        <div className="mt-8 w-full max-w-2xl">
          <SearchForm />
        </div>

        <ul className="no-scrollbar mt-6 flex max-w-full items-center gap-2 overflow-x-auto pb-1">
          {HERO_FILTERS.map((filter) => (
            <li key={filter.key}>
              <Link
                href={filter.href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-4 py-1.5 text-sm text-white/85 whitespace-nowrap backdrop-blur transition-colors hover:border-brand/60 hover:bg-white/10 hover:text-white"
              >
                <Search className="size-3.5 text-white/60" aria-hidden />
                {t(`heroFilters.${filter.key}`)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Search and the filter chips both assume the visitor already knows
            what they are after. This is the way in for the one who doesn't. */}
        <Button
          asChild
          className="mt-8 h-11 bg-brand px-7 text-brand-foreground hover:bg-brand/85"
        >
          <Link href="/3d-models">
            {t("heroCta")}
            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Link>
        </Button>

        <LiveNumbers />
      </div>
    </section>
  )
}
