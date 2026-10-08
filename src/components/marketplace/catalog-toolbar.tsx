import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { Check, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { CatalogMenu as Menu } from "@/components/marketplace/catalog-menu"
import {
  FORMATS,
  LICENSE_LABELS,
  METALS,
  SORTS,
  STONES,
  type CatalogResult,
} from "@/lib/data/catalog"

/**
 * Horizontal filter bar, replacing the old left rail.
 *
 * Every control is still a link that rewrites the query string, not a
 * client-side control: filters stay shareable and bookmarkable, the page works
 * without JS, and there is no state to keep in sync with the URL. The dropdowns
 * are native <details> (see CatalogMenu), which keeps them working without JS;
 * a thin client wrapper only adds close-on-outside-click and close-on-select.
 * Toggling a value that's already on removes it, so one link serves both ways.
 */

type Params = Record<string, string | undefined>

/** Drops empty values and always resets to page 1 — page 3 of a new filter is a dead end. */
function href(base: string, params: Params, patch: Params) {
  const next = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value)
  }
  next.delete("page")
  const qs = next.toString()
  return qs ? `${base}?${qs}` : base
}

/**
 * Filter links are not prefetched.
 *
 * Each one points at another query-string permutation of the catalogue, and a
 * prefetch renders that route in full — listing rows and facet counts — for a
 * filter the visitor may never choose. There are around thirty of them on
 * screen, so the default prefetch turned opening the filter menu into thirty
 * catalogue renders. `robots.ts` already refuses crawlers these URLs for the
 * same reason; this is the same rule applied to our own prefetcher.
 *
 * The cost is a beat of latency on the click, which is the right trade for a
 * filter: the visitor is choosing, not navigating a path they already know.
 */
function Segment({
  href: to,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <Link
      href={to}
      prefetch={false}
      rel={to.includes("?") ? "nofollow" : undefined}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-3 py-1 text-sm whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-brand/50",
        active ? "bg-ink font-medium text-ink-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  )
}

function MenuLink({
  href: to,
  active,
  label,
  count,
}: {
  href: string
  active: boolean
  label: string
  count?: number
}) {
  return (
    <Link
      href={to}
      prefetch={false}
      rel={to.includes("?") ? "nofollow" : undefined}
      aria-current={active ? "true" : undefined}
      title={label}
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm outline-none",
        "hover:bg-accent focus-visible:ring-3 focus-visible:ring-brand/50",
        active && "font-medium text-brand-accent",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Check
          className={cn("size-3.5 shrink-0", active ? "opacity-100" : "opacity-0")}
          aria-hidden
        />
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
    </Link>
  )
}

export async function CatalogToolbar({
  base,
  params,
  facets,
}: {
  base: string
  params: Params
  facets: CatalogResult["facets"]
}) {
  const t = await getTranslations("catalog")
  const lic = await getTranslations("license")
  const facet = await getTranslations("facet")
  const s = await getTranslations("sort")

  const toggle = (key: string, value: string) =>
    href(base, params, { [key]: params[key] === value ? undefined : value })

  const activeCount = Object.entries(params).filter(
    ([key, value]) => value && key !== "sort" && key !== "page" && key !== "q",
  ).length

  const sort = params.sort ?? "trending"

  // Labels are derived from the known vocabularies, never straight off the URL:
  // a hand-edited ?metal=foo must fall back to the group name, not ask the
  // message catalog for a key that isn't there.
  const formatLabel = FORMATS.find((f) => f.value === params.format)?.label
  const priceLabel =
    params.price === "free" ? t("free") : params.price === "paid" ? t("paid") : undefined
  const metalLabel =
    params.metal && METALS.includes(params.metal as (typeof METALS)[number]) && params.metal !== "unspecified"
      ? facet(`metal.${params.metal}`)
      : undefined
  const stoneLabel =
    params.stone && STONES.includes(params.stone as (typeof STONES)[number]) && params.stone !== "none"
      ? facet(`stone.${params.stone}`)
      : undefined
  const licenseLabel =
    params.license && params.license in LICENSE_LABELS ? lic(params.license) : undefined

  const production = params.production === "cast" || params.production === "print" ? params.production : undefined

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* How the piece gets made is a choice of one, so it reads as a
          segmented control rather than two loose toggles. */}
      <div role="group" aria-label={t("productionFilter.label")} className="inline-flex rounded-lg border p-0.5">
        {([undefined, "cast", "print"] as const).map((value) => (
          <Segment
            key={value ?? "all"}
            href={href(base, params, { production: value })}
            active={production === value}
            label={t(`productionFilter.${value ?? "all"}`)}
          />
        ))}
      </div>

      <span aria-hidden className="mx-1 hidden h-5 w-px bg-border sm:block" />

      <Menu label={metalLabel ?? t("metal")} active={Boolean(metalLabel)}>
        {METALS.filter((m) => m !== "unspecified").map((metal) => (
          <MenuLink
            key={metal}
            href={toggle("metal", metal)}
            active={params.metal === metal}
            label={facet(`metal.${metal}`)}
            count={facets.metals[metal] ?? 0}
          />
        ))}
      </Menu>

      <Menu label={stoneLabel ?? t("stone")} active={Boolean(stoneLabel)}>
        {STONES.filter((st) => st !== "none").map((stone) => (
          <MenuLink
            key={stone}
            href={toggle("stone", stone)}
            active={params.stone === stone}
            label={facet(`stone.${stone}`)}
            count={facets.stones[stone] ?? 0}
          />
        ))}
      </Menu>

      <Menu
        label={formatLabel ?? t("fileFormat")}
        active={Boolean(formatLabel)}
      >
        {FORMATS.map((format) => (
          <MenuLink
            key={format.value}
            href={toggle("format", format.value)}
            active={params.format === format.value}
            label={format.label}
            count={facets.formats[format.value] ?? 0}
          />
        ))}
      </Menu>

      <Menu label={priceLabel ?? t("price")} active={Boolean(priceLabel)}>
        <MenuLink
          href={toggle("price", "free")}
          active={params.price === "free"}
          label={t("free")}
        />
        <MenuLink
          href={toggle("price", "paid")}
          active={params.price === "paid"}
          label={t("paid")}
        />
      </Menu>

      <Menu label={licenseLabel ?? t("licenseGroup")} active={Boolean(licenseLabel)}>
        {Object.keys(LICENSE_LABELS).map((value) => (
          <MenuLink
            key={value}
            href={toggle("license", value)}
            active={params.license === value}
            label={lic(value)}
            count={facets.licenses[value] ?? 0}
          />
        ))}
      </Menu>

      <div className="ms-auto flex items-center gap-2">
        <Menu
          label={s(sort)}
          active={sort !== "trending"}
          align="end"
        >
          {SORTS.map((option) => (
            <MenuLink
              key={option.value}
              href={href(base, params, {
                sort: option.value === "trending" ? undefined : option.value,
              })}
              active={sort === option.value}
              label={s(option.value)}
            />
          ))}
        </Menu>

        {activeCount > 0 && (
          <Link
            href={href(base, {}, { sort: params.sort, q: params.q })}
            rel={params.sort || params.q ? "nofollow" : undefined}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            {t("clearAll")}
          </Link>
        )}
      </div>
    </div>
  )
}

export { href as catalogHref }
