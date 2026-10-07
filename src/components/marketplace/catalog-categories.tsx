import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { LayoutGrid } from "lucide-react"

import { cn } from "@/lib/utils"
import { ASSET_CATEGORIES } from "@/lib/data/landing"
import type { CatalogResult } from "@/lib/data/catalog"
import { Thumb } from "@/components/marketplace/thumb"
import { CategoryScroller } from "@/components/marketplace/category-scroller"

/**
 * Category shortcut strip, pinned under the header — the row of thumbnailed
 * chips a jeweler scans first. Each chip is a plain link to that category's
 * page (`/3d-models/[slug]`), so the whole row is shareable and needs no
 * client state, matching the toolbar below it.
 *
 * `active` is the currently browsed category (the locked segment, or the
 * `?category` filter on the base page); the "All" chip stands in when neither.
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

  return (
    <div className="border-b bg-background">
      <div className="shell">
        <CategoryScroller
          prevLabel={c("scrollLeft")}
          nextLabel={c("scrollRight")}
        >
          <li>
            <Link
              href="/3d-models"
              aria-current={!active ? "true" : undefined}
              className={cn(
                "group inline-flex shrink-0 items-center gap-2 rounded-lg border py-1.5 pe-4 ps-1.5 text-sm outline-none transition-colors",
                "hover:border-brand focus-visible:ring-3 focus-visible:ring-brand/50",
                !active
                  ? "border-brand bg-brand-muted font-medium text-brand-accent"
                  : "bg-background",
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <LayoutGrid className="size-4" aria-hidden />
              </span>
              {c("allCategories")}
            </Link>
          </li>

          {ASSET_CATEGORIES.map((category) => {
            const isActive = active === category.slug
            // Categories with no live models are dropped so the strip only
            // offers rows that lead somewhere.
            if (!isActive && !(facets.categories[category.slug] ?? 0)) return null
            return (
              <li key={category.slug}>
                <Link
                  href={`/3d-models/${category.slug}`}
                  aria-current={isActive ? "true" : undefined}
                  title={t(`categories.${category.key}`)}
                  className={cn(
                    "group inline-flex shrink-0 items-center gap-2 rounded-lg border py-1.5 pe-4 ps-1.5 text-sm outline-none transition-colors",
                    "hover:border-brand focus-visible:ring-3 focus-visible:ring-brand/50",
                    isActive
                      ? "border-brand bg-brand-muted font-medium text-brand-accent"
                      : "bg-background",
                  )}
                >
                  <span className="size-8 shrink-0 overflow-hidden rounded-md">
                    <Thumb
                      seed={category.seed}
                      src={category.cover}
                      sizes="32px"
                      className="size-full"
                    />
                  </span>
                  <span className="whitespace-nowrap">
                    {t(`categories.${category.key}`)}
                  </span>
                </Link>
              </li>
            )
          })}
        </CategoryScroller>
      </div>
    </div>
  )
}
