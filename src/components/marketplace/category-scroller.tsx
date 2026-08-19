"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

/**
 * Overflow arrows for the category strip. Still server-rendered links inside,
 * so the row is shareable and works without JS — this thin wrapper only owns
 * the `<ul>` scroll container plus two edge buttons that fade in when there's
 * hidden content on that physical side.
 *
 * The arrows and their scrolling are physical (left/right), not logical, so
 * one code path serves both LTR and RTL: `scrollBy`/`scrollLeft` share a
 * coordinate space, and overflow on each side is derived from a
 * direction-normalised offset rather than branching on `dir`.
 */
export function CategoryScroller({
  prevLabel,
  nextLabel,
  children,
}: {
  prevLabel: string
  nextLabel: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLUListElement>(null)
  const [hiddenLeft, setHiddenLeft] = useState(false)
  const [hiddenRight, setHiddenRight] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    // In RTL the browser reports scrollLeft as 0 at the inline start (rightmost)
    // down to -max at the far left; shifting by `max` folds both models into a
    // single "pixels hidden past the physical left edge" measure.
    const rtl = getComputedStyle(el).direction === "rtl"
    const fromLeft = rtl ? el.scrollLeft + max : el.scrollLeft
    setHiddenLeft(fromLeft > 1)
    setHiddenRight(fromLeft < max - 1)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [update])

  function scrollByPage(direction: 1 | -1) {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className="relative">
      <ul
        ref={ref}
        onScroll={update}
        className="no-scrollbar flex items-center gap-2.5 overflow-x-auto py-3"
      >
        {children}
      </ul>

      {hiddenLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center bg-gradient-to-r from-background from-45% to-transparent pr-10">
          <button
            type="button"
            aria-label={prevLabel}
            onClick={() => scrollByPage(-1)}
            className="pointer-events-auto grid size-8 place-items-center rounded-full border bg-background text-muted-foreground shadow-sm outline-none transition-colors hover:border-brand hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {hiddenRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-end bg-gradient-to-l from-background from-45% to-transparent pl-10">
          <button
            type="button"
            aria-label={nextLabel}
            onClick={() => scrollByPage(1)}
            className="pointer-events-auto grid size-8 place-items-center rounded-full border bg-background text-muted-foreground shadow-sm outline-none transition-colors hover:border-brand hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
