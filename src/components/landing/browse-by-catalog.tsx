import { getTranslations } from "next-intl/server"

import { BROWSE_BY_TYPE } from "@/lib/data/landing"
import { FORMATS } from "@/lib/data/catalog-facets"
import { FACET_COUNTS } from "@/lib/data/stats"
import { BrowseList } from "@/components/landing/browse-by"

/**
 * The other two axes a jeweler narrows by: the piece they're making (category)
 * and the file their pipeline takes (format). Counts come from the same static
 * snapshot as the metal/stone lists above — a format counts a model once per
 * extension it ships, so a multi-format model appears in several rows. Formats
 * are looked up by stored value ("stl"), not display label ("STL").
 */
export async function BrowseByCatalog() {
  const t = await getTranslations("landing.browse")
  const categories = await getTranslations("landing.categories")

  return (
    <section className="shell">
      <div className="grid gap-10 rounded-2xl border bg-card p-6 sm:grid-cols-2 sm:p-8">
        <BrowseList
          heading={t("typeHeading")}
          blurb={t("typeBlurb")}
          items={BROWSE_BY_TYPE.map((type) => ({
            href: type.href,
            label: categories(type.key),
            count: FACET_COUNTS.categories[type.key] ?? 0,
          }))}
        />
        <BrowseList
          heading={t("formatHeading")}
          blurb={t("formatBlurb")}
          items={FORMATS.map((format) => ({
            href: `/3d-models?format=${format.value}`,
            label: format.label,
            count: FACET_COUNTS.formats[format.value] ?? 0,
          }))}
        />
      </div>
    </section>
  )
}
