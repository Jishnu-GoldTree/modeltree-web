import { notFound } from "next/navigation"

import { supabasePublic } from "@/lib/supabase/public"
import {
  COLLECTION_SEGMENTS,
  queryModels,
  type CatalogQuery,
} from "@/lib/data/catalog"
import { toParams, toQuery } from "@/lib/data/catalog-params"
import { getFavoriteSet } from "@/lib/favorites"
import { FlashToast } from "@/components/layout/flash-toast"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
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
      title: `${category.label} 3D models`,
      description: `Browse ${category.label.toLowerCase()} models, filtered by format and license.`,
      patch: { category: category.slug } satisfies Partial<CatalogQuery>,
      lockedCategory: category.slug,
    }
  }

  const collection = COLLECTION_SEGMENTS[segment]
  if (collection) {
    return { ...collection, lockedCategory: undefined }
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
      <FlashToast />
      <SiteHeader solid />

      <main className="flex-1 pt-16">
        <div className="border-b bg-ink">
          <div className="shell py-10">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {resolved.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              {resolved.description}
            </p>
          </div>
        </div>

        <CatalogView
          base={`/3d-models/${segment}`}
          params={raw}
          result={result}
          lockedCategory={resolved.lockedCategory}
          favorites={favorites}
        />
      </main>

      <SiteFooter />
    </>
  )
}
