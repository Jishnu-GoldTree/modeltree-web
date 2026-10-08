import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type { HomeCategory } from "@/lib/data/home"
import { SectionHeading } from "@/components/home/section-heading"
import { Thumb } from "@/components/marketplace/thumb"

/**
 * Image-led category entry, the way a jeweller's storefront opens its range:
 * the busiest category takes the large tile, the rest fill the grid beside it.
 * The label sits in its own row under the render rather than on a gradient
 * over it — the renders are on white, and any scrim on white reads as grime.
 * Only categories with published models appear (see `getHomeCategories`), each
 * with its live count, so no tile leads to an empty page.
 */
export async function ShopByCategory({ categories }: { categories: HomeCategory[] }) {
  if (categories.length === 0) return null
  const t = await getTranslations("home.categories")
  const labels = await getTranslations("landing.categories")

  return (
    <section className="shell">
      <SectionHeading
        title={t("title")}
        description={t("body")}
        action={{ label: t("all"), href: "/3d-models" }}
      />

      <ul
        className={cn(
          "mt-6 grid gap-3 sm:gap-4",
          categories.length >= 5
            ? "grid-cols-2 md:grid-cols-4 md:grid-rows-2"
            : categories.length === 4
              ? "grid-cols-2 md:grid-cols-4"
              : categories.length === 3
                ? "grid-cols-2 md:grid-cols-3"
                : "grid-cols-2",
        )}
      >
        {categories.map((c, i) => {
          const lead = i === 0 && categories.length >= 5
          // On the two-column phone grid an odd count leaves a hole; the first
          // tile takes the full row instead.
          const fullOnPhone = i === 0 && categories.length % 2 === 1
          return (
            <li
              key={c.slug}
              className={cn(
                lead && "col-span-2 md:row-span-2",
                !lead && fullOnPhone && "col-span-2 md:col-span-1",
              )}
            >
              <Link
                href={`/3d-models/${c.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-brand"
              >
                <Thumb
                  seed={c.slug}
                  src={c.image}
                  sizes={lead ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                  className={cn("w-full bg-white", lead ? "aspect-4/3 md:aspect-auto md:flex-1" : "aspect-4/3")}
                  imageClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
                <div className="flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-5 sm:py-4">
                  <div className="min-w-0">
                    <p className={cn("truncate leading-tight font-semibold", lead ? "text-lg sm:text-xl" : "text-sm sm:text-base")}>
                      {labels(c.slug)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{t("count", { count: c.count })}</p>
                  </div>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-brand-foreground">
                    <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
