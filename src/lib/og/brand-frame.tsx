import { SITE } from "@/lib/data/landing";

/**
 * Shared artwork for the social share cards. Both `opengraph-image` and
 * `twitter-image` render this so the two can never drift apart.
 *
 * Rendered by satori, which supports only flexbox and a subset of CSS — no
 * grid, no `gap` shorthand quirks, and every element holding more than one
 * child needs an explicit `display: flex`. The brand tokens live in
 * `globals.css` as oklch(), which satori cannot parse, so they are inlined
 * here as the equivalent sRGB hex.
 */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
export const ogAlt = `${SITE.name} | ${SITE.tagline}`;

const INK = "#101924";
const BRAND = "#00bdbd";
const WHITE = "#ffffff";
const MUTED = "#93a4b8";

export function BrandFrame() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        backgroundColor: INK,
        // Teal glow bleeding in from the top-right, over a faint grid.
        backgroundImage: `radial-gradient(circle at 78% 12%, rgba(0,189,189,0.28) 0%, rgba(0,189,189,0) 45%),
          linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 48px 48px, 48px 48px",
      }}
    >
      {/* Wordmark — the isometric cube from the site header, scaled up. */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <svg width={72} height={72} viewBox="0 0 32 32" fill="none">
          <path
            d="M16 2.5 29 10v12L16 29.5 3 22V10L16 2.5Z"
            fill={WHITE}
            opacity={0.14}
          />
          <path d="M16 2.5 29 10 16 17.5 3 10 16 2.5Z" fill={BRAND} />
          <path d="M3 10v12l13 7.5V17.5L3 10Z" fill={WHITE} opacity={0.75} />
          <path d="M29 10v12l-13 7.5V17.5L29 10Z" fill={WHITE} opacity={0.45} />
        </svg>
        <div
          style={{
            display: "flex",
            marginLeft: 20,
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: -1.5,
            color: WHITE,
          }}
        >
          <span>MODEL</span>
          <span style={{ color: BRAND }}>TREE</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 78,
            fontWeight: 700,
            letterSpacing: -2.5,
            lineHeight: 1.05,
            color: WHITE,
            maxWidth: 900,
          }}
        >
          {SITE.tagline}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 30,
            lineHeight: 1.35,
            color: MUTED,
            maxWidth: 860,
          }}
        >
          Buy and sell royalty-free 3D models, textures and print-ready assets.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex" }}>
          {["1.9M+ assets", "200,000+ designers", "Royalty-free"].map(
            (stat) => (
              <div
                key={stat}
                style={{
                  display: "flex",
                  marginRight: 16,
                  paddingLeft: 26,
                  paddingRight: 26,
                  paddingTop: 12,
                  paddingBottom: 12,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.16)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  fontSize: 25,
                  color: WHITE,
                }}
              >
                {stat}
              </div>
            ),
          )}
        </div>
        <div style={{ display: "flex", fontSize: 25, color: BRAND }}>
          modeltree.vercel.app
        </div>
      </div>
    </div>
  );
}
