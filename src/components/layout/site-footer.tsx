import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { cacheLife } from "next/cache"

import { FOOTER_COLUMNS } from "@/lib/data/landing"
import { Logo } from "@/components/layout/logo"
import { Separator } from "@/components/ui/separator"

/**
 * Cached, because of the copyright year.
 *
 * `new Date()` is non-deterministic, and Cache Components refuses to bake one
 * into a prerendered shell — reasonably, since the shell can outlive the value.
 * The footer renders on every page, so left alone it would have blocked the
 * whole site from prerendering. Caching it is the honest resolution: everyone
 * sees the same year, and it is re-derived daily rather than per request. The
 * rest of the footer is translated constants, which is exactly what a cached
 * component should hold.
 */
export async function SiteFooter() {
  "use cache"
  cacheLife("days")

  const t = await getTranslations("footer")
  const f = await getTranslations("landing.footer")

  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="shell pt-14 pb-10">
        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-white/60">
              {t("tagline")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.key} aria-labelledby={`footer-${column.key}`}>
                <h2
                  id={`footer-${column.key}`}
                  className="text-xs font-semibold tracking-wide text-white/45 uppercase"
                >
                  {f(column.key)}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.key}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/70 transition-colors hover:text-white"
                      >
                        {f(link.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <Separator className="my-10 bg-white/10" />

        <div className="flex flex-col gap-4 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t("rights", { year: new Date().getFullYear() })}
          </p>
          <p>{t("payments")}</p>
        </div>
      </div>

      <FooterWatermark />
    </footer>
  )
}

/**
 * The brand signed across the foot of every page: the solitaire mark and the
 * wordmark, edge to edge of the content column, in a tint barely above the ink.
 *
 * SVG rather than text sized in vw: `textLength` stretches the wordmark to an
 * exact width, so it lines up with the column at every breakpoint and in
 * either direction. `dir="ltr"` keeps it reading MODELTREE on Hebrew pages.
 * The bottom is clipped a little, as if the word runs off the page.
 *
 * One footer per page, so the gradient id can be a constant.
 */
function FooterWatermark() {
  return (
    <div aria-hidden dir="ltr" className="pointer-events-none overflow-hidden select-none">
      <div className="shell">
        <svg viewBox="0 0 1200 170" className="-mb-[3%] block h-auto w-full" fill="none">
          <defs>
            <linearGradient id="footer-watermark-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.12" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* The logo glyph's paths, scaled from its 24-unit box. */}
          <g transform="translate(0 8) scale(6.6)" stroke="url(#footer-watermark-fade)" strokeLinejoin="round">
            <path d="M4 9.5 12 3l8 6.5-8 12-8-12Z" strokeWidth="1.6" />
            <path d="M4 9.5h16M12 3 8.5 9.5 12 21.5 15.5 9.5 12 3Z" strokeWidth="1.2" />
          </g>
          <text
            x="178"
            y="150"
            textLength="1022"
            lengthAdjust="spacingAndGlyphs"
            fill="url(#footer-watermark-fade)"
            className="font-sans"
            style={{ fontSize: 186, fontWeight: 600, letterSpacing: "-0.02em" }}
          >
            MODELTREE
          </text>
        </svg>
      </div>
    </div>
  )
}
