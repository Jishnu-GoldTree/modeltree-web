import { TRENDING_MODELS } from "@/lib/data/landing"
import { ModelCard } from "@/components/marketplace/model-card"
import { SectionHeading } from "@/components/landing/section-heading"

export function TrendingModels() {
  return (
    <section className="shell">
      <SectionHeading
        title="Trending 3D models"
        description="Discover the most popular 3D models and assets trending right now."
        action={{ label: "Browse all models", href: "/3d-models?sort=trending" }}
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
