import { getTranslations } from "next-intl/server"

import { COMPANY, mailto } from "@/lib/data/company"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"

type Section = { heading: string; body: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "about" })
  return { title: t("metaTitle"), description: t("metaDescription") }
}

export default async function AboutPage() {
  const t = await getTranslations("about")
  const c = await getTranslations("contact")
  const sections = t.raw("sections") as Section[]

  const info: { label: string; value: string; href?: string }[] = [
    { label: c("labels.legalName"), value: COMPANY.legalName },
    { label: c("labels.country"), value: COMPANY.country },
    COMPANY.registrationNumber && {
      label: c("labels.registration"),
      value: COMPANY.registrationNumber,
    },
    COMPANY.address && { label: c("labels.address"), value: COMPANY.address },
    {
      label: c("labels.email"),
      value: COMPANY.email.support,
      href: mailto(COMPANY.email.support),
    },
  ].filter(Boolean) as { label: string; value: string; href?: string }[]

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="header-offset flex-1">
        <section className="border-b bg-ink text-ink-foreground">
          <div className="shell py-16 md:py-20">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-pretty text-white/70">
              {t("subtitle")}
            </p>
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
                  <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>

            <section className="mt-12 rounded-2xl border bg-muted/40 p-6 sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight">
                {t("businessTitle")}
              </h2>
              <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {info.map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {row.label}
                    </dt>
                    <dd className="mt-1 text-sm">
                      {row.href ? (
                        <a
                          href={row.href}
                          className="text-brand-accent hover:underline"
                        >
                          {row.value}
                        </a>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
