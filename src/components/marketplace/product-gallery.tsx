"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Product image slider.
 *
 * Temporary content (see lib/temp-previews), but the shape is the real one:
 * a lead image with a thumbnail strip, so swapping in per-model previews later
 * is a prop change rather than a rewrite.
 */
export function ProductGallery({
  images,
  title,
}: {
  images: readonly string[]
  title: string
}) {
  const t = useTranslations("common")
  const [active, setActive] = useState(0)

  return (
    <div>
      <div className="relative aspect-16/10 w-full overflow-hidden rounded-xl border bg-ink">
        <Image
          src={images[active]}
          alt={title}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={t("viewImage", { n: i + 1, total: images.length })}
                aria-pressed={i === active}
                className={cn(
                  "relative block aspect-4/3 w-full overflow-hidden rounded-lg border bg-ink outline-none transition-colors",
                  "focus-visible:ring-3 focus-visible:ring-brand/50",
                  i === active ? "border-brand" : "hover:border-muted-foreground/40",
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="20vw"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
