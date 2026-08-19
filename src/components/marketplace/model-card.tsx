import { Link } from "@/i18n/navigation"

import { cn } from "@/lib/utils"
import { UserText } from "@/components/user-text"
import { FavoriteButton } from "@/components/marketplace/favorite-button"
import type { ModelCard as ModelCardData } from "@/lib/data/landing"

import { Thumb } from "@/components/marketplace/thumb"

const MAX_VISIBLE_FORMATS = 3

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
  const visibleFormats = model.formats.slice(0, MAX_VISIBLE_FORMATS)
  const overflow = model.formats.length - visibleFormats.length

  return (
    <article
      className={cn(
        // self-start so the card sizes to its content instead of stretching to
        // the tallest card in the grid row, which would leave a gap under short
        // titles.
        //
        // transform-gpu promotes the card to its own layer so this rounded
        // overflow-hidden actually clips the cover's group-hover scale; without
        // it WebKit lets the zoomed image spill past the rounded bottom border.
        "group relative flex flex-col self-start transform-gpu overflow-hidden rounded-xl border bg-card transition-colors hover:border-brand",
        className
      )}
    >
      <Thumb
        seed={model.seed}
        src={model.cover}
        sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        className="aspect-4/3 shrink-0"
        imageClassName="transform-gpu transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.04]"
      >
        {model.formats.length > 0 && (
          <ul className="absolute top-2.5 start-2.5 flex flex-wrap gap-1">
            {visibleFormats.map((format) => (
              <li
                key={format}
                className="rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-white uppercase backdrop-blur"
              >
                {format}
              </li>
            ))}
            {overflow > 0 && (
              <li className="rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-white backdrop-blur">
                +{overflow}
              </li>
            )}
          </ul>
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

      <div className="p-3">
        <h3 className="text-sm leading-snug font-medium">
          {/* Stretched link keeps the whole card clickable without nesting
              interactive elements inside an anchor.

              Singular `/3d-model/`: `/3d-models/[segment]` serves categories
              and collections, so detail needs its own segment to stay
              unambiguous — a model slugged "car" would otherwise collide with
              the Car category. */}
          <Link
            href={`/3d-model/${model.slug}`}
            title={model.title}
            className="after:absolute after:inset-0 after:content-['']"
          >
            <UserText className="line-clamp-2">{model.title}</UserText>
          </Link>
        </h3>
      </div>
    </article>
  )
}
