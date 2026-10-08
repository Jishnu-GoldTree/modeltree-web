import { getTranslations } from "next-intl/server"
import { ArrowRight, Flame, Printer } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { getProductionCounts } from "@/lib/data/home"
import { Thumb } from "@/components/marketplace/thumb"

/**
 * The second question a jeweller asks after "what piece": "will it work in my
 * workflow". Two doors, one per production method, each with its live count.
 */
export async function ProductionSplit() {
  const t = await getTranslations("home.production")
  const counts = await getProductionCounts()

  const doors = [
    { key: "cast", href: "/3d-models/cast-ready", Icon: Flame, image: "/videos/posters/ijewel-11.webp", count: counts.cast },
    { key: "print", href: "/3d-models/print-ready", Icon: Printer, image: "/videos/posters/ijewel-12.webp", count: counts.print },
  ] as const

  return (
    <section className="shell">
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{t("title")}</h2>
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{t("body")}</p>
      </div>

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {doors.map(({ key, href, Icon, image, count }) => (
          <li key={key}>
            <Link
              href={href}
              className="group grid h-full overflow-hidden rounded-2xl border bg-card transition-colors hover:border-brand sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
            >
              <Thumb
                seed={key}
                src={image}
                sizes="(min-width: 768px) 25vw, 100vw"
                className="aspect-16/10 bg-cream sm:aspect-auto sm:h-full"
                imageClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
              <div className="flex flex-col p-5 sm:p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-muted text-brand-accent">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{t(`${key}Title`)}</h3>
                <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{t(`${key}Body`)}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-brand-accent">
                  {t("cta")} · {t("count", { count })}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
