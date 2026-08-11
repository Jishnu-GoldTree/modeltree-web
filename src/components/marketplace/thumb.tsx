import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Cover artwork for catalog imagery.
 *
 * A card passes `src` when the catalog has a rendered preview for it. When it
 * doesn't — which is every card until the asset pipeline exists — the seed
 * drives a generated SVG instead, so no card renders an empty frame and no two
 * cards look alike.
 *
 * The artwork is a flat-shaded isometric still life: a stage, a grid floor, and
 * a few stacked blocks. Every fill is a solid colour — the 3D read comes from
 * stepping lightness per cube face, not from gradients — so the whole thing
 * stays a handful of paths and costs nothing to render server-side.
 */

/* ---------------------------------------------------------------- seeding */

function hashSeed(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/**
 * mulberry32. The art needs a dozen independent values per card, and pulling
 * them off a proper generator keeps them uncorrelated — bit-shifting one hash
 * lines cards up in visible patterns.
 */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Vivid, well-separated hues. Cards pick a few each, never the whole set. */
const HUES = [188, 258, 22, 340, 150, 45, 210, 300]

const flat = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`

/* ------------------------------------------------------------------- art */

const VIEW_W = 400
const VIEW_H = 300

/**
 * One isometric block, positioned by its bottom vertex. The three faces reuse
 * the wordmark cube's geometry on a 32-unit grid, each filled with the same hue
 * at a stepped lightness so the form reads without any shading gradient.
 */
function IsoBlock({
  x,
  baseY,
  scale,
  hue,
}: {
  x: number
  baseY: number
  scale: number
  hue: number
}) {
  return (
    <g
      transform={`translate(${x - 16 * scale} ${baseY - 29.5 * scale}) scale(${scale})`}
    >
      <path d="M16 2.5 29 10 16 17.5 3 10Z" fill={flat(hue, 74, 63)} />
      <path d="M3 10v12l13 7.5V17.5Z" fill={flat(hue, 66, 45)} />
      <path d="M29 10v12l-13 7.5V17.5Z" fill={flat(hue, 62, 31)} />
    </g>
  )
}

function SeededArt({ seed, grid }: { seed: string; grid: boolean }) {
  const next = rng(hashSeed(seed))
  const pick = <T,>(items: readonly T[]) =>
    items[Math.floor(next() * items.length)]

  const stageHue = pick(HUES)
  /** Horizon. Blocks all sit below it, so none float in the backdrop. */
  const floorY = 186

  // Distinct block hues — sampling with replacement makes near-duplicate
  // neighbours common enough to notice across a grid of cards.
  const palette = [...HUES].sort(() => next() - 0.5)
  const count = 2 + Math.floor(next() * 2)

  // Depth drives size, vertical position and paint order together, so a bigger
  // block always sits lower and in front. Sorted far-to-near for correct
  // occlusion, since flat fills give no other depth cue.
  const blocks = Array.from({ length: count }, (_, i) => {
    const depth = next()
    return {
      depth,
      hue: palette[i % palette.length],
      scale: 2.3 + depth * 2.3,
      baseY: floorY + 6 + depth * 38,
      x: 92 + (i * 216) / Math.max(count - 1, 1) + (next() - 0.5) * 44,
    }
  }).sort((a, b) => a.depth - b.depth)

  // Two flat backdrop shapes, well behind the subject, for a bit of variety.
  const accentHue = pick(HUES)
  const accentX = 60 + next() * 280
  const accentR = 34 + next() * 40

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      // Cards come in 4:3, 16:7 and 1:1, so cover-crop rather than letterbox.
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
      aria-hidden
    >
      <rect width={VIEW_W} height={VIEW_H} fill={flat(stageHue, 26, 13)} />

      <circle
        cx={accentX}
        cy={92}
        r={accentR}
        fill={flat(accentHue, 48, 26)}
      />

      <rect
        y={floorY}
        width={VIEW_W}
        height={VIEW_H - floorY}
        fill={flat(stageHue, 24, 9)}
      />

      {grid && (
        <g
          stroke={flat(stageHue, 30, 46)}
          strokeWidth={1}
          opacity={0.5}
        >
          {/* Verticals converge on a vanishing point above the floor line,
              which fakes perspective without a CSS 3D transform. */}
          {Array.from({ length: 11 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={VIEW_W / 2 + (i - 5) * 26}
              y1={floorY}
              x2={VIEW_W / 2 + (i - 5) * 190}
              y2={VIEW_H}
            />
          ))}
          {/* Horizontals bunch up toward the horizon by squaring the step. */}
          {Array.from({ length: 6 }, (_, i) => {
            const t = (i + 1) / 6
            return (
              <line
                key={`h${i}`}
                x1={0}
                y1={floorY + t * t * (VIEW_H - floorY)}
                x2={VIEW_W}
                y2={floorY + t * t * (VIEW_H - floorY)}
              />
            )
          })}
        </g>
      )}

      {blocks.map((block, i) => (
        <g key={i}>
          <ellipse
            cx={block.x}
            cy={block.baseY + 2}
            rx={13 * block.scale}
            ry={3.4 * block.scale}
            fill={flat(stageHue, 30, 6)}
            opacity={0.55}
          />
          <IsoBlock
            x={block.x}
            baseY={block.baseY}
            scale={block.scale}
            hue={block.hue}
          />
        </g>
      ))}
    </svg>
  )
}

/* ----------------------------------------------------------------- public */

type ThumbProps = {
  seed: string
  className?: string
  /** Perspective grid floor. Turn off for thumbnails under ~80px. */
  grid?: boolean
  /** Catalog preview. Falls back to the generated artwork when absent. */
  src?: string
  /**
   * Empty by default: cards title their own link, so the cover is decorative
   * and announcing it would only duplicate that label for screen readers.
   */
  alt?: string
  /** Rendered width across breakpoints, so Next picks a sane srcset entry. */
  sizes?: string
  children?: React.ReactNode
}

export function Thumb({
  seed,
  className,
  grid = true,
  src,
  alt = "",
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  children,
}: ThumbProps) {
  return (
    <div className={cn("relative overflow-hidden bg-ink", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <SeededArt seed={seed} grid={grid} />
      )}

      {children}
    </div>
  )
}
