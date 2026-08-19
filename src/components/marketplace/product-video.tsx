"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

/**
 * Autoplaying product loop for the rotating in-house renders.
 *
 * Muted and inline so mobile browsers permit playback, but driven by an
 * IntersectionObserver instead of the `autoplay` attribute for two reasons:
 * offscreen tiles stay paused until scrolled into view (no wasted decode on a
 * long landing page), and visitors who ask for reduced motion keep the still
 * poster rather than a spinning ring. With JS off the poster is what shows,
 * which is an acceptable fallback for decorative media.
 */
export function ProductVideo({
  src,
  poster,
  className,
  videoClassName,
}: {
  src: string
  poster?: string
  className?: string
  videoClassName?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    // React can leave the `muted` DOM property unset even with the attribute
    // rendered, and browsers block programmatic play() on an unmuted element —
    // pin it before we ever call play().
    video.muted = true
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.25 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <video
        ref={ref}
        className={cn("absolute inset-0 size-full object-cover", videoClassName)}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      />
    </div>
  )
}
