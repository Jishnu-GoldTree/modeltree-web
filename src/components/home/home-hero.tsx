import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"

import { Link } from "@/i18n/navigation"
import type { HomeCategory } from "@/lib/data/home"
import { SearchForm } from "@/components/forms/search-form"
import { Button } from "@/components/ui/button"
import { ProductVideo } from "@/components/marketplace/product-video"

/**
 * Four pieces rendered on the same cream ground as this section, so the grid
 * reads as one surface. Deliberately different clips from the library band
 * further down the page.
 */
const HERO_CLIPS = ["ijewel-05", "ijewel-03", "ijewel-10", "ijewel-01"] as const

/**
 * The first screen answers three questions and stops: what this is (cast-ready
 * jewellery models), where to start (search, or one of the common categories),
 * and what it looks like (the library's own turntables).
 *
 * The surface is the same warm off-white the pieces are rendered on, so the
 * clips sit in the page rather than as dark boxes on it. Below lg the clips
 * are left out entirely: on a phone they would push the search below the fold
 * and cost several megabytes before the visitor has done anything.
 */
export async function HomeHero({ categories }: { categories: HomeCategory[] }) {
  const t = await getTranslations("home.hero")
  const labels = await getTranslations("landing.categories")

  return (
    <section className="header-offset bg-cream">
      <div className="shell grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:py-20">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-brand-accent uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t.rich("title", {
              hl: (chunks) => <span className="text-brand-accent">{chunks}</span>,
            })}
          </h1>
          <p className="mt-5 text-base text-pretty text-muted-foreground sm:text-lg">
            {t("body")}
          </p>

          <div className="mt-8">
            <SearchForm />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("popular")}:</span>
            {/* The busiest categories, never a fixed list: a chip that opens an
                empty category is a dead end on the first click. */}
            {categories.slice(0, 4).map((c) => (
              <Link
                key={c.slug}
                href={`/3d-models/${c.slug}`}
                className="rounded-full border border-foreground/10 bg-background/70 px-3 py-1 transition-colors hover:border-brand/50 hover:text-brand-accent"
              >
                {labels(c.slug)}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-11 bg-brand px-6 text-brand-foreground hover:bg-brand/85">
              <Link href="/3d-models">
                {t("browse")}
                <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 bg-background/70 px-6">
              <Link href="/custom-work">{t("commission")}</Link>
            </Button>
          </div>
        </div>

        <ul className="hidden grid-cols-2 gap-3 lg:grid" aria-hidden>
          {HERO_CLIPS.map((clip, i) => (
            <li key={clip} className={i % 2 === 1 ? "translate-y-8" : undefined}>
              <ProductVideo
                src={`/videos/${clip}.webm`}
                poster={`/videos/posters/${clip}.webp`}
                className="aspect-4/5 rounded-2xl shadow-sm"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
