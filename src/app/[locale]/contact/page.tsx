import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { LifeBuoy, Mail, MessagesSquare, Scale, ShieldCheck } from "lucide-react"

import { COMPANY, mailto } from "@/lib/data/company"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "contact" })
  return { title: t("metaTitle"), description: t("metaDescription") }
}

export default async function ContactPage() {
  const t = await getTranslations("contact")

  const channels = [
    {
      Icon: LifeBuoy,
      title: t("supportTitle"),
      body: t("supportBody"),
      email: COMPANY.email.support,
    },
    {
      Icon: Scale,
      title: t("legalTitle"),
      body: t("legalBody"),
      email: COMPANY.email.legal,
    },
    {
      Icon: ShieldCheck,
      title: t("privacyTitle"),
      body: t("privacyBody"),
      email: COMPANY.email.privacy,
    },
  ]

  const info: { label: string; value: string; href?: string }[] = [
    { label: t("labels.legalName"), value: COMPANY.legalName },
    { label: t("labels.country"), value: COMPANY.country },
    COMPANY.registrationNumber && {
      label: t("labels.registration"),
      value: COMPANY.registrationNumber,
    },
    COMPANY.address && { label: t("labels.address"), value: COMPANY.address },
    {
      label: t("labels.email"),
      value: COMPANY.email.support,
      href: mailto(COMPANY.email.support),
    },
  ].filter(Boolean) as { label: string; value: string; href?: string }[]

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="flex-1 pt-26">
        <section className="border-b bg-ink text-ink-foreground">
          <div className="shell py-16 md:py-20">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-pretty text-white/70">
              {t("intro")}
            </p>
          </div>
        </section>

        <div className="shell py-14 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-3">
              {channels.map((channel) => (
                <div
                  key={channel.email}
                  className="flex flex-col rounded-2xl border p-5"
                >
                  <channel.Icon
                    className="size-5 text-brand-accent"
                    aria-hidden
                  />
                  <h2 className="mt-3 font-semibold">{channel.title}</h2>
                  <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
                    {channel.body}
                  </p>
                  <a
                    href={mailto(channel.email)}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline"
                  >
                    <Mail className="size-4" aria-hidden />
                    {channel.email}
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col justify-between gap-4 rounded-2xl border bg-brand-muted p-6 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <MessagesSquare
                  className="mt-0.5 size-5 shrink-0 text-brand-accent"
                  aria-hidden
                />
                <div>
                  <h2 className="font-semibold">{t("whatsappTitle")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("whatsappBody")}
                  </p>
                </div>
              </div>
              <Link
                href="/custom-work"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/85"
              >
                {t("whatsappCta")}
              </Link>
            </div>

            <section className="mt-4 rounded-2xl border bg-muted/40 p-6 sm:p-8">
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
