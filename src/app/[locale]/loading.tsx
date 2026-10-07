import { ModelGridSkeleton, PageSkeleton } from "@/components/layout/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Homepage fallback. The landing sections each read from the catalog at request
 * time (trending, facet counts, featured designer), so a return-to-home hop has
 * something to wait on. A hero band over a row of cards stands in for the top of
 * the page — enough to signal the route arrived without redrawing every section.
 */
export default function Loading() {
  return (
    <PageSkeleton>
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Skeleton className="h-10 w-3/4 max-w-xl" />
        <Skeleton className="h-4 w-2/3 max-w-md" />
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Trending row */}
      <div className="mt-8 flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="mt-6">
        <ModelGridSkeleton count={8} />
      </div>
    </PageSkeleton>
  )
}
