import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import {
  ArrowRight,
  Check,
  Info,
  MessagesSquare,
  PencilRuler,
  Ruler,
  Sparkles,
} from "lucide-react"

import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"

export async function generateMetadata({ params }: PageProps<"/[locale]/custom-work">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "custom" })
  return { title: t("metaTitle"), description: t("metaDescription") }
}

/**
 * The modelling service.
 *
 * Two request types sit side by side because the client's point is that they
 * are different products at different prices: editing a model you already own
 * (a ring resize) should cost a fraction of commissioning one from scratch, and
 * a buyer needs to see that before they ask.
 *
 * The chat itself is not built. The page says so plainly rather than shipping a
 * button that opens nothing — a dead "start chat" control would cost more trust
 * than the missing feature does.
 */
export default async function CustomWorkPage() {
  const t = await getTranslations("custom")

  const tracks = [
    {
      key: "adjust",
      Icon: Ruler,
      href: "/requests/new?kind=adjustment",
      examples: ["adjustE1", "adjustE2", "adjustE3", "adjustE4"],
    },
    {
      key: "new",
      Icon: PencilRuler,
      href: "/requests/new?kind=commission",
      examples: ["newE1", "newE2", "newE3", "newE4"],
    },
  ] as const

  const steps = [1, 2, 3] as const

  return (
    <>
      <SiteHeader solid />

      <main id="main-content" className="flex-1 pt-16">
        <section className="border-b bg-ink text-ink-foreground">
          <div className="shell py-16 md:py-20">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand">
              <MessagesSquare className="size-3.5" aria-hidden />
              {t("eyebrow")}
            </span>
            <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-pretty text-white/70 sm:text-base">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                className="h-11 bg-brand px-6 text-brand-foreground hover:bg-brand/85"
              >
                <Link href="/requests/new">{t("primaryCta")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 border-white/25 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/pricing">{t("secondaryCta")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="shell py-14 sm:py-16">
          <ul className="grid gap-5 lg:grid-cols-2">
            {tracks.map((track) => (
              <li
                key={track.key}
                className="flex flex-col rounded-2xl border bg-card p-6 sm:p-7"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand/15 text-brand-accent">
                    <track.Icon className="size-5" aria-hidden />
                  </span>
                  <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {t(`${track.key}Eyebrow`)}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-semibold tracking-tight text-balance">
                  {t(`${track.key}Title`)}
                </h2>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {t(`${track.key}Body`)}
                </p>

                <p className="mt-4 inline-flex w-fit rounded-lg bg-brand-muted px-3 py-1.5 text-sm font-medium text-brand-accent">
                  {t(`${track.key}Price`)}
                </p>

                <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                  {track.examples.map((example) => (
                    <li key={example} className="flex gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand-accent" aria-hidden />
                      <span className="text-pretty">{t(example)}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild variant="outline" className="mt-6 h-11">
                  <Link href={track.href}>
                    {t(`${track.key}Cta`)}
                    <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>

          <section className="mt-14">
            <h2 className="text-lg font-semibold tracking-tight">{t("howTitle")}</h2>
            <ol className="mt-6 grid gap-5 md:grid-cols-3">
              {steps.map((n) => (
                <li key={n} className="rounded-xl border p-5">
                  <span
                    aria-hidden
                    className="inline-flex size-8 items-center justify-center rounded-lg border bg-muted/40 font-mono text-sm text-muted-foreground"
                  >
                    {n}
                  </span>
                  <p className="mt-3 font-medium">{t(`how${n}Title`)}</p>
                  <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
                    {t(`how${n}Body`)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12 flex flex-col gap-5 rounded-2xl border border-brand bg-brand-muted p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-xl">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Sparkles className="size-4 text-brand-accent" aria-hidden />
                {t("memberTitle")}
              </h2>
              <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
                {t("memberBody")}
              </p>
            </div>
            <Button
              asChild
              className="h-11 shrink-0 bg-brand px-6 text-brand-foreground hover:bg-brand/85"
            >
              <Link href="/pricing">{t("memberCta")}</Link>
            </Button>
          </section>

          <p className="mt-8 flex items-start gap-2.5 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <strong className="font-medium text-foreground">{t("howItWorksTitle")}</strong>{" "}
              {t("howItWorksBody")}
            </span>
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
