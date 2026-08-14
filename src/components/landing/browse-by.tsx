import { Link } from "@/i18n/navigation"
import { ArrowRight, Download, Gem, Gift } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { BROWSE_BY_METAL, BROWSE_BY_STONE } from "@/lib/data/landing"
import { getFacetCounts } from "@/lib/data/stats"

function BrowseList({
  heading,
  blurb,
  items,
}: {
  heading: string
  blurb: string
  items: { label: string; count: number; href: string }[]
}) {
  return (
    <div>
      <h3 className="font-semibold tracking-tight">{heading}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
      <ul className="mt-4 grid gap-1.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <span>{item.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {item.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FreeCard({
  icon: Icon,
  title,
  body,
  href,
  cta,
}: {
  icon: typeof Gift
  title: string
  body: string
  href: string
  cta: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-xl border bg-card p-5 transition-colors hover:border-brand/50 hover:bg-accent/40"
    >
      <div>
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-brand/15 text-brand-accent">
          <Icon className="size-5" aria-hidden />
        </span>
        <h4 className="mt-3 font-medium">{title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
        {cta}
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100"
        />
      </span>
    </Link>
  )
}

/**
 * Metal and stone are the two axes a jeweler narrows by, so they replaced the
 * old "by type / by format" lists (animated, rigged, Unreal) that meant nothing
 * here. Counts are live: the previous ones were invented and a catalog this
 * size can never back up "890K".
 */
export async function BrowseBy() {
  const t = await getTranslations("landing.browse")
  const facet = await getTranslations("facet")
  const counts = await getFacetCounts()

  return (
    <section className="shell">
      <div className="grid gap-10 rounded-2xl border bg-card p-6 sm:p-8 lg:grid-cols-3">
        <BrowseList
          heading={t("metalHeading")}
          blurb={t("metalBlurb")}
          items={BROWSE_BY_METAL.map((m) => ({
            href: m.href,
            label: facet(`metal.${m.key}`),
            count: counts.metals[m.key] ?? 0,
          }))}
        />
        <BrowseList
          heading={t("stoneHeading")}
          blurb={t("stoneBlurb")}
          items={BROWSE_BY_STONE.map((s) => ({
            href: s.href,
            label: facet(`stone.${s.key}`),
            count: counts.stones[s.key] ?? 0,
          }))}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <FreeCard
            icon={Gem}
            title={t("saleTitle")}
            body={t("saleBody")}
            href="/3d-models?sort=newest"
            cta={t("saleCta")}
          />
          <FreeCard
            icon={Download}
            title={t("freeTitle")}
            body={t("freeBody")}
            href="/3d-models/free"
            cta={t("freeCta")}
          />
        </div>
      </div>
    </section>
  )
}
