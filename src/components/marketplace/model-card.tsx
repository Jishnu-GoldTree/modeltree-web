import Link from "next/link"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { UserText } from "@/components/user-text"
import { FavoriteButton } from "@/components/marketplace/favorite-button"
import type { ModelCard as ModelCardData } from "@/lib/data/landing"
import { useLocale, useTranslations } from "next-intl"

import { formatPrice } from "@/lib/money"
import type { Locale } from "@/i18n/routing"

import { Thumb } from "@/components/marketplace/thumb"
import { tempPreview } from "@/lib/temp-previews"
import { Badge } from "@/components/ui/badge"



export function ModelCard({
  model,
  className,
  favorited = false,
}: {
  model: ModelCardData
  className?: string
  /**
   * Whether this model is saved. Passed in rather than read here: the card
   * renders on statically prerendered pages, and reading the cookie would make
   * them all dynamic. Pages that already render dynamically pass the real
   * value; the rest show an unsaved heart that still saves on click.
   */
  favorited?: boolean
}) {
  const t = useTranslations("common")
  const locale = useLocale() as Locale
  const agorot = model.price === "free" ? 0 : Math.round(model.price * 100)
  const price = formatPrice(agorot, locale, { freeLabel: t("badgeFree") })

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md",
        className
      )}
    >
      <Thumb
        seed={model.seed}
        src={model.cover ?? tempPreview(model.slug)}
        sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        className="aspect-4/3 shrink-0 transition-transform duration-300 group-hover:scale-[1.04]"
      >
        {model.badge && (
          <Badge className="absolute top-2.5 start-2.5 border-0 bg-black/55 text-white backdrop-blur">
            {t(model.badge, { count: 147 })}
          </Badge>
        )}
      </Thumb>

      {/* Outside <Thumb>, deliberately. Thumb picks up group-hover:scale, and a
          transform creates a stacking context — with the heart inside it, its
          z-10 only ranked among Thumb's own children, so the stretched link's
          ::after (later in the DOM, on the card itself) painted over it. The
          heart was unclickable with a real pointer: hovering to reach it was
          what put the overlay on top, so the click navigated to the model
          instead of saving it. As a child of the card it outranks the overlay. */}
      <FavoriteButton slug={model.slug} title={model.title} favorited={favorited} />

      <div className="flex flex-1 flex-col p-3">
        {/* Two lines are reserved for the title so prices and format chips
            line up across the grid regardless of title length. */}
        <h3 className="min-h-10 text-sm leading-snug font-medium">
          {/* Stretched link keeps the whole card clickable without nesting
              interactive elements inside an anchor.

              Singular `/3d-model/`: `/3d-models/[segment]` serves categories
              and collections, so detail needs its own segment to stay
              unambiguous — a model slugged "car" would otherwise collide with
              the Car category. */}
          <Link
            href={`/3d-model/${model.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            <UserText className="line-clamp-2">{model.title}</UserText>
          </Link>
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          {t("by")} <UserText>{model.author}</UserText>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <span
            className={cn(
              "text-sm font-semibold",
              model.price === "free" && "text-brand-accent"
            )}
          >
            {price.primary}
            {price.secondary && (
              // Shekels are what gets charged; the dollar figure is guidance.
              <span className="ms-1.5 text-xs font-normal text-muted-foreground">
                ≈{price.secondary}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
            {model.rating}
            <span className="sr-only">{t("outOf5From")}</span>({model.reviews})
          </span>
        </div>

        <ul className="mt-2.5 flex flex-wrap gap-1">
          {model.formats.map((format) => (
            <li
              key={format}
              className="rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
            >
              {format}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
