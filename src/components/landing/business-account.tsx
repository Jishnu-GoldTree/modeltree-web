import { Link } from "@/i18n/navigation"
import { CreditCard, FileCheck, Users } from "lucide-react"

import { useTranslations } from "next-intl"

import { BUSINESS_PERKS, SITE } from "@/lib/data/landing"
import { Button } from "@/components/ui/button"

const ICONS = {
  users: Users,
  "credit-card": CreditCard,
  "file-check": FileCheck,
} as const

export function BusinessAccount() {
  const t = useTranslations("landing.business")

  return (
    <section>
      <div className="shell">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {t("title", { name: SITE.name })}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-pretty text-muted-foreground">
            {t("body")}
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/business">{t("cta")}</Link>
          </Button>
        </div>

        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {BUSINESS_PERKS.map((perk) => {
            const Icon = ICONS[perk.icon]
            return (
              <li key={perk.key} className="rounded-2xl border bg-card p-6">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand/15 text-brand-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold tracking-tight">
                  {t(`${perk.key}Title`)}
                </h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {t(`${perk.key}Body`)}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
