/**
 * Inline SVG icons for the "Browse by metal" / "Browse by stone" rows.
 *
 * Metals read as a ring band in the actual alloy colour (the one thing that
 * tells yellow from rose from platinum at a glance), so those colours are fixed
 * rather than `currentColor`. Stone cuts are line-art gem silhouettes — the
 * outline is what identifies a round from a princess from a marquise — and use
 * `currentColor` so they follow the row's text colour and theme.
 */

const METAL_COLORS: Record<string, string> = {
  "yellow-gold": "#E3B23C",
  "white-gold": "#DADCE0",
  "rose-gold": "#D89A86",
  platinum: "#B9C0C9",
  silver: "#A9AFB6",
}

export function MetalIcon({
  metal,
  className,
}: {
  metal: string
  className?: string
}) {
  const color = METAL_COLORS[metal] ?? "currentColor"
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="12" r="6.5" stroke={color} strokeWidth="3.5" />
      <circle cx="8.4" cy="8.4" r="1.1" fill="#ffffff" opacity="0.5" />
    </svg>
  )
}

function StoneShape({ cut }: { cut: string }) {
  switch (cut) {
    case "round":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" opacity="0.55" />
          <path
            d="M17 12 20 12 M15.54 15.54 17.66 17.66 M12 17 12 20 M8.46 15.54 6.34 17.66 M7 12 4 12 M8.46 8.46 6.34 6.34 M12 7 12 4 M15.54 8.46 17.66 6.34"
            opacity="0.4"
          />
        </>
      )
    case "princess":
      return (
        <>
          <rect x="4" y="4" width="16" height="16" rx="1.5" />
          <path d="M12 8 16 12 12 16 8 12 Z" opacity="0.55" />
          <path d="M4 4 20 20 M20 4 4 20" opacity="0.35" />
        </>
      )
    case "oval":
      return (
        <>
          <ellipse cx="12" cy="12" rx="6.5" ry="9" />
          <ellipse cx="12" cy="12" rx="2.6" ry="4" opacity="0.55" />
        </>
      )
    case "emerald":
      return (
        <>
          <path d="M9 3 H15 L18 6 V18 L15 21 H9 L6 18 V6 Z" />
          <path
            d="M11 7 H13 L15 9 V15 L13 17 H11 L9 15 V9 Z"
            opacity="0.55"
          />
        </>
      )
    case "pear":
      return (
        <>
          <path d="M12 3.5 C15.5 7.5 18 10.5 18 14 A6 6 0 1 1 6 14 C6 10.5 8.5 7.5 12 3.5 Z" />
          <ellipse cx="12" cy="14.5" rx="3" ry="3.2" opacity="0.55" />
        </>
      )
    case "marquise":
      return (
        <>
          <path d="M3 12 C7 7 17 7 21 12 C17 17 7 17 3 12 Z" />
          <path
            d="M8 12 C9.5 10 14.5 10 16 12 C14.5 14 9.5 14 8 12 Z"
            opacity="0.55"
          />
        </>
      )
    case "cushion":
      return (
        <>
          <rect x="4" y="4" width="16" height="16" rx="6" />
          <rect x="8" y="8" width="8" height="8" rx="3" opacity="0.55" />
        </>
      )
    default:
      return <circle cx="12" cy="12" r="9" />
  }
}

export function StoneIcon({
  cut,
  className,
}: {
  cut: string
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <StoneShape cut={cut} />
    </svg>
  )
}
