import type { MetadataRoute } from "next"
import { SITE_ORIGIN } from "@/lib/site-url"

// Crawlers were walking the faceted catalog's query-string permutations
// (?category=&metal=&page=&sort=…). Public reads are cached, but every new
// combination still needs a first DB read. Blocking these URLs limits that
// crawl space for compliant crawlers while leaving clean catalog paths open.
// Keep this root handler excluded from the locale proxy in src/proxy.ts.
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
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  }
}
