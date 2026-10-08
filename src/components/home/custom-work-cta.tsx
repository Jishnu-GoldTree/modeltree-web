import { getTranslations } from "next-intl/server"
import { PenTool, Sliders } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { ProductVideo } from "@/components/marketplace/product-video"

/**
 * The library sells what exists; this sells what doesn't yet. Both buttons go
 * straight into the request form with its kind preselected, one click from
 * describing the job.
 */
export async function CustomWorkCta() {
  const t = await getTranslations("home.custom")

  return (
    <section className="shell">
      <div className="grid overflow-hidden rounded-3xl bg-ink text-ink-foreground lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="p-8 sm:p-12">
          <p className="text-xs font-semibold tracking-[0.14em] text-brand-on-ink uppercase">{t("eyebrow")}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("title")}</h2>
          <p className="mt-4 max-w-xl text-sm text-pretty text-white/70 sm:text-base">{t("body")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-11 bg-brand px-6 text-brand-foreground hover:bg-brand/85">
              <Link href="/requests/new?kind=adjustment">
                <Sliders className="size-4" aria-hidden />
                {t("adjust")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 border-white/25 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/requests/new?kind=commission">
                <PenTool className="size-4" aria-hidden />
                {t("commission")}
              </Link>
            </Button>
          </div>
        </div>
        <div className="hidden lg:block" aria-hidden>
          <ProductVideo
            src="/videos/ijewel-09.webm"
            poster="/videos/posters/ijewel-09.webp"
            className="h-full min-h-80"
          />
        </div>
      </div>
    </section>
  )
}
