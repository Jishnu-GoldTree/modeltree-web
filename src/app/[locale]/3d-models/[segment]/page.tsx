import { notFound } from "next/navigation"

import { supabasePublic } from "@/lib/supabase/public"
import {
  COLLECTION_SEGMENTS,
  queryModels,
  type CatalogQuery,
} from "@/lib/data/catalog"
import { toParams, toQuery } from "@/lib/data/catalog-params"
import { getFavoriteSet } from "@/lib/favorites"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { getTranslations } from "next-intl/server"
import { CatalogView } from "@/components/marketplace/catalog-view"

/**
 * One segment under /3d-models serves two things the nav already links:
 * real categories (/3d-models/car) and named collections that are really
 * saved filters (/3d-models/free, /low-poly, /rigged, /scanned).
 *
 * Model detail deliberately does NOT live here — it's /3d-model/[slug],
 * singular. Sharing this segment would make /3d-models/car ambiguous between
 * the Car category and a model slugged "car".
 */

async function resolve(segment: string) {
  const t = await getTranslations("segment")
  const cat = await getTranslations("landing")
  // Categories come from the database, not the hardcoded ASSET_CATEGORIES list:
  // that list held only asset categories, so /3d-models/jewelry 404'd even
  // though the category exists — and jewellery is the client's core inventory.
  const { data: category } = await supabasePublic
    .from("categories")
    .select("slug, label")
    .eq("slug", segment)
    .maybeSingle()

  if (category) {
    return {
      // Category labels live in the message catalog, keyed by slug: the DB
      // column holds English only, which used to render "מודלים: Engagement
      // rings" on the Hebrew site.
      title: t("title", { category: cat(`categories.${category.slug}`) }),
      description: t("description", {
        category: cat(`categories.${category.slug}`),
      }),
      patch: { category: category.slug } satisfies Partial<CatalogQuery>,
      lockedCategory: category.slug,
    }
  }

  const collection = COLLECTION_SEGMENTS[segment]
  if (collection) {
    return {
      title: t(segment),
      description: t(`${segment}Description`),
      patch: collection.patch,
      lockedCategory: undefined,
    }
  }

  return null
}

export async function generateStaticParams() {
  const { data } = await supabasePublic.from("categories").select("slug")
  return [
    ...(data ?? []).map((c) => ({ segment: c.slug })),
    ...Object.keys(COLLECTION_SEGMENTS).map((segment) => ({ segment })),
  ]
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/3d-models/[segment]">) {
  const { segment } = await params
  const resolved = await resolve(segment)
  if (!resolved) return { title: "Not found" }
  return { title: resolved.title, description: resolved.description }
}

export default async function SegmentPage({
  params,
  searchParams,
}: PageProps<"/[locale]/3d-models/[segment]">) {
  const { segment } = await params
  const resolved = await resolve(segment)
  if (!resolved) notFound()

  const raw = toParams(await searchParams)
  const result = await queryModels({ ...toQuery(raw), ...resolved.patch })
  const favorites = await getFavoriteSet()

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="flex-1 pt-26">
        <CatalogView
          base={`/3d-models/${segment}`}
          params={raw}
          patch={resolved.patch}
          result={result}
          lockedCategory={resolved.lockedCategory}
          favorites={favorites}
          title={resolved.title}
          description={resolved.description}
        />
      </main>

      <SiteFooter />
    </>
  )
}
