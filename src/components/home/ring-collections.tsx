import { getTranslations } from "next-intl/server"
import { ArrowRight, Diamond, Circle } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { getRingCollections } from "@/lib/data/home"
import { Thumb } from "@/components/marketplace/thumb"

/** Two featured ring collections, using their own images and live model counts. */
export async function RingCollections() {
  const t = await getTranslations("home.ringCollections")
  const collections = await getRingCollections()
  const doors = collections.map((category) => ({
    key: category.slug === "engagement-rings" ? "engagement" : "wedding",
    href: `/3d-models/${category.slug}`,
    Icon: category.slug === "engagement-rings" ? Diamond : Circle,
    image: category.image,
    count: category.count,
  }))

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
