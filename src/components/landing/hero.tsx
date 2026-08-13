import { formatStat, getMarketplaceStats } from "@/lib/data/stats"
import Link from "next/link"

import { HERO_FILTERS, SITE } from "@/lib/data/landing"
import { SearchForm } from "@/components/forms/search-form"

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
            "radial-gradient(at 15% 0%, oklch(0.42 0.09 205) 0px, transparent 55%), radial-gradient(at 85% 10%, oklch(0.35 0.07 255) 0px, transparent 50%), linear-gradient(180deg, oklch(0.24 0.03 240), oklch(0.16 0.02 235))",
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
          fill="oklch(0.3 0.04 220)"
          opacity="0.55"
        />
        <path
          d="M0 350 L150 265 L300 330 L460 230 L610 320 L770 250 L930 340 L1090 265 L1250 345 L1440 285 L1440 420 L0 420Z"
          fill="oklch(0.22 0.03 225)"
          opacity="0.8"
        />
        <path
          d="M0 395 L200 340 L400 385 L600 325 L820 390 L1040 335 L1240 392 L1440 350 L1440 420 L0 420Z"
          fill="oklch(0.16 0.02 235)"
        />
      </svg>
    </div>
  )
}

export async function Hero() {
  const stats = await getMarketplaceStats()
  return (
    <section className="relative isolate pt-16">
      <HeroBackdrop />

      <div className="shell relative flex flex-col items-center pt-16 pb-14 text-center sm:pt-24 sm:pb-20">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl">
          {SITE.tagline}
        </h1>
        <p className="mt-4 max-w-xl text-sm text-pretty text-white/70 sm:text-base">
          {SITE.description}
        </p>

        <div className="mt-8 w-full max-w-2xl">
          <SearchForm />
        </div>

        <ul className="no-scrollbar mt-6 flex max-w-full items-center gap-2 overflow-x-auto pb-1">
          {HERO_FILTERS.map((filter) => (
            <li key={filter.label}>
              <Link
                href={filter.href}
                className="inline-flex shrink-0 items-center rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm text-white/85 whitespace-nowrap backdrop-blur transition-colors hover:border-brand/60 hover:bg-white/10 hover:text-white"
              >
                {filter.label}
              </Link>
            </li>
          ))}
        </ul>

        <dl className="mt-10 grid grid-cols-3 gap-6 text-white sm:gap-12">
          {[
            { value: formatStat(stats.models), label: "3D models" },
            { value: formatStat(stats.designers), label: "Designers" },
            { value: formatStat(stats.downloads), label: "Downloads" },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-2xl font-semibold sm:text-3xl">
                {stat.value}
              </dd>
              <p className="mt-1 text-xs text-white/60 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
