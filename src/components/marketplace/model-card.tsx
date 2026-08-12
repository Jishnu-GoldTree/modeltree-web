import Link from "next/link"
import { Heart, Star } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ModelCard as ModelCardData } from "@/lib/data/landing"
import { Thumb } from "@/components/marketplace/thumb"
import { Badge } from "@/components/ui/badge"

function formatPrice(price: ModelCardData["price"]) {
  return price === "free" ? "Free" : `$${price}`
}

export function ModelCard({
  model,
  className,
}: {
  model: ModelCardData
  className?: string
}) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md",
        className
      )}
    >
      <Thumb
        seed={model.seed}
        src={model.cover}
        sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        className="aspect-4/3 shrink-0 transition-transform duration-300 group-hover:scale-[1.04]"
      >
        {model.badge && (
          <Badge className="absolute top-2.5 left-2.5 border-0 bg-black/55 text-white backdrop-blur">
            {model.badge}
          </Badge>
        )}
        <button
          type="button"
          aria-label={`Save ${model.title}`}
          className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Heart className="size-4" aria-hidden />
        </button>
      </Thumb>

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
            <span className="line-clamp-2">{model.title}</span>
          </Link>
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">by {model.author}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <span
            className={cn(
              "text-sm font-semibold",
              model.price === "free" && "text-brand-accent"
            )}
          >
            {formatPrice(model.price)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
            {model.rating}
            <span className="sr-only">out of 5 from</span>({model.reviews})
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
