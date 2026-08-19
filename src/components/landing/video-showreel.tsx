import type { CSSProperties } from "react"

import { getTranslations } from "next-intl/server"
import { Clapperboard } from "lucide-react"

import { ProductVideo } from "@/components/marketplace/product-video"

/**
 * The in-house renders in motion.
 *
 * Every unused clip lands here: the jewellery-library grid above shows four
 * stills-in-motion as proof, and this band lets the rest of the library sweep
 * past as a continuous reel. The track is the clip list rendered twice so the
 * CSS marquee can translate by exactly one half and loop without a seam; the
 * duplicate copy is aria-hidden so a screen reader only meets each tile once.
 *
 * The tiles reuse ProductVideo, so each one still only decodes while it is on
 * screen and falls back to its poster under reduced-motion — the marquee itself
 * also stops moving there (see globals.css).
 */
const SHOWREEL_CLIPS = [
  "ijewel-01",
  "ijewel-03",
  "ijewel-04",
  "ijewel-05",
  "ijewel-06",
  "ijewel-09",
  "ijewel-10",
  "ijewel-11",
  "ijewel-12",
] as const

export async function VideoShowreel() {
  const t = await getTranslations("showreel")

  return (
    <section className="section-band border-y bg-muted/40">
      <div className="shell">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand/15 px-3 py-1 text-xs font-medium text-brand-accent">
          <Clapperboard className="size-3.5" aria-hidden />
          {t("badge")}
        </span>
        <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-xl text-sm text-pretty text-muted-foreground sm:text-base">
          {t("description")}
        </p>
      </div>

      {/* Full-bleed track. The group scopes the hover-to-pause, and the edge
          masks fade the tiles into the band rather than clipping them hard. */}
      <div
        className="marquee-group relative mt-10 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <ul
          className="animate-marquee flex w-max gap-4 pl-4 sm:gap-5 sm:pl-6"
          style={{ "--marquee-duration": "70s" } as CSSProperties}
        >
          {[...SHOWREEL_CLIPS, ...SHOWREEL_CLIPS].map((clip, i) => (
            <li
              key={`${clip}-${i}`}
              className="w-52 shrink-0 sm:w-60"
              aria-hidden={i >= SHOWREEL_CLIPS.length}
            >
              <ProductVideo
                src={`/videos/${clip}.webm`}
                poster={`/videos/posters/${clip}.webp`}
                className="aspect-3/4 rounded-xl border shadow-sm"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
