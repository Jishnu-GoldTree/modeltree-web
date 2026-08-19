import { getLocale, getTranslations } from "next-intl/server"

import type { Locale } from "@/i18n/routing"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"

type Section = { heading: string; body: string | string[] }

/**
 * Shared shell for the flat legal documents (terms, privacy). Each page passes
 * its own message namespace and effective date; the copy — title, intro and the
 * ordered `sections` array — lives in the translation catalogs so both locales
 * stay in sync.
 */
export async function LegalDocument({
  namespace,
  effectiveDate,
}: {
  namespace: "terms" | "privacy"
  /** ISO date (YYYY-MM-DD) the document last changed. */
  effectiveDate: string
}) {
  const t = await getTranslations(namespace)
  const locale = (await getLocale()) as Locale
  const sections = t.raw("sections") as Section[]

  const date = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    dateStyle: "long",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(effectiveDate))

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="flex-1 pt-26">
        <section className="border-b bg-ink text-ink-foreground">
          <div className="shell py-16 md:py-20">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-4 text-sm text-white/60">{t("updated", { date })}</p>
          </div>
        </section>

        <div className="shell py-14 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-base leading-relaxed text-pretty text-muted-foreground">
              {t("intro")}
            </p>

            <div className="mt-10 flex flex-col gap-10">
              {sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {section.heading}
                  </h2>
                  {(Array.isArray(section.body) ? section.body : [section.body]).map(
                    (paragraph, i) => (
                      <p
                        key={i}
                        className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ),
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
