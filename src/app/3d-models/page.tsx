import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { CatalogView } from "@/components/marketplace/catalog-view"
import { queryModels } from "@/lib/data/catalog"
import { toParams, toQuery } from "@/lib/data/catalog-params"
import { getFavoriteSet } from "@/lib/favorites"

export const metadata = {
  title: "3D models",
  description:
    "Browse royalty-free 3D models by category, file format and license.",
}

export default async function ModelsPage({ searchParams }: PageProps<"/3d-models">) {
  const params = toParams(await searchParams)
  const result = queryModels(toQuery(params))
  const favorites = await getFavoriteSet()

  return (
    <>
      <SiteHeader solid />

      <main className="flex-1 pt-16">
        <div className="border-b bg-ink">
          <div className="shell py-10">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              3D models
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Royalty-free assets for games, film, architecture and product
              visualisation — filter by category, format and license.
            </p>
          </div>
        </div>

        <CatalogView
          base="/3d-models"
          params={params}
          result={result}
          favorites={favorites}
        />
      </main>

      <SiteFooter />
    </>
  )
}
