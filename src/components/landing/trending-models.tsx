import { useTranslations } from "next-intl"

import { TRENDING_MODELS } from "@/lib/data/landing"
import { ModelCard } from "@/components/marketplace/model-card"
import { SectionHeading } from "@/components/landing/section-heading"

export function TrendingModels() {
  const t = useTranslations("landing.trending")

  return (
    <section className="shell">
      <SectionHeading
        title={t("title")}
        description={t("description")}
        action={{ label: t("action"), href: "/3d-models?sort=trending" }}
      />

      <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {TRENDING_MODELS.map((model) => (
          <li key={model.slug}>
            <ModelCard model={model} />
          </li>
        ))}
      </ul>
    </section>
  )
}
