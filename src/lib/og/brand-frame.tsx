import { SITE } from "@/lib/data/landing";
import type { Locale } from "@/i18n/routing";
import { toVisualRtl } from "@/lib/og/bidi";

/**
 * Shared artwork for the social share cards. Both `opengraph-image` and
 * `twitter-image` render this so the two can never drift apart.
 *
 * Rendered by satori, which supports only flexbox and a subset of CSS — no
 * grid, no `gap` shorthand quirks, and every element holding more than one
 * child needs an explicit `display: flex`. The brand tokens live in
 * `globals.css` as oklch(), which satori cannot parse, so they are inlined
 * here as the equivalent sRGB hex.
 *
 * This card sat outside `[locale]` and went stale twice over: it still carried
 * the pre-pivot teal, the general-3D pitch, and the invented "1.9M+ assets /
 * 200,000+ designers" figures that were removed from every page months ago.
 * A share card is the first thing a prospect sees when the client sends a
 * link, so it now says only what the site says.
 */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const INK = "#101924";
/** --brand, champagne gold. */
const BRAND = "#d4b275";
const WHITE = "#ffffff";
const MUTED = "#93a4b8";

type Copy = {
  alt: string;
  /**
   * Explicit lines, not one string. Reordering happens before satori wraps, so
   * a wrapped RTL headline came out with its lines in the wrong order — the
   * tail of the sentence on top. Breaking it here keeps the reordering and the
   * wrapping from fighting.
   */
  tagline: string[];
  blurb: string;
  stats: string[];
};

/**
 * Card copy per locale. Deliberately not read from the message catalogs: those
 * are loaded through next-intl's request context, which an image route does
 * not have. Kept short here rather than plumbing a second loader in.
 */
const COPY: Record<Locale, Copy> = {
  en: {
    alt: `${SITE.name} | Jewellery 3D models, cast-ready`,
    tagline: ["40,000 jewellery models,", "cast-ready"],
    blurb: "Rings, pendants and settings modelled in-house. Buy, sell, or commission a piece.",
    stats: ["Cast-ready", "In-house modelers", "₪55 / month for 2 models"],
  },
  he: {
    alt: `${SITE.name} | מודלים של תכשיטים, מוכנים ליציקה`,
    tagline: ["40,000 מודלים של תכשיטים,", "מוכנים ליציקה"],
    blurb: "טבעות, תליונים ומשבצות שעוצבו אצלנו. לקנות, למכור או להזמין פריט.",
    stats: ["מוכן ליציקה", "מעצבים בבית", "55 ₪ לחודש ל־2 מודלים"],
  },
};

export function ogAlt(locale: Locale) {
  return COPY[locale].alt;
}

export function BrandFrame({ locale }: { locale: Locale }) {
  const rtl = locale === "he";
  const source = COPY[locale];
  // Hebrew is reordered into visual order once, here, so every string below
  // renders correctly without each call site remembering to do it.
  const copy: Copy = rtl
    ? {
        ...source,
        tagline: source.tagline.map(toVisualRtl),
        blurb: toVisualRtl(source.blurb),
        stats: source.stats.map(toVisualRtl),
      }
    : source;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        // satori has no logical properties and does not run the bidi
        // algorithm; the text itself is reordered by toVisualRtl before it
        // gets here, and the blocks are aligned by hand.
        alignItems: rtl ? "flex-end" : "flex-start",
        textAlign: rtl ? "right" : "left",
        padding: 72,
        backgroundColor: INK,
        // Gold glow bleeding in from the top corner, over a faint grid.
        backgroundImage: `radial-gradient(circle at ${rtl ? "22%" : "78%"} 12%, rgba(212,178,117,0.26) 0%, rgba(212,178,117,0) 45%),
          linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 48px 48px, 48px 48px",
      }}
    >
      {/* Wordmark — the isometric cube from the site header, scaled up. The
          mark itself is never mirrored; only its position follows direction. */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <svg width={72} height={72} viewBox="0 0 32 32" fill="none">
          <path
            d="M16 2.5 29 10v12L16 29.5 3 22V10L16 2.5Z"
            fill={WHITE}
            opacity={0.14}
          />
          <path d="M16 2.5 29 10 16 17.5 3 10 16 2.5Z" fill={BRAND} />
          <path d="M3 10v12l13 7.5V17.5L3 10Z" fill={WHITE} opacity={0.75} />
          <path d="M29 10v12l-13 7.5V17.5L29 10Z" fill={WHITE} opacity={0.45} />
        </svg>
        <div
          style={{
            display: "flex",
            marginLeft: 20,
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: -1.5,
            color: WHITE,
          }}
        >
          <span>MODEL</span>
          <span style={{ color: BRAND }}>TREE</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: rtl ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: rtl ? "flex-end" : "flex-start",
            fontSize: 72,
            fontWeight: 700,
            // Hebrew sits tighter without negative tracking.
            letterSpacing: rtl ? 0 : -2.5,
            lineHeight: 1.08,
            color: WHITE,
            maxWidth: 1000,
          }}
        >
          {copy.tagline.map((line) => (
            <div key={line} style={{ display: "flex" }}>
              {line}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 30,
            lineHeight: 1.35,
            color: MUTED,
            maxWidth: 880,
          }}
        >
          {copy.blurb}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: rtl ? "row-reverse" : "row" }}>
        {copy.stats.map((stat) => (
          <div
            key={stat}
            style={{
              display: "flex",
              marginRight: rtl ? 0 : 16,
              marginLeft: rtl ? 16 : 0,
              paddingLeft: 26,
              paddingRight: 26,
              paddingTop: 12,
              paddingBottom: 12,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.16)",
              backgroundColor: "rgba(255,255,255,0.05)",
              fontSize: 25,
              color: WHITE,
            }}
          >
            {stat}
          </div>
        ))}
      </div>
    </div>
  );
}
