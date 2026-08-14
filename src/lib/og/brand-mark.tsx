/**
 * The solitaire on its own, for the app icons. Shared by `icon`, `apple-icon`
 * and the OG images so all of them stay in sync with the header.
 *
 * This is the header glyph retuned for small sizes: the two pavilion faces are
 * pushed further apart in value, since at 32px the subtle 0.75/0.45 opacities
 * of the full logo collapse into a single grey blob. The viewBox is tightened
 * past the artwork's 32x32 bounds so the stone fills the tile instead of
 * floating in it.
 *
 * Flat fills only — this renders through Satori, which supports a narrow subset
 * of SVG and silently drops gradients and filters.
 */

const INK = "#101924";
/** oklch(0.78 0.088 82), the champagne gold from globals.css. Satori needs hex. */
const BRAND = "#d4b275";

export function BrandMark({
  size,
  radius,
}: {
  size: number;
  radius: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: INK,
        borderRadius: radius,
      }}
    >
      <svg width={size * 0.9} height={size * 0.9} viewBox="4 3 24 27" fill="none">
        <path d="M5.5 12.5 16 4l10.5 8.5H5.5Z" fill={BRAND} />
        <path d="M5.5 12.5H16v16L5.5 12.5Z" fill="#ffffff" />
        <path d="M26.5 12.5H16v16l10.5-16Z" fill="#7d8fa3" />
      </svg>
    </div>
  );
}
