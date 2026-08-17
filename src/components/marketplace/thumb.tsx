import Image from "next/image"

import { cn } from "@/lib/utils"
import { tempPreview } from "@/lib/temp-previews"

/**
 * Cover artwork for catalog imagery.
 *
 * A caller passes `src` when there is a real preview for the thing being shown.
 * Everything else falls back to one of the stand-in ring renders, picked
 * deterministically from the seed so a given tile keeps the same image across
 * renders and navigations.
 *
 * This replaced a generated isometric SVG — a stage, a grid floor and stacked
 * blocks in a seeded palette. It was a reasonable placeholder for a general 3D
 * marketplace, but on a jewellery catalog it read as filler and looked nothing
 * like the product. A photograph of the wrong ring communicates more than an
 * abstract cube of the right hue.
 *
 * Temporary either way: when the R2 pipeline lands, real per-model previews
 * arrive through `src`, and the fallback becomes a branded SVG rather than a
 * borrowed photograph.
 */
type ThumbProps = {
  /** Stable string; decides which stand-in image this tile gets. */
  seed: string
  className?: string
  /** Real preview when one exists. */
  src?: string
  /**
   * Empty by default: cards title their own link, so the cover is decorative
   * and announcing it would only duplicate that label for screen readers.
   */
  alt?: string
  /** Rendered width across breakpoints, so Next picks a sane srcset entry. */
  sizes?: string
  /**
   * Applied to the image rather than the frame. A hover zoom belongs here: put
   * it on the frame and the frame itself grows, and since the transform is
   * visual only, the extra 4% spills over whatever sits below the cover instead
   * of being clipped.
   */
  imageClassName?: string
  children?: React.ReactNode
}

export function Thumb({
  seed,
  className,
  src,
  alt = "",
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  imageClassName,
  children,
}: ThumbProps) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <Image
        src={src ?? tempPreview(seed)}
        alt={alt}
        fill
        sizes={sizes}
        className={cn("object-cover", imageClassName)}
      />
      {children}
    </div>
  )
}
