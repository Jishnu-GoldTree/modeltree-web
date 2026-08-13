import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { ASSET_CATEGORIES } from "@/lib/data/landing"
import {
  FORMATS,
  LICENSE_LABELS,
  type CatalogResult,
} from "@/lib/data/catalog"

/**
 * Filter rail.
 *
 * Every control is a link that rewrites the query string, not a client-side
 * control: filters stay shareable and bookmarkable, the page works without JS,
 * and there is no state to keep in sync with the URL. Toggling a filter that's
 * already on removes it, so the same link serves both directions.
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

function Group({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 border-b py-4 first:pt-0 last:border-b-0">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Option({
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
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm outline-none",
        "hover:bg-accent focus-visible:ring-3 focus-visible:ring-brand/50",
        active && "bg-brand-muted font-medium text-brand-accent",
      )}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
    </Link>
  )
}

export async function CatalogFilters({
  base,
  params,
  facets,
  lockedCategory,
}: {
  base: string
  params: Params
  facets: CatalogResult["facets"]
  /** Set on /3d-models/[category], where the category is the page, not a filter. */
  lockedCategory?: string
}) {
  const t = await getTranslations("catalog")
  const cat = await getTranslations("landing")
  const lic = await getTranslations("license")
  const toggle = (key: string, value: string) =>
    href(base, params, { [key]: params[key] === value ? undefined : value })

  const activeCount = Object.entries(params).filter(
    ([key, value]) => value && key !== "sort" && key !== "page" && key !== "q",
  ).length

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-sm font-semibold">{t("filters")}</h2>
        {activeCount > 0 && (
          <Link
            href={href(base, {}, { sort: params.sort, q: params.q })}
            className="inline-flex items-center gap-1 rounded-md text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            <X className="size-3" aria-hidden />
            {t("clearAll")}
          </Link>
        )}
      </div>

      <Group title={t("price")}>
        <div className="flex flex-col gap-0.5">
          <Option
            href={toggle("price", "free")}
            active={params.price === "free"}
            label={t("free")}
          />
          <Option
            href={toggle("price", "paid")}
            active={params.price === "paid"}
            label={t("paid")}
          />
        </div>
      </Group>

      {!lockedCategory && (
        <Group title={t("category")}>
          <div className="flex flex-col gap-0.5">
            {ASSET_CATEGORIES.map((category) => (
              <Option
                key={category.slug}
                href={toggle("category", category.slug)}
                active={params.category === category.slug}
                label={cat(`categories.${category.key}`)}
                count={facets.categories[category.slug] ?? 0}
              />
            ))}
          </div>
        </Group>
      )}

      <Group title={t("fileFormat")}>
        <div className="flex flex-col gap-0.5">
          {FORMATS.map((format) => (
            <Option
              key={format.value}
              href={toggle("format", format.value)}
              active={params.format === format.value}
              label={format.label}
              count={facets.formats[format.value] ?? 0}
            />
          ))}
        </div>
      </Group>

      <Group title={t("licenseGroup")}>
        <div className="flex flex-col gap-0.5">
          {Object.keys(LICENSE_LABELS).map((value) => (
            <Option
              key={value}
              href={toggle("license", value)}
              active={params.license === value}
              label={lic(value)}
              count={facets.licenses[value] ?? 0}
            />
          ))}
        </div>
      </Group>

      <Group title={t("features")}>
        <div className="flex flex-col gap-0.5">
          {[
            { key: "rigged", label: t("rigged") },
            { key: "animated", label: t("animated") },
            { key: "pbr", label: t("pbr") },
          ].map((feature) => (
            <Option
              key={feature.key}
              href={toggle(feature.key, "1")}
              active={params[feature.key] === "1"}
              label={feature.label}
            />
          ))}
        </div>
      </Group>
    </div>
  )
}

export { href as catalogHref }
