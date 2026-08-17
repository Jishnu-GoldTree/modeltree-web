/**
 * The contract between the proxy, which learns the visitor's country from
 * Vercel's edge, and the client code that acts on it. Kept free of DOM and of
 * `"use client"` so importing it into the proxy does not drag React along.
 */
export const COUNTRY_HEADER = "x-vercel-ip-country"

export const COUNTRY_COOKIE = "mt_country"

/** ISO 3166-1 alpha-2, the format the header uses. */
export const ISRAEL = "IL"
