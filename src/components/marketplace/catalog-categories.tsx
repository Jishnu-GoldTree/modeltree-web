import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"

import { cn } from "@/lib/utils"
import { ASSET_CATEGORIES } from "@/lib/data/landing"
import type { CatalogResult } from "@/lib/data/catalog"
import { CategoryScroller } from "@/components/marketplace/category-scroller"

/**
 * Category tabs: the first cut a jeweller makes. Each tab is a plain link to
 * that category's page (`/3d-models/[slug]`), so the row is shareable and needs
 * no client state, matching the toolbar below it.
 *
 * Text with a live count rather than thumbnailed chips: at chip size every
 * ring render looked the same, so the pictures added noise, not recognition.
 * Categories with no live models are dropped so every tab leads somewhere.
 *
 * `active` is the currently browsed category (the locked segment, or the
 * `?category` filter on the base page); "All" stands in when neither.
 */
export async function CatalogCategories({
  active,
  facets,
}: {
  active?: string
  facets: CatalogResult["facets"]
}) {
  const t = await getTranslations("landing")
  const c = await getTranslations("catalog")

  const tabs = ASSET_CATEGORIES.map((category) => ({
    ...category,
    count: facets.categories[category.slug] ?? 0,
  })).filter((category) => category.count > 0 || category.slug === active)
  const total = tabs.reduce((sum, tab) => sum + tab.count, 0)

  return (
    <div className="border-b">
      <div className="shell">
        <CategoryScroller
          prevLabel={c("scrollLeft")}
          nextLabel={c("scrollRight")}
          listClassName="items-end gap-6 pt-1"
        >
          <Tab href="/3d-models" active={!active} label={c("allCategories")} count={total} />
          {tabs.map((tab) => (
            <Tab
              key={tab.slug}
              href={`/3d-models/${tab.slug}`}
              active={active === tab.slug}
              label={t(`categories.${tab.key}`)}
              count={tab.count}
            />
          ))}
        </CategoryScroller>
      </div>
    </div>
  )
}

function Tab({
  href,
  active,
  label,
  count,
}: {
  href: string
  active: boolean
  label: string
  count: number
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pt-2 pb-3 text-sm whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-brand/50",
          active
            ? "border-brand font-semibold text-foreground"
            : "border-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground",
        )}
      >
        {label}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs tabular-nums",
            active ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      </Link>
    </li>
  )
}
