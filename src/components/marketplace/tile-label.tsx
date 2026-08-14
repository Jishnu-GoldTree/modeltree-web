/**
 * Caption over a category tile.
 *
 * The label used to be white text with a drop shadow straight on the image,
 * which worked while covers were dark generated artwork. Now that tiles carry
 * product photography shot on white, white-on-white left them invisible — a
 * shadow alone cannot rescue text whose background is the same luminance as
 * the text.
 *
 * So the contrast is manufactured rather than hoped for: a scrim fading up
 * from the bottom edge guarantees a dark ground under the caption whatever the
 * image behind it. It covers the bottom half only, so the subject stays clear.
 */
export function TileLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/35 to-transparent"
      />
      <span className="relative text-sm font-medium text-white drop-shadow-sm">
        {children}
      </span>
    </>
  )
}
