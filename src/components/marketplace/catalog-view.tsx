import { Fragment } from "react"
import { Link } from "@/i18n/navigation"
import { ArrowRight, ChevronRight, Gem, SearchX, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { type CatalogResult } from "@/lib/data/catalog"
import { ModelCard } from "@/components/marketplace/model-card"
import { CatalogCategories } from "@/components/marketplace/catalog-categories"
import {
  CatalogToolbar,
  catalogHref,
} from "@/components/marketplace/catalog-toolbar"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"

type Params = Record<string, string | undefined>

/** Named filters offered under "Browse by type", mirroring COLLECTION_SEGMENTS. */
const BROWSE_TYPES = ["free", "cast-ready", "print-ready"] as const

/**
 * The listing body, shared by /3d-models and /3d-models/[segment] so the two
 * routes can't drift. The layout follows a marketplace shape: a category strip
 * and a horizontal filter bar pinned under the header, then a full-width grid.
 */
export async function CatalogView({
  base,
  params,
  result,
  lockedCategory,
  favorites,
  title,
  description,
}: {
  base: string
  params: Params
  result: CatalogResult
  lockedCategory?: string
  favorites: Set<string>
  title: string
  description: string
}) {
  const { items, total, page, pageCount, facets } = result
  const t = await getTranslations("catalog")
  const seg = await getTranslations("segment")
  const member = await getTranslations("membership")

  // On the base /3d-models page the last crumb would repeat the H1, so it's
  // dropped; segment pages keep it and link the parent catalog.
  const isSegment = base !== "/3d-models"

  return (
    <>
      <CatalogCategories active={lockedCategory ?? params.category} facets={facets} />

      <div className="border-b bg-background">
        <div className="shell py-3">
          <CatalogToolbar
            base={base}
            params={params}
            facets={facets}
            lockedCategory={lockedCategory}
          />
        </div>
      </div>

      <div className="shell py-8">
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

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-muted-foreground">{t("browseByType")}</span>
          {BROWSE_TYPES.map((type) => (
            <Link
              key={type}
              href={`/3d-models/${type}`}
              className="font-medium text-brand-accent outline-none hover:underline focus-visible:ring-3 focus-visible:ring-brand/50"
            >
              {seg(type)}
            </Link>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-5">
          {/* One interpolated message, not a number glued to a noun: word
              order differs per language and concatenation breaks in RTL. */}
          <p className="text-sm text-muted-foreground">{t("count", { count: total })}</p>

          {/* The term arrives from the header search, so without this the
              results have no visible cause. Clearing it keeps the filters,
              mirroring how "clear all" keeps the term. */}
          {params.q && (
            <Link
              href={catalogHref(base, params, { q: undefined })}
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
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((model, index) => (
              <Fragment key={model.slug}>
                <li>
                  <ModelCard model={model} favorited={favorites.has(model.slug)} />
                </li>
                {/* Placed after the first full row rather than above the grid:
                    it reaches someone already comparing pieces, which is when
                    "two of these a month" means something. Once per page. */}
                {index === 4 && (
                  <li className="col-span-2 sm:col-span-3 lg:col-span-4 xl:col-span-5">
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
                  </li>
                )}
              </Fragment>
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
    </>
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
