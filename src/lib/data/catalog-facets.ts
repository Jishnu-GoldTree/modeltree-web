/**
 * Facet vocabularies shared by client and server.
 *
 * Split from `catalog.ts` so client components can pull the enums without
 * dragging the server-only query layer (Supabase + R2 presign) into the
 * client bundle. `catalog.ts` re-exports these for its own callers, so
 * server-side imports stay unchanged.
 */

/**
 * Jewellery facets. These replaced rigged/animated/pbr, which are game-asset
 * properties: jewellery is dense static geometry, so those filtered nothing.
 * What a jeweler narrows by is metal, stone and how the piece is produced.
 */
export const METALS = [
  "yellow-gold", "white-gold", "rose-gold", "platinum", "silver", "unspecified",
] as const
export const STONES = [
  "round", "princess", "oval", "emerald", "pear", "marquise", "cushion", "none",
] as const
export const PRODUCTION = ["cast", "print", "both"] as const

export type Metal = (typeof METALS)[number]
export type Stone = (typeof STONES)[number]
export type Production = (typeof PRODUCTION)[number]

/**
 * Deliverable formats, named by extension throughout — never by the
 * application that writes them. 3DM rather than "Rhino", MAX rather than
 * "3ds Max": a jeweler asks a supplier for a file, not for a licence.
 */
export const FORMATS = [
  { value: "stl", label: "STL" },
  { value: "obj", label: "OBJ" },
  { value: "fbx", label: "FBX" },
  { value: "3dm", label: "3DM" },
  { value: "3mf", label: "3MF" },
  { value: "step", label: "STEP" },
  { value: "max", label: "MAX" },
] as const

/**
 * Keyword tags for search discovery. Shared here (not in the server-only query
 * layer) so the listing form can normalise a chip the same way the action does
 * — the server stays the authority, but matching the rules client-side means a
 * designer sees the tag they'll actually get.
 */
export const MAX_TAGS = 12
export const MAX_TAG_LENGTH = 30

/**
 * Canonical form of a single tag: unicode-normalised, stripped of anything but
 * letters/numbers/space/hyphen (keeps tags URL-safe as `?tag=` links and out of
 * the way of PostgREST's filter grammar), whitespace-collapsed, lowercased and
 * length-capped. Hebrew has no case, so lowercasing is a no-op there.
 */
export function normalizeTag(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, MAX_TAG_LENGTH)
}

/** Normalises, drops empties, de-duplicates and caps the list at MAX_TAGS. */
export function normalizeTags(raw: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const candidate of raw) {
    const tag = normalizeTag(candidate)
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    out.push(tag)
    if (out.length >= MAX_TAGS) break
  }
  return out
}
