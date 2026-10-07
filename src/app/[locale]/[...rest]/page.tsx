import { notFound } from "next/navigation"

/**
 * Catch-all inside the locale segment.
 *
 * Without it an unmatched path never enters `[locale]`, so Next falls back to
 * the bare root not-found instead of the branded, translated one — /he/nope
 * rendered an English stub. This routes every miss into `[locale]/not-found`.
 */
export default function CatchAllNotFound() {
  notFound()
}
