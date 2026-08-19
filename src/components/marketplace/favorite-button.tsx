"use client"

import { useRef } from "react"
import { Heart } from "lucide-react"

import { cn } from "@/lib/utils"
import { toggleFavorite } from "@/lib/actions/favorites"

/**
 * The heart on a model card.
 *
 * A real <form> posting to a server action, so saving works with JavaScript
 * disabled. It sends the current URL so the action can redirect back: hearting
 * causes no navigation of its own, and the header's count lives in a client
 * cache that only refreshes when the route changes — without this the badge
 * sits stale until the visitor happens to move elsewhere.
 *
 * The URL is read from `window.location` at submit time rather than with
 * `useSearchParams`, because that hook opts a page out of static rendering, and
 * this component appears on all 144 prerendered model pages. Without JS the
 * field stays empty and the action falls back to /favorites, which is a fine
 * place to land.
 */
export function FavoriteButton({
  slug,
  title,
  favorited,
}: {
  slug: string
  title: string
  favorited: boolean
}) {
  const returnTo = useRef<HTMLInputElement>(null)

  return (
    <form
      action={toggleFavorite}
      onSubmit={() => {
        if (returnTo.current) {
          returnTo.current.value = window.location.pathname + window.location.search
        }
      }}
      className={cn(
        // z-20 to stay clear of the card's stretched-link overlay.
        "absolute top-2 end-2 z-20 transition-opacity",
        favorited
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
      )}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="returnTo" ref={returnTo} defaultValue="" />
      <button
        type="submit"
        aria-label={favorited ? `Remove ${title} from saved` : `Save ${title}`}
        aria-pressed={favorited}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full outline-none backdrop-blur focus-visible:ring-3 focus-visible:ring-brand/50",
          // Saved: the whole chip goes brand red with a white heart (5.26:1),
          // rather than a red heart on the translucent grey chip, which sat
          // near 1.5:1. Unsaved keeps the dark chip with a white outline heart.
          favorited
            ? "bg-brand text-brand-foreground hover:bg-brand/90"
            : "bg-black/45 text-white hover:bg-black/65",
        )}
      >
        <Heart
          className={cn("size-4", favorited && "fill-current")}
          aria-hidden
        />
      </button>
    </form>
  )
}
