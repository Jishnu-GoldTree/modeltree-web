import { getTranslations } from "next-intl/server";

import {
  ASSET_CATEGORIES,
  ASSET_TABS,
  PRINT_CATEGORIES,
  PRINT_TABS,
} from "@/lib/data/landing";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Hero } from "@/components/landing/hero";
import { PromoBanner } from "@/components/landing/promo-banner";
import { JewelleryLibrary } from "@/components/landing/jewellery-library";
import { CategoryExplorer } from "@/components/landing/category-explorer";
import { Collections } from "@/components/landing/collections";
import { FeaturedDesigner } from "@/components/landing/featured-designer";
import { BrowseBy } from "@/components/landing/browse-by";
import { TrendingModels } from "@/components/landing/trending-models";
import { ValueProps } from "@/components/landing/value-props";
import { CustomSolutions } from "@/components/landing/custom-solutions";
import { BusinessAccount } from "@/components/landing/business-account";

export default async function HomePage() {
  const t = await getTranslations("landing.explore");

  return (
    <>
      <SiteHeader />
      <main className="section-flow flex-1">
        <Hero />
        <PromoBanner />
        <JewelleryLibrary />
        <CategoryExplorer
          title={t("assetsTitle")}
          description={t("assetsDescription")}
          chips={ASSET_TABS}
          chipNamespace="assetTabs"
          chipBase="/3d-models"
          categories={ASSET_CATEGORIES}
          categoryBase="/3d-models"
          action={{ label: t("assetsAction"), href: "/3d-models" }}
          footerAction={{ label: t("showAll"), href: "/categories" }}
        />

        <CategoryExplorer
          title={t("printTitle")}
          description={t("printDescription")}
          chips={PRINT_TABS}
          chipNamespace="printTabs"
          chipBase="/3d-print-models"
          categories={PRINT_CATEGORIES}
          categoryBase="/3d-print-models"
          action={{ label: t("printAction"), href: "/3d-print-models" }}
          footerAction={{ label: t("showAll"), href: "/categories?type=print" }}
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
  );
}
