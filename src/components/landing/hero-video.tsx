import { formatStat, getMarketplaceStats } from "@/lib/data/stats"
import { Link } from "@/i18n/navigation"
import { ArrowRight, Search } from "lucide-react"

import { getTranslations } from "next-intl/server"

import { HERO_FILTERS } from "@/lib/data/landing"
import { SearchForm } from "@/components/forms/search-form"
import { Button } from "@/components/ui/button"
import { VideoBackdrop } from "@/components/landing/video-backdrop"

/**
 * Alternative hero — same copy, search and stats as the drawn-SVG hero, but the
 * backdrop is a crossfade of the in-house renders instead of ridgelines. Kept
 * as a separate component so the live home hero (landing/hero.tsx) is untouched;
 * this one is mounted on /preview/hero-video for review.
 */
const HERO_CLIPS = ["ijewel-06", "ijewel-09", "ijewel-03", "ijewel-12"].map(
  (clip) => ({
    src: `/videos/${clip}.webm`,
    poster: `/videos/posters/${clip}.webp`,
  }),
)

export async function HeroVideo() {
  const stats = await getMarketplaceStats()
  const t = await getTranslations("landing")
  const site = await getTranslations("site")

  return (
    <section className="relative isolate pt-26">
      <VideoBackdrop clips={HERO_CLIPS} />

      <div className="shell relative flex flex-col items-center pt-16 pb-14 text-center sm:pt-24 sm:pb-20">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
          {site("tagline")}
        </h1>
        <p className="mt-4 max-w-xl text-sm text-pretty text-white/80 sm:text-base">
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
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90 whitespace-nowrap backdrop-blur transition-colors hover:border-brand/60 hover:bg-white/15 hover:text-white"
              >
                <Search className="size-3.5 text-white/60" aria-hidden />
                {t(`heroFilters.${filter.key}`)}
              </Link>
            </li>
          ))}
        </ul>

        <Button
          asChild
          className="mt-8 h-11 bg-brand px-7 text-brand-foreground hover:bg-brand/85"
        >
          <Link href="/3d-models">
            {t("heroCta")}
            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Link>
        </Button>

        <dl className="mt-10 grid grid-cols-3 gap-6 text-white sm:gap-12">
          {[
            { value: formatStat(stats.models), label: t("heroStats.models") },
            { value: formatStat(stats.designers), label: t("heroStats.designers") },
            { value: formatStat(stats.downloads), label: t("heroStats.downloads") },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-2xl font-semibold sm:text-3xl">{stat.value}</dd>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
