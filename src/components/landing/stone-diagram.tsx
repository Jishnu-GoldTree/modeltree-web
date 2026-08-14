import { cn } from "@/lib/utils"

/**
 * A round brilliant in plan view, drawn as a CAD wireframe on a lit stage.
 *
 * The register the whole business works in: jewelers send us geometry, not
 * photographs, so the section about model quality shows geometry rather than a
 * render of a finished ring. It is also the one piece of imagery on this page
 * that is unambiguously ours — every catalog thumbnail is still a stand-in
 * photograph until the R2 preview pipeline lands.
 *
 * The facet layout is the real one rather than a decorative starburst: an
 * octagonal table at 0.53 of the girdle radius, eight kite facets spining out
 * to the girdle, eight star facets between them, sixteen upper-girdle
 * divisions. Those coordinates were computed from the proportions instead of
 * eyeballed, because a jeweler is exactly the person who would notice.
 *
 * Inline SVG, not an asset: it takes its colours from the theme tokens, scales
 * without a srcset and costs no request. Decorative, so it is hidden from
 * assistive tech — the heading and list beside it carry the meaning.
 *
 * Drawn for a dark surface. It is used inside the ink band and nowhere else;
 * on white the gold strokes fall below 3:1 and stop reading.
 */
export function StoneDiagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 620"
      /*
        `slice`, not `meet`: the drawing fills its box and crops, the way a
        cover image does, instead of letterboxing inside it and leaving bands of
        empty ink above and below. The stone sits high in the frame and the grid
        runs off every edge by design, so cropping takes only floor and margin —
        there is nothing at the boundaries that must survive.
      */
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn("size-full", className)}
    >
      <defs>
        {/* Gold, brightest where the light hits and falling off down the stone. */}
        <linearGradient id="stoneMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.88 0.07 88)" />
          <stop offset="45%" stopColor="oklch(0.78 0.088 82)" />
          <stop offset="100%" stopColor="oklch(0.55 0.09 72)" />
        </linearGradient>

        {/* Fades the floor into the horizon so it reads as distance rather than
            as a rectangle that simply stops. */}
        <linearGradient id="stoneFloorFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="40%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0.95" />
        </linearGradient>
        <mask id="stoneFloorMask">
          <rect x="0" y="430" width="800" height="190" fill="url(#stoneFloorFade)" />
        </mask>

        <filter id="stoneGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/*
        No background rect.

        There was one — a radial "stage light" a couple of steps lighter than
        the band behind it. Even fading to transparent at its edge it read as a
        panel sitting on the section rather than as part of it, because the lit
        centre was a different ink from the band and the eye finds that edge
        wherever it is. The band's own `bg-ink` is now the ground, and the only
        light in the drawing is the glow on the stone itself, which is where it
        should have been coming from.

        The consequence to keep in mind: this SVG is now transparent, so it
        takes whatever it is placed on. It is drawn for a dark surface — on
        white the gold strokes fall below 3:1 and stop reading.
      */}

      {/* ── Perspective floor ────────────────────────────────────────────
          Verticals converge on a vanishing point at the horizon; horizontals
          compress towards it on a reciprocal, so the grid genuinely recedes
          instead of being a tapered ladder. */}
      <g
        mask="url(#stoneFloorMask)"
        stroke="oklch(0.78 0.088 82)"
        strokeWidth="1"
        opacity="0.26"
      >
        {Array.from({ length: 13 }, (_, i) => {
          const x = -400 + i * 150
          return <line key={`v${i}`} x1={x} y1={620} x2={400} y2={430} />
        })}
        {Array.from({ length: 9 }, (_, i) => {
          const t = (i + 1) / 10
          const y = 430 + 190 * t * t
          return <line key={`h${i}`} x1={0} y1={y} x2={800} y2={y} />
        })}
      </g>

      <line
        x1="0"
        y1="430"
        x2="800"
        y2="430"
        stroke="oklch(0.78 0.088 82)"
        strokeWidth="1"
        opacity="0.32"
      />

      {/* The stone's footprint on the stage, compressed and faint. */}
      <ellipse cx="400" cy="452" rx="185" ry="22" fill="oklch(0.78 0.088 82)" opacity="0.07" />

      {/* ── The stone ────────────────────────────────────────────────────
          Geometry was computed around a centre of (400, 400) at radius 180;
          this maps that onto (400, 245) at radius 140 rather than restating
          every coordinate, so the drawing and its arithmetic stay in step. */}
      <g transform="translate(400 245) scale(0.78) translate(-400 -400)">
        <circle
          cx="400"
          cy="400"
          r="180"
          fill="oklch(0.78 0.088 82 / 0.04)"
          stroke="url(#stoneMetal)"
          strokeWidth="2"
          filter="url(#stoneGlow)"
        />

        {/* Sixteen upper-girdle divisions, as ticks on the girdle itself. */}
        <g stroke="url(#stoneMetal)" strokeWidth="1.5" opacity="0.5">
          {Array.from({ length: 16 }, (_, k) => {
            const a = ((22.5 * k - 90) * Math.PI) / 180
            return (
              <line
                key={`t${k}`}
                x1={400 + 172 * Math.cos(a)}
                y1={400 + 172 * Math.sin(a)}
                x2={400 + 188 * Math.cos(a)}
                y2={400 + 188 * Math.sin(a)}
              />
            )
          })}
        </g>

        {/* Star facets — apex out to the girdle, and back to both table vertices. */}
        <path
          d="M 363.5 311.9 L 400 263.2 L 436.5 311.9 M 400 263.2 L 400 220 M 436.5 311.9 L 496.7 303.3 L 488.1 363.5 M 496.7 303.3 L 527.3 272.7 M 488.1 363.5 L 536.8 400 L 488.1 436.5 M 536.8 400 L 580 400 M 488.1 436.5 L 496.7 496.7 L 436.5 488.1 M 496.7 496.7 L 527.3 527.3 M 436.5 488.1 L 400 536.8 L 363.5 488.1 M 400 536.8 L 400 580 M 363.5 488.1 L 303.3 496.7 L 311.9 436.5 M 303.3 496.7 L 272.7 527.3 M 311.9 436.5 L 263.2 400 L 311.9 363.5 M 263.2 400 L 220 400 M 311.9 363.5 L 303.3 303.3 L 363.5 311.9 M 303.3 303.3 L 272.7 272.7"
          fill="none"
          stroke="url(#stoneMetal)"
          strokeWidth="1.25"
          opacity="0.7"
        />

        {/* Kite spines — table vertex to girdle. */}
        <path
          d="M 436.5 311.9 L 468.9 233.7 M 488.1 363.5 L 566.3 331.1 M 488.1 436.5 L 566.3 468.9 M 436.5 488.1 L 468.9 566.3 M 363.5 488.1 L 331.1 566.3 M 311.9 436.5 L 233.7 468.9 M 311.9 363.5 L 233.7 331.1 M 363.5 311.9 L 331.1 233.7"
          fill="none"
          stroke="url(#stoneMetal)"
          strokeWidth="1.5"
          opacity="0.85"
        />

        {/* Table — the flat top, and the brightest line in the drawing. */}
        <path
          d="M 436.5 311.9 L 488.1 363.5 L 488.1 436.5 L 436.5 488.1 L 363.5 488.1 L 311.9 436.5 L 311.9 363.5 L 363.5 311.9 Z"
          fill="oklch(0.78 0.088 82 / 0.07)"
          stroke="url(#stoneMetal)"
          strokeWidth="2"
        />
      </g>

      {/* ── Dimension annotation ──────────────────────────────────────────
          Drawn outside the transform, so the rule sits where it belongs on the
          stage rather than being scaled with the stone. A drawing carrying a
          dimension reads as a working file rather than as an illustration of
          one. Left-to-right in both locales: this is a measurement, not prose. */}
      <g stroke="oklch(0.78 0.088 82)" strokeWidth="1" opacity="0.45">
        <line x1="400" y1="404" x2="540" y2="404" />
        <line x1="400" y1="394" x2="400" y2="414" />
        <line x1="540" y1="394" x2="540" y2="414" />
      </g>
      <text
        x="470"
        y="390"
        textAnchor="middle"
        direction="ltr"
        fill="oklch(0.78 0.088 82)"
        opacity="0.6"
        className="font-mono text-[15px]"
      >
        ⌀ 6.50
      </text>
    </svg>
  )
}
