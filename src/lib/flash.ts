/**
 * One-shot feedback across a redirect.
 *
 * Cart and favourite actions redirect, so the toast has to survive a navigation.
 * A `?flash=` param is the simplest carrier: it needs no cookie, no store, and
 * it disappears from the URL as soon as it is read.
 *
 * Keys are a closed set so a crafted URL cannot inject arbitrary text into a
 * toast — the param selects a translated message, it never supplies one.
 */
export const FLASH_KEYS = [
  "addedToCart",
  "removedFromCart",
  "cartCleared",
  "saved",
  "unsaved",
  "savedCleared",
  "listingCreated",
  "listingPublished",
  "licenseUpdated",
  "signedOut",
  "requestOpened",
] as const

export type FlashKey = (typeof FLASH_KEYS)[number]

export function isFlashKey(value: unknown): value is FlashKey {
  return typeof value === "string" && (FLASH_KEYS as readonly string[]).includes(value)
}

/** Appends the flash marker to a redirect target. */
export function withFlash(path: string, key: FlashKey) {
  const separator = path.includes("?") ? "&" : "?"
  return `${path}${separator}flash=${key}`
}
