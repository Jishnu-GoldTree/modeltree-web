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
