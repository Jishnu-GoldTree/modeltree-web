import { BadgeCheck, Layers, Tag } from "lucide-react"

import { useTranslations } from "next-intl"

import { SITE, VALUE_PROPS } from "@/lib/data/landing"

const ICONS = {
  layers: Layers,
  tag: Tag,
  "badge-check": BadgeCheck,
} as const

export function ValueProps() {
  const t = useTranslations("landing.valueProps")

  return (
    <section className="bg-muted/40 section-band">
      <div className="shell">
        <h2 className="text-center text-xl font-semibold tracking-tight text-balance sm:text-2xl">
          {t("title", { name: SITE.name })}
        </h2>

        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {VALUE_PROPS.map((prop) => {
            const Icon = ICONS[prop.icon]
            return (
              <li
                key={prop.key}
                className="rounded-2xl border bg-card p-6 sm:p-7"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand/15 text-brand-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold tracking-tight text-balance">
                  {t(`${prop.key}Title`)}
                </h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {t(`${prop.key}Body`)}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
