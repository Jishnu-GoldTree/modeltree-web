"use client"

/**
 * Custom `next/image` loader — bypasses Vercel's metered Image Optimization.
 *
 * Preview images come straight from Cloudflare R2 (free egress) and everything
 * else from /public, so there is no server-side transform for Vercel to charge
 * for. next/image still handles layout, lazy-loading and `sizes`; this only
 * decides the URL it requests, so no `/_next/image` units are ever spent.
 *
 * Presigned R2 URLs are returned untouched: their querystring is part of the
 * SigV4 signature, so appending to it would break the signature. Every other
 * URL gets a `width` hint — harmless today (R2 and /public ignore unknown query
 * params) and the single place to point at a real resizer, e.g. Cloudflare
 * Image Resizing, later without touching any call site. The hint also keeps
 * next/image from warning that the loader ignores `width`.
 */
type LoaderArgs = { src: string; width: number; quality?: number }

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  if (src.includes("X-Amz-Signature")) return src

  const sep = src.includes("?") ? "&" : "?"
  const q = quality ? `&quality=${quality}` : ""
  return `${src}${sep}width=${width}${q}`
}
