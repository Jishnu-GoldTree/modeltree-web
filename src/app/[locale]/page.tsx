import { getHomeCategories } from "@/lib/data/home";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero } from "@/components/home/home-hero";
import { TrustBar } from "@/components/home/trust-bar";
import { ShopByCategory } from "@/components/home/shop-by-category";
import { TrendingModels } from "@/components/home/trending-models";
import { ProductionSplit } from "@/components/home/production-split";
import { ShopByMaterial } from "@/components/home/shop-by-material";
import { JewelleryLibrary } from "@/components/home/jewellery-library";
import { HowItWorks } from "@/components/home/how-it-works";
import { MembershipTeaser } from "@/components/home/membership-teaser";
import { CustomWorkCta } from "@/components/home/custom-work-cta";
import { HomeFaq } from "@/components/home/home-faq";

/**
 * Each section answers one question a jeweller has on the way to a purchase,
 * in the order they ask it: what is this (hero), can I trust it (trust bar),
 * what do you have (categories, trending), will it fit my workflow (production
 * split), what's it in (metal, stone shape), who made it (library), how does buying work (steps), what else is
 * on offer (membership, custom work), and what about… (FAQ).
 *
 * A section that can't answer its question with real data (an empty category,
 * no trending models) renders nothing rather than a placeholder.
 */
export default async function HomePage() {
  const categories = await getHomeCategories();

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <HomeHero categories={categories} />
        <TrustBar />

        <div className="section-flow pt-16 sm:pt-20">
          <ShopByCategory categories={categories} />
          <TrendingModels />
          <ProductionSplit />
          <ShopByMaterial />
          <JewelleryLibrary />
          <HowItWorks />
          <MembershipTeaser />
          <CustomWorkCta />
          <HomeFaq />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
