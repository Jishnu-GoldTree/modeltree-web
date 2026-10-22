import { getHomeCategories } from "@/lib/data/home";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero } from "@/components/home/home-hero";
import { TrustBar } from "@/components/home/trust-bar";
import { ShopByCategory } from "@/components/home/shop-by-category";
import { TrendingModels } from "@/components/home/trending-models";
import { RingCollections } from "@/components/home/ring-collections";
import { ShopByMaterial } from "@/components/home/shop-by-material";
import { JewelleryLibrary } from "@/components/home/jewellery-library";
import { HowItWorks } from "@/components/home/how-it-works";
import { MembershipTeaser } from "@/components/home/membership-teaser";
import { CustomWorkCta } from "@/components/home/custom-work-cta";
import { HomeFaq } from "@/components/home/home-faq";

/**
 * Each section answers one question a jeweller has on the way to a purchase,
 * in the order they ask it: what is this (hero), can I trust it (trust bar),
 * what do you have (categories, trending), which ring collection suits the occasion (engagement and wedding), what stone shape it fits, who made it (library), how does buying work (steps), what else is
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
          <RingCollections />
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
