import { Link } from "@/i18n/navigation"
import { ArrowRight, ChevronRight, Gem, SearchX, X } from "lucide-react"

import { type CatalogQuery, type CatalogResult } from "@/lib/data/catalog"
import { CatalogGrid } from "@/components/marketplace/catalog-grid"
import { CatalogCategories } from "@/components/marketplace/catalog-categories"
import {
  CatalogToolbar,
  catalogHref,
} from "@/components/marketplace/catalog-toolbar"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"

type Params = Record<string, string | undefined>

/**
 * The listing body, shared by /3d-models and /3d-models/[segment] so the two
 * routes can't drift. Top to bottom: where you are (breadcrumb, title), the
 * category tabs, one filter bar, then the full-width grid.
 */
export async function CatalogView({
  base,
  params,
  patch = {},
  result,
  lockedCategory,
  title,
  description,
}: {
  base: string
  params: Params
  /** The segment's locked filter (category/collection), merged into the query
   *  server-side. Passed to the grid so it can fetch matching later pages. */
  patch?: Partial<CatalogQuery>
  result: CatalogResult
  lockedCategory?: string
  title: string
  description: string
}) {
  const { items, total, page, pageCount, facets } = result
  const t = await getTranslations("catalog")
  const member = await getTranslations("membership")

  // On the base /3d-models page the last crumb would repeat the H1, so it's
  // dropped; segment pages keep it and link the parent catalog.
  const isSegment = base !== "/3d-models"

  return (
    <>
      <div className="shell pt-8 pb-6">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground">
            {t("home")}
          </Link>
          <ChevronRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
          {isSegment ? (
            <>
              <Link href="/3d-models" className="hover:text-foreground">
                {t("title")}
              </Link>
              <ChevronRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
              <span className="text-foreground">{title}</span>
            </>
          ) : (
            <span className="text-foreground">{title}</span>
          )}
        </nav>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <CatalogCategories active={lockedCategory ?? params.category} facets={facets} />

      <div className="border-b">
        <div className="shell py-3">
          <CatalogToolbar base={base} params={params} facets={facets} />
        </div>
      </div>

      <div className="shell pt-5 pb-8">
        <div className="flex flex-wrap items-center gap-3">
          {/* One interpolated message, not a number glued to a noun: word
              order differs per language and concatenation breaks in RTL. */}
          <p className="text-sm text-muted-foreground">{t("count", { count: total })}</p>

          {/* The term arrives from the header search, so without this the
              results have no visible cause. Clearing it keeps the filters,
              mirroring how "clear all" keeps the term. */}
          {params.q && (
            <Link
              href={catalogHref(base, params, { q: undefined })}
              rel="nofollow"
              className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-brand bg-brand-muted py-1 ps-3 pe-2 text-xs font-medium text-brand-accent outline-none hover:bg-brand-muted/70 focus-visible:ring-3 focus-visible:ring-brand/50"
            >
              <span className="truncate">{t("searchedFor", { query: params.q })}</span>
              <X className="size-3.5 shrink-0" aria-hidden />
              <span className="sr-only">{t("clearSearch")}</span>
            </Link>
          )}

          {/* A tag arrives from a listing's tag chip, so like search it needs a
              visible, removable cause for the narrowed results. */}
          {params.tag && (
            <Link
              href={catalogHref(base, params, { tag: undefined })}
              rel="nofollow"
              className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-brand bg-brand-muted py-1 ps-3 pe-2 text-xs font-medium text-brand-accent outline-none hover:bg-brand-muted/70 focus-visible:ring-3 focus-visible:ring-brand/50"
            >
              <span className="truncate" dir="auto">{t("taggedWith", { tag: params.tag })}</span>
              <X className="size-3.5 shrink-0" aria-hidden />
              <span className="sr-only">{t("clearTag")}</span>
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-xl border py-20 text-center">
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
          <CatalogGrid
            // Reset accumulated pages when the filters change: a client-side
            // navigation keeps this mounted, and useState would otherwise hold
            // the previous query's results.
            key={JSON.stringify({ base, params, patch })}
            initialItems={items}
            params={params}
            patch={patch}
            initialPage={page}
            pageCount={pageCount}
            loadMoreLabel={t("loadMore")}
            errorLabel={t("loadError")}
            promo={
              <Link
                href="/pricing"
                className="flex flex-col gap-3 rounded-xl border border-brand bg-brand-muted p-5 outline-none transition-colors hover:bg-brand-muted/70 focus-visible:ring-3 focus-visible:ring-brand/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex items-start gap-3">
                  <Gem className="mt-0.5 size-5 shrink-0 text-brand-accent" aria-hidden />
                  <span>
                    <span className="block font-medium">{member("stripTitle")}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {member("stripBody")}
                    </span>
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-accent">
                  {member("stripCta")}
                  <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
                </span>
              </Link>
            }
          />
        )}
      </div>
    </>
  )
}
