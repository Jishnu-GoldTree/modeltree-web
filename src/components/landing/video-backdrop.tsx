"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

/**
 * Crossfading video backdrop for the alternative hero.
 *
 * One clip plays at a time; the others sit paused at opacity 0 stacked behind
 * it, and a timer advances the active index so the layers dissolve into one
 * another. Only the active element is ever playing, so the page never decodes
 * more than one video at once no matter how many clips are passed.
 *
 * Muted + inline so mobile autoplay is permitted, and the whole thing is
 * decorative (aria-hidden). Under reduced motion nothing plays or fades — the
 * first poster is held as a still backdrop.
 */
export function VideoBackdrop({
  clips,
  className,
  intervalMs = 6000,
}: {
  clips: { src: string; poster: string }[]
  className?: string
  intervalMs?: number
}) {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    if (clips.length === 0) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    // Kick the first clip; the rest start when they become active.
    const first = refs.current[0]
    if (first) {
      first.muted = true
      first.play().catch(() => {})
    }
    if (clips.length < 2) return

    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % clips.length)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [clips.length, intervalMs])

  useEffect(() => {
    const video = refs.current[active]
    if (!video) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    video.muted = true
    video.currentTime = 0
    video.play().catch(() => {})
    return () => {
      // Pause the outgoing clip once it has faded out so it stops decoding.
      video.pause()
    }
  }, [active])

  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden bg-ink", className)}>
      {clips.map((clip, i) => (
        <video
          key={clip.src}
          ref={(el) => {
            refs.current[i] = el
          }}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-in-out",
            i === active ? "opacity-100" : "opacity-0",
          )}
          src={clip.src}
          poster={clip.poster}
          muted
          loop
          playsInline
          preload={i === 0 ? "metadata" : "none"}
        />
      ))}
      {/* Scrim so white type stays legible over any frame. */}
      <div className="absolute inset-0 bg-ink/55" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, oklch(0.16 0.018 245 / 0.35), oklch(0.16 0.018 245 / 0.85))",
        }}
      />
    </div>
  )
}
