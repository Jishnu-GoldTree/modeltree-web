import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { HeroVideo } from "@/components/landing/hero-video"

export const metadata = {
  title: "Hero preview — video background",
  robots: { index: false, follow: false },
}

/**
 * Preview-only route for the alternative video-background hero, so it can be
 * reviewed against the live SVG hero without touching the home page. Not linked
 * from anywhere and kept out of search indexes.
 */
export default function HeroVideoPreviewPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <HeroVideo />
      </main>
      <SiteFooter />
    </>
  )
}
