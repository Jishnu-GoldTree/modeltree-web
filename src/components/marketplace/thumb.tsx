import { cn } from "@/lib/utils"

/**
 * Deterministic placeholder artwork for catalog imagery.
 *
 * The real marketplace will serve rendered previews from the asset pipeline.
 * Until that exists, every card derives a stable "studio shot" from its seed:
 * a dark stage, a perspective grid floor, and a lit subject silhouette. Hues
 * stay inside a narrow cool band so a wall of cards reads as one system rather
 * than a rainbow, and a given model keeps its artwork between renders.
 */

function hashSeed(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** Cool band: teal → blue → indigo → violet. Keeps the grid cohesive. */
const HUE_START = 175
const HUE_RANGE = 135

function seedTokens(seed: string) {
  const h = hashSeed(seed)
  const hue = HUE_START + (h % HUE_RANGE)
  const accent = HUE_START + ((h >> 7) % HUE_RANGE)
  return {
    hue,
    accent,
    /** Light position, so the subject isn't lit identically on every card. */
    lightX: 34 + (h % 32),
    lightY: 22 + ((h >> 5) % 20),
  }
}

type ThumbProps = {
  seed: string
  className?: string
  /** Perspective grid floor. Turn off for thumbnails under ~80px. */
  grid?: boolean
  children?: React.ReactNode
}

export function Thumb({ seed, className, grid = true, children }: ThumbProps) {
  const { hue, accent, lightX, lightY } = seedTokens(seed)

  return (
    <div
      className={cn("relative overflow-hidden bg-ink", className)}
      style={{
        backgroundImage: `linear-gradient(170deg, oklch(0.32 0.045 ${hue}), oklch(0.17 0.03 ${accent}) 62%, oklch(0.13 0.02 ${accent}))`,
      }}
    >
      {grid && (
        <div
          aria-hidden
          className="absolute inset-x-[-50%] bottom-0 h-[62%] opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 0.55) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.55) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            transform: "perspective(220px) rotateX(64deg)",
            transformOrigin: "50% 100%",
            maskImage:
              "linear-gradient(to top, black 5%, transparent 85%)",
          }}
        />
      )}

      {/* Key light + subject: a soft lit mass sitting on the grid floor. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: [
            `radial-gradient(60% 55% at ${lightX}% ${lightY}%, oklch(0.82 0.1 ${hue} / 0.55) 0%, transparent 70%)`,
            `radial-gradient(34% 30% at 50% 58%, oklch(0.72 0.12 ${accent} / 0.65) 0%, oklch(0.4 0.08 ${accent} / 0.35) 45%, transparent 72%)`,
            `radial-gradient(45% 14% at 50% 82%, oklch(0 0 0 / 0.5) 0%, transparent 75%)`,
          ].join(","),
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/10"
      />

      {children}
    </div>
  )
}
