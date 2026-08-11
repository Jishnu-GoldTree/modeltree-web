import {
  ASSET_CATEGORIES,
  ASSET_TABS,
  PRINT_CATEGORIES,
  PRINT_TABS,
} from "@/lib/data/landing"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Hero } from "@/components/landing/hero"
import { PromoBanner } from "@/components/landing/promo-banner"
import { CategoryExplorer } from "@/components/landing/category-explorer"
import { Collections } from "@/components/landing/collections"
import { FeaturedDesigner } from "@/components/landing/featured-designer"
import { BrowseBy } from "@/components/landing/browse-by"
import { TrendingModels } from "@/components/landing/trending-models"
import { ValueProps } from "@/components/landing/value-props"
import { CustomSolutions } from "@/components/landing/custom-solutions"
import { BusinessAccount } from "@/components/landing/business-account"

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <PromoBanner />

        <CategoryExplorer
          title="Explore 3D assets"
          description="Find the perfect 3D asset for any search or style with our curated themed packs."
          chips={ASSET_TABS}
          chipBase="/3d-models"
          categories={ASSET_CATEGORIES}
          categoryBase="/3d-models"
          action={{ label: "Browse all 3D models", href: "/3d-models" }}
          footerAction={{ label: "Show all categories", href: "/categories" }}
        />

        <CategoryExplorer
          title="Explore 3D print ready models"
          description="Find the perfect 3D asset for any search or style with our curated themed packs."
          chips={PRINT_TABS}
          chipBase="/3d-print-models"
          categories={PRINT_CATEGORIES}
          categoryBase="/3d-print-models"
          action={{
            label: "Browse all 3D print models",
            href: "/3d-print-models",
          }}
          footerAction={{
            label: "Show all categories",
            href: "/categories?type=print",
          }}
        />

        <Collections />
        <FeaturedDesigner />
        <BrowseBy />
        <TrendingModels />
        <ValueProps />
        <CustomSolutions />
        <BusinessAccount />
      </main>

      <SiteFooter />
    </>
  )
}
