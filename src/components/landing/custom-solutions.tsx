import { Link } from "@/i18n/navigation"
import { Check, Wand2 } from "lucide-react"

import { useTranslations } from "next-intl"

import { CUSTOM_SOLUTIONS } from "@/lib/data/landing"
import { Button } from "@/components/ui/button"

export function CustomSolutions() {
  const t = useTranslations("landing.custom")

  return (
    <section className="bg-ink text-ink-foreground section-band">
      <div className="shell">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            <Wand2 className="size-3.5" aria-hidden />
            {t("badge")}
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-3 max-w-xl text-sm text-pretty text-white/65">
            {t("body")}
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {CUSTOM_SOLUTIONS.map((solution) => (
            <article
              key={solution.key}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:p-7"
            >
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {t(`${solution.key}Name`)}
                  </h3>
                  <p className="mt-0.5 text-sm text-white/60">
                    {t(`${solution.key}Subtitle`)}
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-brand text-brand-foreground hover:bg-brand/85"
                >
                  <Link href="/custom-work">
                    {t(`${solution.key}Cta`)}
                  </Link>
                </Button>
              </header>

              <ol className="mt-6 space-y-4">
                {solution.steps.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 font-mono text-xs text-white/70"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{t(`${solution.key}Step${step}Title`)}</p>
                      <p className="mt-1 text-sm text-white/60">{t(`${solution.key}Step${step}Body`)}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs font-semibold tracking-wide text-white/45 uppercase">
                  {t("why", { name: t(`${solution.key}Name`) })}
                </p>
                <ul className="mt-3 space-y-2">
                  {solution.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-2.5 text-sm text-white/75">
                      <Check
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 text-brand"
                      />
                      {t(`${solution.key}Benefit${benefit}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
