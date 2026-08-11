import Link from "next/link"

import { cn } from "@/lib/utils"
import type { CategoryTile } from "@/lib/data/landing"
import { Thumb } from "@/components/marketplace/thumb"
import { SectionHeading } from "@/components/landing/section-heading"

/**
 * The "Explore …" bands. The chip row is trending searches (plain links, not
 * tab state) — same as the categories grid below it, everything navigates.
 */
export function CategoryExplorer({
  title,
  description,
  chips,
  chipBase,
  categories,
  categoryBase,
  action,
  footerAction,
  className,
}: {
  title: string
  description?: string
  chips: string[]
  chipBase: string
  categories: CategoryTile[]
  categoryBase: string
  action: { label: string; href: string }
  footerAction: { label: string; href: string }
  className?: string
}) {
  return (
    <section className={cn("shell pb-16 sm:pb-20", className)}>
      <SectionHeading
        title={title}
        description={description}
        action={action}
      />

      <ul className="no-scrollbar mt-5 flex items-center gap-2 overflow-x-auto pb-1">
        {chips.map((chip) => (
          <li key={chip}>
            <Link
              href={`${chipBase}?q=${encodeURIComponent(chip)}`}
              className="inline-flex shrink-0 items-center rounded-full border bg-background px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors hover:border-brand hover:text-brand-accent"
            >
              {chip}
            </Link>
          </li>
        ))}
      </ul>

      {/* 4-column grid with a 2×2 feature tile packs all nine categories into
          exactly three full rows — no ragged trailing gap. */}
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category, index) => (
          <li
            key={category.slug}
            className={cn(index === 0 && "lg:col-span-2 lg:row-span-2")}
          >
            <Link
              href={`${categoryBase}/${category.slug}`}
              className="group block h-full overflow-hidden rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
            >
              <Thumb
                seed={category.seed}
                className={cn(
                  "flex items-end p-3 transition-transform duration-300 group-hover:scale-[1.03]",
                  index === 0 ? "aspect-4/3 lg:aspect-auto lg:h-full" : "aspect-4/3"
                )}
              >
                <div className="relative flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white drop-shadow">
                    {category.label}
                  </span>
                  <span className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-white/85 backdrop-blur">
                    {category.count}
                  </span>
                </div>
              </Thumb>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-center">
        <Link
          href={footerAction.href}
          className="inline-flex items-center rounded-full border px-5 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          {footerAction.label}
        </Link>
      </div>
    </section>
  )
}
