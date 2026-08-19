import { ModelGridSkeleton, PageSkeleton } from "@/components/layout/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Covers /3d-models and /3d-models/[segment] — a loading boundary wraps its own
 * segment and everything nested under it, so the category pages inherit this.
 * Mirrors the real layout: a category strip and a horizontal filter bar over a
 * full-width grid.
 */
export default function Loading() {
  return (
    <PageSkeleton>
      {/* Category strip */}
      <div className="flex gap-2.5 overflow-hidden pb-1">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-lg" />
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="mt-6">
        <ModelGridSkeleton count={10} />
      </div>
    </PageSkeleton>
  )
}
