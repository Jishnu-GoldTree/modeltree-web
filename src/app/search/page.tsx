import { SearchX } from "lucide-react"

import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { SearchForm } from "@/components/forms/search-form"

export const metadata = { title: "Search" }

/**
 * Placeholder search results page — exists so the landing page's search form
 * lands somewhere real. Replace the body once the catalog API is available.
 */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams
  const query = typeof q === "string" ? q : ""

  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-ink pt-16">
        <div className="shell py-16">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {query ? `Results for "${query}"` : "Search 3D models"}
          </h1>
          <div className="mt-6 max-w-2xl">
            <SearchForm />
          </div>
        </div>
      </main>

      <section className="shell flex flex-col items-center py-24 text-center">
        <SearchX className="size-8 text-muted-foreground" aria-hidden />
        <h2 className="mt-4 font-semibold">Catalog search isn&apos;t wired up yet</h2>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
          The landing page is done; this route is a stub so search has a
          destination. Results land here once the catalog API exists.
        </p>
      </section>

      <SiteFooter />
    </>
  )
}
