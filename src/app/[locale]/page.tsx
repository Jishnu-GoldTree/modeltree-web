import { getTranslations } from "next-intl/server";

import { ASSET_CATEGORIES, ASSET_TABS } from "@/lib/data/landing";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Hero } from "@/components/landing/hero";
import { PromoBanner } from "@/components/landing/promo-banner";
import { JewelleryLibrary } from "@/components/landing/jewellery-library";
import { CategoryExplorer } from "@/components/landing/category-explorer";
import { Collections } from "@/components/landing/collections";
import { FeaturedDesigner } from "@/components/landing/featured-designer";
import { BrowseBy } from "@/components/landing/browse-by";
import { BrowseByCatalog } from "@/components/landing/browse-by-catalog";
import { TrendingModels } from "@/components/landing/trending-models";
import { ValueProps } from "@/components/landing/value-props";
import { CraftStandard } from "@/components/landing/craft-standard";
import { CustomSolutions } from "@/components/landing/custom-solutions";
import { BusinessAccount } from "@/components/landing/business-account";

export default async function HomePage() {
  const t = await getTranslations("landing.explore");

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="section-flow flex-1">
        <Hero />
        <PromoBanner />
        <JewelleryLibrary />
        <TrendingModels />
        <CategoryExplorer
          title={t("assetsTitle")}
          description={t("assetsDescription")}
          chips={ASSET_TABS}
          chipNamespace="assetTabs"
          chipBase="/3d-models"
          categories={ASSET_CATEGORIES}
          categoryBase="/3d-models"
          action={{ label: t("assetsAction"), href: "/3d-models" }}
          footerAction={{ label: t("showAll"), href: "/3d-models" }}
        />

        <Collections />
        <FeaturedDesigner />
        <BrowseBy />
        <BrowseByCatalog />
        {/* The page's third full-bleed ink band, sat midway between the other
            two — Jewellery library above, Custom solutions below — so the dark
            bands space out rather than clump. */}
        <CraftStandard />
        <ValueProps />
        <CustomSolutions />
        <BusinessAccount />
      </main>

      <SiteFooter />
    </>
  );
}
