import { getTranslations } from "next-intl/server"

import { queryModels } from "@/lib/data/catalog"
import { getFavoriteSet } from "@/lib/favorites"
import { ModelCard } from "@/components/marketplace/model-card"
import { SectionHeading } from "@/components/landing/section-heading"

/**
 * Reads the catalog instead of a fixture list. The fixtures it replaced were
 * general-3D placeholders (a Roman bust, a race car) whose slugs were not in
 * the database, so every card on the landing page linked to a 404.
 */
export async function TrendingModels() {
  const t = await getTranslations("landing.trending")
  const [{ items }, favorites] = await Promise.all([
    queryModels({ sort: "trending", page: 1 }),
    getFavoriteSet(),
  ])

  const top = items.slice(0, 8)
  if (top.length === 0) return null

  return (
    <section className="shell">
      <SectionHeading
        title={t("title")}
        description={t("description")}
        action={{ label: t("action"), href: "/3d-models?sort=trending" }}
      />
      <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {top.map((model) => (
          <li key={model.slug}>
            <ModelCard model={model} favorited={favorites.has(model.slug)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
