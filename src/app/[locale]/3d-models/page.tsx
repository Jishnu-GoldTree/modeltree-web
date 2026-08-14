import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { CatalogView } from "@/components/marketplace/catalog-view"
import { queryModels } from "@/lib/data/catalog"
import { toParams, toQuery } from "@/lib/data/catalog-params"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { getFavoriteSet } from "@/lib/favorites"

export async function generateMetadata({ params }: PageProps<"/[locale]/3d-models">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "catalog" })
  return { title: t("title"), description: t("description") }
}

export default async function ModelsPage({
  params: routeParams,
  searchParams,
}: PageProps<"/[locale]/3d-models">) {
  const { locale } = await routeParams
  // Lets this page prerender per locale instead of going dynamic the moment a
  // translation is read.
  setRequestLocale(locale)
  const t = await getTranslations("catalog")

  const params = toParams(await searchParams)
  const result = await queryModels(toQuery(params))
  const favorites = await getFavoriteSet()

  return (
    <>
      <SiteHeader solid />

      <main id="main-content" className="flex-1 pt-16">
        <div className="border-b bg-ink">
          <div className="shell py-10">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              {t("description")}
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
