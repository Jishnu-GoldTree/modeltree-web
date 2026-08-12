import { notFound } from "next/navigation"

import { ASSET_CATEGORIES } from "@/lib/data/landing"
import {
  COLLECTION_SEGMENTS,
  queryModels,
  type CatalogQuery,
} from "@/lib/data/catalog"
import { toParams, toQuery } from "@/lib/data/catalog-params"
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

function resolve(segment: string) {
  const category = ASSET_CATEGORIES.find((c) => c.slug === segment)
  if (category) {
    return {
      title: `${category.label} 3D models`,
      description: `Browse ${category.count} ${category.label.toLowerCase()} models, filtered by format and license.`,
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

export function generateStaticParams() {
  return [
    ...ASSET_CATEGORIES.map((c) => ({ segment: c.slug })),
    ...Object.keys(COLLECTION_SEGMENTS).map((segment) => ({ segment })),
  ]
}

export async function generateMetadata({
  params,
}: PageProps<"/3d-models/[segment]">) {
  const { segment } = await params
  const resolved = resolve(segment)
  if (!resolved) return { title: "Not found" }
  return { title: resolved.title, description: resolved.description }
}

export default async function SegmentPage({
  params,
  searchParams,
}: PageProps<"/3d-models/[segment]">) {
  const { segment } = await params
  const resolved = resolve(segment)
  if (!resolved) notFound()

  const raw = toParams(await searchParams)
  const result = queryModels({ ...toQuery(raw), ...resolved.patch })

  return (
    <>
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
        />
      </main>

      <SiteFooter />
    </>
  )
}
