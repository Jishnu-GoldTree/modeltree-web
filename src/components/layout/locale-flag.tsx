import { useId } from "react"

import { cn } from "@/lib/utils"
import type { Locale } from "@/i18n/routing"

/**
 * Inline flags for the language picker — no image requests, crisp at any
 * density. English uses the Union Jack because the site's English is British
 * ("jewellery", "licence"). Decorative: the visible locale code and the
 * button's label carry the meaning, so the SVG is aria-hidden.
 */
export function LocaleFlag({ locale, className }: { locale: Locale; className?: string }) {
  const shared = cn("h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/10", className)
  return locale === "he" ? <IsraelFlag className={shared} /> : <UnionJack className={shared} />
}

function IsraelFlag({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 220 160" className={className} aria-hidden preserveAspectRatio="none">
      <rect width="220" height="160" fill="#fff" />
      <rect y="15" width="220" height="25" fill="#0038b8" />
      <rect y="120" width="220" height="25" fill="#0038b8" />
      <path
        d="M110 47 138.6 96.5H81.4ZM110 113 81.4 63.5H138.6Z"
        fill="none"
        stroke="#0038b8"
        strokeWidth="5.5"
      />
    </svg>
  )
}

function UnionJack({ className }: { className: string }) {
  // Clip-path ids must be unique per instance: the trigger and the menu both
  // render a flag, and duplicate ids would make one borrow the other's clip.
  const id = useId().replace(/:/g, "")
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden preserveAspectRatio="none">
      <clipPath id={`${id}s`}>
        <path d="M0 0v30h60V0z" />
      </clipPath>
      <clipPath id={`${id}t`}>
        <path d="M30 15h30v15zv15H0zH0V0zV0h30z" />
      </clipPath>
      <g clipPath={`url(#${id}s)`}>
        <path d="M0 0v30h60V0z" fill="#012169" />
        <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
        <path d="M0 0l60 30m0-30L0 30" clipPath={`url(#${id}t)`} stroke="#c8102e" strokeWidth="4" />
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
        <path d="M30 0v30M0 15h60" stroke="#c8102e" strokeWidth="6" />
      </g>
    </svg>
  )
}
