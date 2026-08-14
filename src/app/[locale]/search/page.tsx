import { SearchX } from "lucide-react"

import { getTranslations } from "next-intl/server"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { SearchForm } from "@/components/forms/search-form"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/search">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "searchPage" })
  return { title: t("title") }
}

/**
 * Placeholder search results page — exists so the landing page's search form
 * lands somewhere real. Replace the body once the catalog API is available.
 */
export default async function SearchPage({ searchParams }: PageProps<"/[locale]/search">) {
  const t = await getTranslations("searchPage")
  const { q } = await searchParams
  const query = typeof q === "string" ? q : ""

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="flex-1 bg-ink pt-16">
        <div className="shell py-16">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {query ? t("results", { query }) : t("title")}
          </h1>
          <div className="mt-6 max-w-2xl">
            <SearchForm />
          </div>
        </div>
      </main>

      <section className="shell flex flex-col items-center py-24 text-center">
        <SearchX className="size-8 text-muted-foreground" aria-hidden />
        <h2 className="mt-4 font-semibold">{t("stubTitle")}</h2>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
          {t("stubBody")}
        </p>
      </section>

      <SiteFooter />
    </>
  )
}
