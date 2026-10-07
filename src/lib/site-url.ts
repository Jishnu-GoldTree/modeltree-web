/**
 * The canonical public origin: share cards, canonical/hreflang links, the
 * sitemap and robots.txt all resolve against it.
 *
 * It was hardcoded to modeltree.vercel.app, so every page told crawlers its
 * real home (and its og:image) was the Vercel alias rather than the domain
 * buyers use. `NEXT_PUBLIC_SITE_URL` overrides it per environment.
 */
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.modeltree.co.il"
).replace(/\/$/, "")
