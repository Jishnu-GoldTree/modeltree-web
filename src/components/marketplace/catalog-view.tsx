import Link from "next/link"
import { SearchX, SlidersHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { SORTS, type CatalogResult } from "@/lib/data/catalog"
import { ModelCard } from "@/components/marketplace/model-card"
import {
  CatalogFilters,
  catalogHref,
} from "@/components/marketplace/catalog-filters"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type Params = Record<string, string | undefined>

/**
 * The listing body, shared by /3d-models and /3d-models/[segment] so the two
 * routes can't drift. Filters live in a sheet below `lg`, where a permanent
 * rail would eat the whole screen.
 */
export async function CatalogView({
  base,
  params,
  result,
  lockedCategory,
  favorites,
}: {
  base: string
  params: Params
  result: CatalogResult
  lockedCategory?: string
  favorites: Set<string>
}) {
  const { items, total, page, pageCount, facets } = result
  const t = await getTranslations("catalog")
  const filters = (
    <CatalogFilters
      base={base}
      params={params}
      facets={facets}
      lockedCategory={lockedCategory}
    />
  )

  return (
    <div className="shell flex gap-8 py-8">
      <aside className="hidden w-60 shrink-0 lg:block">{filters}</aside>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
          {/* One interpolated message, not a number glued to a noun: word
              order differs per language and concatenation breaks in RTL. */}
          <p className="text-sm text-muted-foreground">{t("count", { count: total })}</p>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="lg:hidden">
                  <SlidersHorizontal className="size-4" aria-hidden />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="start" className="w-[300px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">{filters}</div>
              </SheetContent>
            </Sheet>

            {/* Sort is a row of links for the same reason the filters are —
                shareable URLs, and no client state to reconcile. */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {SORTS.map((sort) => {
                const active = (params.sort ?? "trending") === sort.value
                return (
                  <Link
                    key={sort.value}
                    href={catalogHref(base, params, { sort: sort.value })}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-xs whitespace-nowrap outline-none",
                      "hover:bg-accent focus-visible:ring-3 focus-visible:ring-brand/50",
                      active &&
                        "border-brand bg-brand-muted font-medium text-brand-accent",
                    )}
                  >
                    {sort.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border py-20 text-center">
            <SearchX className="size-8 text-muted-foreground" aria-hidden />
            <h2 className="mt-4 font-semibold">{t("emptyTitle")}</h2>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              {t("emptyBody")}
            </p>
            <Button asChild variant="outline" className="mt-5 h-9">
              <Link href={base}>{t("clearAll")}</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {items.map((model) => (
              <li key={model.slug}>
                <ModelCard model={model} favorited={favorites.has(model.slug)} />
              </li>
            ))}
          </ul>
        )}

        {pageCount > 1 && (
          <nav
            aria-label="Pagination"
            className="flex items-center justify-center gap-1 pt-10"
          >
            <PageLink
              base={base}
              params={params}
              page={page - 1}
              disabled={page === 1}
              label="Previous"
            />
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={catalogHref(base, params, { page: n === 1 ? undefined : String(n) })}
                aria-current={n === page ? "page" : undefined}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-md border text-sm tabular-nums outline-none",
                  "hover:bg-accent focus-visible:ring-3 focus-visible:ring-brand/50",
                  n === page &&
                    "border-brand bg-brand-muted font-medium text-brand-accent",
                )}
              >
                {n}
              </Link>
            ))}
            <PageLink
              base={base}
              params={params}
              page={page + 1}
              disabled={page === pageCount}
              label="Next"
            />
          </nav>
        )}
      </div>
    </div>
  )
}

function PageLink({
  base,
  params,
  page,
  disabled,
  label,
}: {
  base: string
  params: Params
  page: number
  disabled: boolean
  label: string
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        className="inline-flex h-9 items-center rounded-md border px-3 text-sm text-muted-foreground opacity-50"
      >
        {label}
      </span>
    )
  }
  return (
    <Link
      href={catalogHref(base, params, { page: page === 1 ? undefined : String(page) })}
      className="inline-flex h-9 items-center rounded-md border px-3 text-sm outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-brand/50"
    >
      {label}
    </Link>
  )
}
