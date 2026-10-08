import { getTranslations } from "next-intl/server"
import { Download, ReceiptText, Search } from "lucide-react"

const STEPS = [
  { key: "s1", Icon: Search },
  { key: "s2", Icon: ReceiptText },
  { key: "s3", Icon: Download },
] as const

/**
 * Buying a file is unfamiliar to a jeweller used to buying metal. Three steps,
 * each stating the one thing that worries a first-time buyer at that point:
 * will it fit, is payment safe, what exactly do I receive.
 */
export async function HowItWorks() {
  const t = await getTranslations("home.how")

  return (
    <section className="shell">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{t("title")}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("body")}</p>
      </div>

      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map(({ key, Icon }, i) => (
          <li key={key} className="relative rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-ink-foreground tabular-nums">
                {i + 1}
              </span>
              <Icon className="size-5 text-brand-accent" aria-hidden />
            </div>
            <h3 className="mt-5 font-semibold">{t(`${key}Title`)}</h3>
            <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{t(`${key}Body`)}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
