import Link from "next/link"
import { ArrowRight, Download, Gift } from "lucide-react"

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
          className="size-4 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  )
}

export function BrowseBy() {
  return (
    <section className="shell pb-16 sm:pb-20">
      <div className="grid gap-10 rounded-2xl border bg-card p-6 sm:p-8 lg:grid-cols-3">
        <BrowseList
          heading="Browse by Type"
          blurb="Find content based on the type of asset your project needs."
          items={BROWSE_BY_TYPE}
        />
        <BrowseList
          heading="Browse by Format"
          blurb="Find 3D models designed for your preferred software."
          items={BROWSE_BY_FORMAT}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <FreeCard
            icon={Gift}
            title="On sale"
            body="Discounted assets from designers running promotions this week."
            href="/3d-models?sale=1"
            cta="Browse deals"
          />
          <FreeCard
            icon={Download}
            title="Free models"
            body="Thousands of royalty-free assets you can download right now."
            href="/3d-models/free"
            cta="Get free models"
          />
        </div>
      </div>
    </section>
  )
}
