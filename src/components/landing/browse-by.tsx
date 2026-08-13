import Link from "next/link"
import { ArrowRight, Download, Gift } from "lucide-react"

import { useTranslations } from "next-intl"

import { BROWSE_BY_FORMAT, BROWSE_BY_TYPE } from "@/lib/data/landing"

function BrowseList({
  heading,
  blurb,
  items,
}: {
  heading: string
  blurb: string
  items: { label: string; count: string; href: string }[]
}) {
  return (
    <div>
      <h3 className="font-semibold tracking-tight">{heading}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
      <ul className="mt-4 grid gap-1.5">
        {items.map((item) => (
          <li key={item.label}>
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

export function BrowseBy() {
  const t = useTranslations("landing.browse")

  // Type labels are translated; format names are product names and are not.
  const types = BROWSE_BY_TYPE.map((item) => ({ ...item, label: t(item.key) }))

  return (
    <section className="shell">
      <div className="grid gap-10 rounded-2xl border bg-card p-6 sm:p-8 lg:grid-cols-3">
        <BrowseList
          heading={t("typeHeading")}
          blurb={t("typeBlurb")}
          items={types}
        />
        <BrowseList
          heading={t("formatHeading")}
          blurb={t("formatBlurb")}
          items={BROWSE_BY_FORMAT}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <FreeCard
            icon={Gift}
            title={t("saleTitle")}
            body={t("saleBody")}
            href="/3d-models?sale=1"
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
