"use client"

import { useEffect, useState } from "react"
import { Download, ShoppingCart } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Bottom purchase bar for phones and tablets, shown once the buy box's own
 * button has scrolled out of view: on a long product page the buy box is far
 * above the specs and reviews a buyer reads before deciding.
 *
 * The button submits the page's existing `#buy-form` through the `form`
 * attribute, so it adds the licence currently selected in the buy box. There
 * is no second copy of the cart logic to drift.
 */
export function MobileBuyBar({
  title,
  price,
  label,
  free,
}: {
  title: string
  price: string
  label: string
  free: boolean
}) {
  const [visible, setVisible] = useState(false)

  // A scroll check rather than an IntersectionObserver: the buy box streams in
  // behind a Suspense boundary, so `#buy-button` may not exist yet when this
  // mounts. Looking it up on each (rAF-throttled) scroll needs no retry logic.
  useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      const button = document.getElementById("buy-button")
      setVisible(button ? button.getBoundingClientRect().bottom < 0 : false)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    check()
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      <div aria-hidden className="h-20 lg:hidden" />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-200 lg:hidden",
          visible ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!visible}
        inert={!visible}
      >
        <div className="shell flex h-16 items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="text-sm font-semibold tabular-nums">{price}</p>
          </div>
          <button
            type="submit"
            form="buy-form"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground outline-none hover:bg-brand/85 focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            {free ? <Download className="size-4" aria-hidden /> : <ShoppingCart className="size-4" aria-hidden />}
            {label}
          </button>
        </div>
      </div>
    </>
  )
}
