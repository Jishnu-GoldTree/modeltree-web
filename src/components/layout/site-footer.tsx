import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { cacheLife } from "next/cache"

import { FOOTER_COLUMNS } from "@/lib/data/landing"
import { Logo } from "@/components/layout/logo"
import { NewsletterForm } from "@/components/forms/newsletter-form"
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
      <div className="shell py-14">
        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-white/60">
              {t("tagline")}
            </p>
            <div className="mt-6">
              <p className="text-sm font-medium">{t("newsletter")}</p>
              <p className="mt-1 mb-3 text-sm text-white/55">
                {t("newsletterHint")}
              </p>
              <NewsletterForm />
            </div>
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
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { key: "terms", href: "/terms" },
              { key: "privacy", href: "/privacy" },
              { key: "cookies", href: "/cookies" },
              { key: "licensingLink", href: "/licensing" },
            ].map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="transition-colors hover:text-white">
                  {f(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
