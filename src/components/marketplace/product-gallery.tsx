"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

/**
 * Product image slider.
 *
 * Native — no carousel library. Features:
 *   • Prev/next arrows overlaid on the main image, keyboard-navigable.
 *   • Draggable thumb strip (touch + mouse), auto-scrolls the active thumb
 *     into view when the main image changes.
 *   • Click the main image → fullscreen lightbox with the same nav.
 *   • Horizontal swipe on the main image → next/prev, in whichever direction
 *     matches the document's writing direction (LTR: swipe left = next,
 *     RTL: swipe right = next).
 *
 * `Image` from next/image everywhere so the R2 CDN URLs go through
 * optimisation and the browser gets a right-sized srcset.
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
  const [fullscreen, setFullscreen] = useState(false)
  const total = images.length

  const go = useCallback(
    (next: number) => setActive(((next % total) + total) % total),
    [total],
  )
  const prev = useCallback(() => go(active - 1), [go, active])
  const next = useCallback(() => go(active + 1), [go, active])

  // Swipe handler: horizontal drag > 50px on the main image triggers a step.
  // Direction is flipped in RTL so "swipe forward" always means next.
  const swipeStartX = useRef<number | null>(null)
  const swipeDx = useRef(0)
  const onSwipeStart = (x: number) => {
    swipeStartX.current = x
    swipeDx.current = 0
  }
  const onSwipeMove = (x: number) => {
    if (swipeStartX.current !== null) swipeDx.current = x - swipeStartX.current
  }
  const onSwipeEnd = () => {
    const dx = swipeDx.current
    swipeStartX.current = null
    swipeDx.current = 0
    if (Math.abs(dx) < 50) return
    const isRtl =
      typeof document !== "undefined" && document.documentElement.dir === "rtl"
    const forward = isRtl ? dx > 0 : dx < 0
    forward ? next() : prev()
  }

  // Keep the active thumbnail visible without yanking the strip around on
  // every render — scrollIntoView with `nearest` only scrolls when needed.
  const thumbsRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const child = thumbsRef.current?.children[active]
    if (child instanceof HTMLElement) {
      child.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" })
    }
  }, [active])

  // Arrow-key navigation in fullscreen. Outside fullscreen we don't bind
  // globally so we don't hijack keys the user might expect for the page.
  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [fullscreen, prev, next])

  const showNav = total > 1

  return (
    <div>
      {/* Main image */}
      <div
        className="group relative aspect-16/10 w-full overflow-hidden rounded-xl border bg-ink select-none"
        onTouchStart={(e) => onSwipeStart(e.touches[0].clientX)}
        onTouchMove={(e) => onSwipeMove(e.touches[0].clientX)}
        onTouchEnd={onSwipeEnd}
      >
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="block h-full w-full cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          aria-label={t("openFullscreen")}
        >
          <Image
            src={images[active]}
            alt={title}
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
            draggable={false}
          />
        </button>

        {/* Fullscreen hint — hover-only on desktop, always visible on touch
            (touch users don't hover, and the hint is small enough not to
            crowd the image on mobile). */}
        <div className="pointer-events-none absolute end-3 top-3 rounded-md bg-black/55 p-1.5 text-white/95 opacity-100 backdrop-blur-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <Maximize2 className="size-4" aria-hidden />
        </div>

        {showNav && (
          <>
            <ArrowButton
              side="start"
              onClick={prev}
              label={t("prevImage")}
              icon={<ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />}
            />
            <ArrowButton
              side="end"
              onClick={next}
              label={t("nextImage")}
              icon={<ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />}
            />

            {/* Counter — helps confirm which image you're on when there are
                many, and stays readable over any background. */}
            <div className="pointer-events-none absolute start-3 bottom-3 rounded-md bg-black/55 px-2 py-1 text-xs font-medium text-white tabular-nums backdrop-blur-sm">
              {active + 1} / {total}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip — native horizontal scroll (touch), scroll-wheel
          horizontal on desktop, plus mouse-drag scroll for parity with the
          swipe gesture. Snap so each thumb aligns to the start edge. */}
      {showNav && (
        <DraggableStrip>
          <ul
            ref={thumbsRef}
            // Padding on all four sides: `overflow-x-auto` forces
            // `overflow-y` to `auto` too (CSS spec), and the active thumb's
            // `ring-2` extends 2px outside the tile in every direction. The
            // first/last item's ring gets sliced along the container edges
            // without matching horizontal padding. `scroll-px-1` teaches
            // snap targets to respect the padding so scrolling still lands
            // items flush at each end.
            className="flex gap-2 overflow-x-auto scroll-smooth p-1 scroll-px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {images.map((src, i) => (
              <li key={src} className="shrink-0" style={{ scrollSnapAlign: "start" }}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={t("viewImage", { n: i + 1, total })}
                  aria-current={i === active}
                  className={cn(
                    // Jewellery photos are near-square with the piece
                    // centred; `object-contain` on a light backdrop shows
                    // the whole ring without slicing the top/bottom, which
                    // `object-cover` was doing on the 4/3 tile. No inner
                    // padding: `<Image fill>` absolute-positions over any
                    // padding, so it wouldn't create breathing room anyway.
                    "relative block aspect-4/3 w-20 overflow-hidden rounded-lg border bg-muted outline-none transition-all sm:w-24",
                    "focus-visible:ring-2 focus-visible:ring-brand/50",
                    i === active
                      ? "border-brand ring-2 ring-brand/40"
                      : "border-border opacity-70 hover:border-muted-foreground/40 hover:opacity-100",
                  )}
                >
                  <Image src={src} alt="" fill sizes="96px" className="object-contain" draggable={false} />
                </button>
              </li>
            ))}
          </ul>
        </DraggableStrip>
      )}

      {/* Fullscreen lightbox — hide the default Dialog X (we render our own
          bigger one) and let the content span the viewport. */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent
          showCloseButton={false}
          // DialogContent defaults include `sm:max-w-sm` — needs to be
          // overridden at the responsive bucket too, otherwise the dialog
          // caps at 24rem on desktop and the page shows through around it.
          className="h-svh w-screen max-w-none sm:max-w-none translate-x-0 translate-y-0 start-0 top-0 gap-0 rounded-none border-0 bg-black/95 p-0 ring-0"
        >
          <div
            className="relative flex h-full w-full items-center justify-center"
            onTouchStart={(e) => onSwipeStart(e.touches[0].clientX)}
            onTouchMove={(e) => onSwipeMove(e.touches[0].clientX)}
            onTouchEnd={onSwipeEnd}
          >
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="absolute end-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
              aria-label={t("closeFullscreen")}
            >
              <X className="size-5" aria-hidden />
            </button>

            <div className="relative h-full w-full">
              <Image
                src={images[active]}
                alt={title}
                fill
                sizes="100vw"
                priority
                className="object-contain"
                draggable={false}
              />
            </div>

            {showNav && (
              <>
                <ArrowButton
                  side="start"
                  size="lg"
                  onClick={prev}
                  label={t("prevImage")}
                  icon={<ChevronLeft className="size-6 rtl:-scale-x-100" aria-hidden />}
                />
                <ArrowButton
                  side="end"
                  size="lg"
                  onClick={next}
                  label={t("nextImage")}
                  icon={<ChevronRight className="size-6 rtl:-scale-x-100" aria-hidden />}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                  <span className="rounded-md bg-white/10 px-3 py-1 text-sm font-medium text-white tabular-nums backdrop-blur-sm">
                    {active + 1} / {total}
                  </span>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Arrow button used in both the tile and the lightbox. Fixed to the vertical
 * middle so it aligns with the image regardless of aspect ratio; only visible
 * on hover/focus on desktop, always visible on touch (no hover state to lean
 * on). Sizes are the two we actually use — `lg` for the fullscreen view.
 */
function ArrowButton({
  side,
  onClick,
  label,
  icon,
  size = "md",
}: {
  side: "start" | "end"
  onClick: () => void
  label: string
  icon: ReactNode
  size?: "md" | "lg"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // `rounded-lg` matches the Button component's base radius so the
        // overlay controls read as part of the same UI kit instead of a
        // stray media-viewer pill.
        "absolute top-1/2 -translate-y-1/2 rounded-lg bg-black/40 text-white backdrop-blur-sm transition-all",
        "hover:bg-black/65 focus-visible:bg-black/65 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
        // Touch: visible by default. Pointer devices: only surface on hover
        // or keyboard focus so the image isn't cluttered.
        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
        side === "start" ? "start-3" : "end-3",
        size === "lg" ? "p-3" : "p-2",
      )}
      aria-label={label}
    >
      {icon}
    </button>
  )
}

/**
 * Wraps a horizontally-scrollable child (the thumb strip) with mouse-drag
 * scrolling. Touch already works via native overflow scrolling; this adds
 * parity for pointer users on desktop.
 */
function DraggableStrip({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startX: number; scrollLeft: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    // Ignore clicks on the thumb buttons — those should just navigate.
    if ((e.target as HTMLElement).closest("button")) return
    const strip = ref.current?.firstElementChild
    if (!(strip instanceof HTMLElement)) return
    drag.current = { startX: e.clientX, scrollLeft: strip.scrollLeft }
    strip.setPointerCapture(e.pointerId)
    strip.style.cursor = "grabbing"
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const strip = ref.current?.firstElementChild
    if (!(strip instanceof HTMLElement)) return
    strip.scrollLeft = drag.current.scrollLeft - (e.clientX - drag.current.startX)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return
    const strip = ref.current?.firstElementChild
    if (strip instanceof HTMLElement) {
      strip.releasePointerCapture(e.pointerId)
      strip.style.cursor = ""
    }
    drag.current = null
  }

  return (
    <div
      ref={ref}
      className="mt-3 cursor-grab"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {children}
    </div>
  )
}
