import type { MetadataRoute } from "next"

import {
  COLLECTION_SEGMENTS,
  allCategorySlugs,
  allDesignerHandles,
  allModelSitemapEntries,
} from "@/lib/data/catalog"

// robots.ts disallows every query-string URL, which is the whole faceted
// catalog crawlers used to walk. That trap is closed, but it also removed the
// path crawlers discovered clean product/category/designer pages through — so
// this sitemap hands them the canonical set directly. Kept in sync with
// published content by regenerating hourly (see `revalidate`), which also caps
// the cost: the DB reads below run at most once an hour, not per request.
export const revalidate = 3600

const ORIGIN = "https://modeltree.vercel.app"

// Hebrew is the default locale and lives at the root; English is prefixed
// (`localePrefix: "as-needed"`). Each entry is canonicalised to the Hebrew URL
// with an hreflang alternate for the English one, matching the layout's
// `alternates.languages` so Google treats them as translations, not duplicates.
function entry(
  path: string,
  opts: {
    lastModified?: string | Date
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"]
    priority?: number
  } = {},
): MetadataRoute.Sitemap[number] {
  const suffix = path === "/" ? "" : path
  const he = `${ORIGIN}${suffix}`
  const en = `${ORIGIN}/en${suffix}`
  return {
    url: he,
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages: { he, en } },
  }
}

// Public, indexable pages only. Authed/commerce routes (dashboard, checkout,
// cart, favorites, profile, auth, requests) are intentionally excluded — they
// are also disallowed in robots.ts.
const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/3d-models", changeFrequency: "daily", priority: 0.9 },
  { path: "/designers", changeFrequency: "weekly", priority: 0.6 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.5 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.4 },
  { path: "/custom-work", changeFrequency: "monthly", priority: 0.5 },
  { path: "/sell", changeFrequency: "monthly", priority: 0.5 },
  { path: "/licensing", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.3 },
  { path: "/refunds", changeFrequency: "yearly", priority: 0.3 },
  { path: "/delivery", changeFrequency: "yearly", priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [models, categories, designers] = await Promise.all([
    allModelSitemapEntries(),
    allCategorySlugs(),
    allDesignerHandles(),
  ])

  const staticEntries = STATIC_PATHS.map((s) =>
    entry(s.path, { changeFrequency: s.changeFrequency, priority: s.priority }),
  )

  const segmentEntries = [...categories, ...Object.keys(COLLECTION_SEGMENTS)].map((segment) =>
    entry(`/3d-models/${segment}`, { changeFrequency: "weekly", priority: 0.8 }),
  )

  const modelEntries = models.map((m) =>
    entry(`/3d-model/${m.slug}`, {
      lastModified: m.publishedAt ? new Date(m.publishedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  )

  const designerEntries = designers.map((handle) =>
    entry(`/designers/${handle}`, { changeFrequency: "weekly", priority: 0.6 }),
  )

  return [...staticEntries, ...segmentEntries, ...modelEntries, ...designerEntries]
}
