"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

/**
 * Global top-of-page loading bar for client-side route transitions.
 *
 * App Router exposes no router-event stream, so the two ends are detected
 * separately: navigation *starts* on a click of an internal `<a>` (or a
 * back/forward `popstate`), and *finishes* when the committed URL — pathname
 * plus query — changes. A trickle creeps the bar toward 90% while the server
 * responds so it never sits still; the commit snaps it to 100% and fades it out.
 *
 * Painting is held for a short delay so a prefetched route — which commits
 * almost instantly — shows nothing rather than a distracting flash.
 */
export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const url = `${pathname}?${searchParams}`

  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)

  const pending = useRef(false)
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null)
  const showDelay = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fade = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reset = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback(() => {
    if (pending.current) return
    pending.current = true
    if (fade.current) clearTimeout(fade.current)
    if (reset.current) clearTimeout(reset.current)
    showDelay.current = setTimeout(() => {
      showDelay.current = null
      setVisible(true)
      setWidth(8)
      trickle.current = setInterval(() => {
        // Ease toward 90% in shrinking steps; never arrive on its own.
        setWidth((w) => (w >= 90 ? w : w + (90 - w) * 0.15))
      }, 300)
    }, 120)
  }, [])

  const stop = useCallback(() => {
    if (!pending.current) return
    pending.current = false
    const wasPainting = trickle.current !== null
    if (showDelay.current) {
      clearTimeout(showDelay.current)
      showDelay.current = null
    }
    if (trickle.current) {
      clearInterval(trickle.current)
      trickle.current = null
    }
    if (!wasPainting) {
      setVisible(false)
      setWidth(0)
      return
    }
    setWidth(100)
    fade.current = setTimeout(() => {
      setVisible(false)
      // Snap the width back only once the bar has faded, so it doesn't
      // visibly rewind from 100% to 0.
      reset.current = setTimeout(() => setWidth(0), 250)
    }, 200)
  }, [])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }
      const anchor = (event.target as Element | null)?.closest?.("a")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      const target = anchor.getAttribute("target")
      if (
        !href ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("rel")?.includes("external") ||
        (target && target !== "_self")
      ) {
        return
      }

      let next: URL
      try {
        next = new URL(href, window.location.href)
      } catch {
        return
      }
      // Off-site, or a same-page hash/query the router resolves without a fresh
      // server render — nothing to wait on.
      if (next.origin !== window.location.origin) return
      if (
        next.pathname === window.location.pathname &&
        next.search === window.location.search
      ) {
        return
      }
      start()
    }

    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", start)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", start)
    }
  }, [start])

  // The committed URL changed: the new route is on screen, so finish. Skipped
  // on first mount — there's no transition to close there.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    stop()
  }, [url, stop])

  // Clear every timer on unmount.
  useEffect(
    () => () => {
      for (const ref of [trickle, showDelay, fade, reset]) {
        if (ref.current) clearTimeout(ref.current as ReturnType<typeof setTimeout>)
      }
    },
    [],
  )

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 transition-opacity duration-200 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-full bg-brand transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
