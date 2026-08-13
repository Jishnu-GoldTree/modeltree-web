import { ModelGridSkeleton, PageSkeleton } from "@/components/layout/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Covers /3d-models and /3d-models/[segment] — a loading boundary wraps its own
 * segment and everything nested under it, so the category pages inherit this.
 */
export default function Loading() {
  return (
    <PageSkeleton>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="mt-8 flex gap-8">
        {/* Mirrors the real filter rail: w-60, hidden below lg. */}
        <aside className="hidden w-60 shrink-0 flex-col gap-6 lg:flex">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          ))}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-40 rounded-lg" />
          </div>
          <ModelGridSkeleton count={12} />
        </div>
      </div>
    </PageSkeleton>
  )
}
