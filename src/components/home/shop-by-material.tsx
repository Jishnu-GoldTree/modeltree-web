import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { METALS, STONES, queryModels } from "@/lib/data/catalog"
import { MetalIcon, StoneIcon } from "@/components/home/material-icons"

/**
 * The next two cuts a jeweller makes after the category: the metal they cast
 * in and the stone they're setting. Counts come from the catalog's cached
 * facets, and only values with published models appear: a row of zeros reads
 * as an empty shop.
 *
 * Links go to the filtered catalog (`?metal=`, `?stone=`), the same URLs the
 * catalog toolbar builds, so they're nofollow like those for crawl budget.
 */
export async function ShopByMaterial() {
  const t = await getTranslations("home.material")
  const facet = await getTranslations("facet")
  const { facets } = await queryModels({}, { facets: true })

  const metals = METALS.filter((m) => m !== "unspecified")
    .map((m) => ({ value: m, count: facets.metals[m] ?? 0 }))
    .filter((m) => m.count > 0)
  const stones = STONES.filter((s) => s !== "none")
    .map((s) => ({ value: s, count: facets.stones[s] ?? 0 }))
    .filter((s) => s.count > 0)

  if (metals.length === 0 && stones.length === 0) return null

  return (
    <section className="shell">
      <div className="grid gap-4 lg:grid-cols-2">
        {metals.length > 0 && (
          <div className="rounded-2xl border p-6 sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight">{t("metalTitle")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("metalBody")}</p>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))]">
              {metals.map(({ value, count }) => (
                <li key={value}>
                  <Link
                    href={`/3d-models?metal=${value}`}
                    rel="nofollow"
                    className="group flex h-full flex-col items-center gap-1 rounded-xl border px-3 pt-5 pb-4 text-center outline-none transition-colors hover:border-brand focus-visible:ring-3 focus-visible:ring-brand/50"
                  >
                    <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-cream transition-colors group-hover:bg-brand-muted">
                      <MetalIcon metal={value} className="size-10" />
                    </span>
                    <span className="text-sm leading-tight font-medium">{facet(`metal.${value}`)}</span>
                    <span className="text-xs text-muted-foreground">{t("count", { count })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {stones.length > 0 && (
          <div className="rounded-2xl border p-6 sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight">{t("stoneTitle")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("stoneBody")}</p>
            <ul className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] sm:gap-3">
              {stones.map(({ value, count }) => (
                <li key={value}>
                  <Link
                    href={`/3d-models?stone=${value}`}
                    rel="nofollow"
                    className="group flex h-full flex-col items-center gap-1 rounded-xl border px-3 pt-5 pb-4 text-center outline-none transition-colors hover:border-brand focus-visible:ring-3 focus-visible:ring-brand/50"
                  >
                    <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-cream text-foreground/75 transition-colors group-hover:bg-brand-muted group-hover:text-brand-accent">
                      <StoneIcon cut={value} className="size-9" />
                    </span>
                    <span className="text-sm leading-tight font-medium">{facet(`stone.${value}`)}</span>
                    <span className="text-xs text-muted-foreground">{t("count", { count })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
