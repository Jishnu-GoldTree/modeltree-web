import Link from "next/link"

import { ASSET_CATEGORIES } from "@/lib/data/landing"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { SearchForm } from "@/components/forms/search-form"
import { Thumb } from "@/components/marketplace/thumb"
import { Button } from "@/components/ui/button"

/**
 * Site-wide 404. Next renders this for any unmatched URL and for any segment
 * that calls `notFound()`, wrapped in the root layout — so it composes the same
 * header and footer every other page does.
 *
 * A dead end is a bad place to leave a shopper, so the page doubles as a way
 * back in: search first, then the top categories.
 */

const SUGGESTED = ASSET_CATEGORIES.slice(0, 4)

export default function NotFound() {
  return (
    <>
      <SiteHeader />

      {/* pt-16 clears the fixed header, matching the other routes. */}
      <main className="flex-1 bg-ink pt-16">
        <section className="shell flex flex-col items-center py-20 text-center md:py-28">
          <p className="font-mono text-xs tracking-[0.3em] text-brand uppercase">
            Error 404
          </p>

          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            This model isn&apos;t in the catalog
          </h1>

          <p className="mt-4 max-w-xl text-white/65">
            The page you were looking for was moved, renamed, or never existed.
            Search the catalog instead, or pick up from one of the categories
            below.
          </p>

          <div className="mt-9 w-full max-w-xl">
            <SearchForm />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/">Back to home</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/3d-models">Browse 3D models</Link>
            </Button>
          </div>
        </section>
      </main>

      <section className="shell py-16">
        <h2 className="text-lg font-semibold tracking-tight">
          Popular categories
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SUGGESTED.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/3d-models/${category.slug}`}
                className="group block overflow-hidden rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
              >
                <Thumb
                  seed={category.seed}
                  src={category.cover}
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className="flex aspect-4/3 items-end p-3 transition-transform duration-300 group-hover:scale-[1.03]"
                >
                  <div className="relative flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white drop-shadow">
                      {category.label}
                    </span>
                    <span className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-white/85 backdrop-blur">
                      {category.count}
                    </span>
                  </div>
                </Thumb>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </>
  )
}
