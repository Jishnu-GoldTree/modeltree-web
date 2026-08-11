/**
 * The isometric cube on its own, for the app icons. Shared by `icon` and
 * `apple-icon` so the two stay in sync.
 *
 * This is the header glyph retuned for small sizes: the faint outer silhouette
 * is dropped and the two lower faces are pushed further apart in value, since
 * at 32px the subtle 0.75/0.45 opacities of the full logo collapse into a
 * single grey blob. The viewBox is tightened past the artwork's 32x32 bounds so
 * the cube fills the tile instead of floating in it.
 */

const INK = "#101924";
const BRAND = "#00bdbd";

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
      <svg width={size * 0.94} height={size * 0.94} viewBox="3 2 26 28" fill="none">
        <path d="M16 2.5 29 10 16 17.5 3 10 16 2.5Z" fill={BRAND} />
        <path d="M3 10v12l13 7.5V17.5L3 10Z" fill="#ffffff" />
        <path d="M29 10v12l-13 7.5V17.5L29 10Z" fill="#7d8fa3" />
      </svg>
    </div>
  );
}
