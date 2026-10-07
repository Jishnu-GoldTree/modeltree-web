/**
 * Stand-in product photography.
 *
 * Temporary: three ring renders stored in public/, used for every model so the
 * catalog and product page stop showing generated placeholder art. Replace with
 * real per-model previews when the R2 upload pipeline lands — at that point
 * these call sites should read a `cover`/`previews` column instead.
 */
export const TEMP_PREVIEWS = [
  "/images/temp-prod/ring-temp-1.png",
  "/images/temp-prod/ring-temp-2.png",
  "/images/temp-prod/ring-temp-3.png",
] as const

/**
 * Picks one deterministically from a slug, so a model keeps the same cover on
 * every render and across server and client — Math.random would flicker on
 * hydration and change on every navigation.
 */
export function tempPreview(key: string) {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return TEMP_PREVIEWS[hash % TEMP_PREVIEWS.length]
}

/** The full set for a model's gallery, led by that model's own cover. */
export function tempGallery(key: string) {
  const lead = tempPreview(key)
  return [lead, ...TEMP_PREVIEWS.filter((p) => p !== lead)]
}
