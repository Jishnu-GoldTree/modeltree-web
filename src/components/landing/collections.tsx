import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { useTranslations } from "next-intl"

import { COLLECTIONS } from "@/lib/data/landing"
import { Thumb } from "@/components/marketplace/thumb"
import { Button } from "@/components/ui/button"

export function Collections() {
  const t = useTranslations("landing.collections")

  return (
    <section className="bg-muted/40 section-band">
      <div className="shell grid gap-6 lg:grid-cols-2">
        {COLLECTIONS.map((collection) => (
          <article
            key={collection.slug}
            className="flex flex-col rounded-2xl border bg-card p-6"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-balance">
                  {t(`${collection.key}Kicker`)}
                </h2>
                <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
                  {t(`${collection.key}Blurb`)}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link href={`/3d-models/${collection.slug}`}>
                  {t("viewAll")}
                  <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
                </Link>
              </Button>
            </header>

            <Link
              href={`/3d-models/${collection.slug}`}
              className="group mt-5 flex flex-1 flex-col overflow-hidden rounded-xl border outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
            >
              <Thumb
                seed={collection.seed}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="aspect-16/7 shrink-0 transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="flex flex-1 flex-col bg-background p-5">
                <h3 className="font-medium">{t(`${collection.key}Title`)}</h3>
                <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">
                  {t(`${collection.key}Description`)}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-accent">
                  {t("cta")}
                  <ArrowRight
                    aria-hidden
                    className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100"
                  />
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
