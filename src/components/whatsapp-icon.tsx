import Image from "next/image"

/**
 * The WhatsApp mark, from the supplied artwork rather than a lucide lookalike:
 * it is a trademark, and the point of putting it on the button is that jewelers
 * recognise the exact glyph without reading the label.
 *
 * `unoptimized` because the image optimizer refuses SVG unless
 * `dangerouslyAllowSVG` is set, and turning that on for one local file would
 * relax the rule for every remote host in `remotePatterns`.
 */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/svgs/whatsapp.svg"
      alt=""
      width={20}
      height={20}
      unoptimized
      aria-hidden
      className={className}
    />
  )
}
