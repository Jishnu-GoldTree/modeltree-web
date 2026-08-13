import { getTranslations } from "next-intl/server"

import { SiteHeader } from "@/components/layout/site-header"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Shared frame for route-level `loading.tsx` fallbacks.
 *
 * Every page renders its own header and footer rather than inheriting them from
 * the layout, so a fallback that showed only a spinner would blank the site
 * chrome on each navigation. `SiteHeader` is a client component with no data of
 * its own, which is what makes it safe to paint here: the fallback stays
 * instant instead of waiting on the same queries the page is waiting on.
 *
 * The footer is deliberately left out — its height varies with content, and
 * anchoring it under a short skeleton only to push it down a moment later is
 * worse than not drawing it at all.
 */
export async function PageSkeleton({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common")

  return (
    <>
      <SiteHeader solid />
      <main className="flex-1 pt-16">
        {/* One live region for the whole fallback. Screen readers announce
            "Loading" once; the shapes below are decorative and stay silent. */}
        <p role="status" className="sr-only">
          {t("loading")}
        </p>
        <div aria-hidden className="shell py-10">
          {children}
        </div>
      </main>
    </>
  )
}

/** Page title plus a line of supporting text. */
export function HeadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-72" />
    </div>
  )
}

/**
 * Matches ModelCard: a 4:3 thumbnail over a title, author line and price row.
 * Same column counts as the real grids, so the content lands where the
 * placeholder sat instead of reflowing.
 */
export function ModelGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex flex-col overflow-hidden rounded-xl border">
          <Skeleton className="aspect-4/3 rounded-none" />
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-3 w-1/2" />
            <div className="mt-1 flex items-center justify-between">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** The row of summary figures used on the profile and dashboard screens. */
export function StatTilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

/** Stacked full-width rows — order history, cart lines, listing tables. */
export function RowsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border p-4">
          <Skeleton className="size-16 shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
      ))}
    </div>
  )
}
