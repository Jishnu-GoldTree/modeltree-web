import type { MetadataRoute } from "next"

// Crawlers were walking the faceted catalog's query-string permutations
// (?category=&metal=&page=&sort=…), each an uncacheable per-request SSR hit and
// the single largest driver of Vercel usage. Disallowing query-string URLs stops
// that crawler trap while keeping clean catalog and category/collection paths
// indexable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/*?", // any URL with a query string: facet filters, pagination, sort
        "/api/",
        "/*/dashboard",
        "/*/checkout",
        "/*/cart",
        "/*/favorites",
        "/*/profile",
        "/*/login",
        "/*/signup",
        "/*/forgot-password",
        "/*/reset-password",
      ],
      crawlDelay: 10,
    },
    sitemap: "https://modeltree.vercel.app/sitemap.xml",
  }
}
