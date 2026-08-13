import { formatStat, getMarketplaceStats } from "@/lib/data/stats"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Check, Coins, Globe, Upload } from "lucide-react"

import { getCurrentUser } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Thumb } from "@/components/marketplace/thumb"
import { Button } from "@/components/ui/button"

/**
 * Illustrative only. The commission rate has NOT been agreed with the client —
 * it is a single constant here, and the same figure is hardcoded in
 * scripts/seed-orders.mjs, so both move together when the rate is settled.
 */
const EXAMPLE_SALE = 100
const COMMISSION_RATE = 0.2

export const metadata = {
  title: "Sell your 3D models",
  description:
    "Publish your 3D models on ModelTree. No listing fees, no subscription — you pay a commission only when a model sells.",
}


const TERMS = [
  "No listing fees and no subscription — you pay a commission only when a model sells",
  "Keep publishing elsewhere; nothing here is exclusive",
  "Set your own price, or give a model away to build an audience",
  "Withdraw once your balance passes $50",
]

export default async function SellPage() {
  const t = await getTranslations("sell")
  const [user, stats] = await Promise.all([getCurrentUser(), getMarketplaceStats()])

  const steps = [
    { Icon: Upload, title: t("step1Title"), body: t("step1Body") },
    { Icon: Globe, title: t("step2Title"), body: t("step2Body") },
    { Icon: Coins, title: t("step3Title"), body: t("step3Body") },
  ]

  return (
    <>
      <SiteHeader solid />

      <main className="flex-1 pt-16">
        <section className="relative overflow-hidden border-b bg-ink">
          <Thumb seed="sell-hero" className="absolute inset-0 opacity-30 blur-[1px]" />
          <div className="shell relative py-16 md:py-24">
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-xl text-white/70">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-11 bg-brand px-6 text-brand-foreground hover:bg-brand/85">
                {/* Sends you where you can actually act: the upload form if you
                    already have an account, signup if you don't. */}
                <Link href={user ? "/dashboard/upload" : "/signup"}>
                  {user ? t("uploadModel") : t("startSelling")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 border-white/25 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/3d-models">{t("seeWhatSells")}</Link>
              </Button>
            </div>

            <dl className="mt-12 flex flex-wrap gap-x-12 gap-y-6">
              {[
                { value: formatStat(stats.models), label: t("modelsStat") },
                { value: formatStat(stats.designers), label: t("designersStat") },
                { value: "$0", label: t("listStat") },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-3xl font-semibold tracking-tight text-white">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-sm text-white/60">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="shell py-16">
          <h2 className="text-xl font-semibold tracking-tight">{t("howItWorks")}</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-xl border p-6">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-muted text-brand-accent">
                  <step.Icon className="size-4" aria-hidden />
                </span>
                <h3 className="mt-4 font-medium">
                  <span className="text-muted-foreground tabular-nums">{i + 1}. </span>
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t bg-muted/30 py-16">
          <div className="shell grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{t("termsTitle")}</h2>
              <ul className="mt-6 flex flex-col gap-3">
                {TERMS.map((term) => (
                  <li key={term} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-accent" aria-hidden />
                    {term}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-background p-6">
              <h3 className="font-medium">{t("saleTitle")}</h3>
              <dl className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("buyerPays")}</dt>
                  <dd className="tabular-nums">${EXAMPLE_SALE}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("commission")}</dt>
                  <dd className="tabular-nums">
                    −${Math.round(EXAMPLE_SALE * COMMISSION_RATE)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t pt-2 font-medium">
                  <dt>{t("youReceive")}</dt>
                  <dd className="tabular-nums">
                    ${Math.round(EXAMPLE_SALE * (1 - COMMISSION_RATE))}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                {t("payoutNote")}
              </p>
              <Button asChild className="mt-6 h-10 w-full bg-brand text-brand-foreground hover:bg-brand/85">
                <Link href={user ? "/dashboard/upload" : "/signup"}>
                  {user ? t("uploadModel") : t("createDesigner")}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
