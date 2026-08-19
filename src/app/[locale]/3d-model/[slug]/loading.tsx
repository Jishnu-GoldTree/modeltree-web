import { ModelGridSkeleton, PageSkeleton } from "@/components/layout/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Detail is the slowest hop in the browse flow — getModel, images, related,
 * reviews and licence options all run before it can paint. This mirrors its
 * two-column layout (gallery beside a 24rem purchase panel) so the real content
 * lands where the placeholder sat.
 */
export default function Loading() {
  return (
    <PageSkeleton>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        {/* Gallery + details */}
        <div className="flex flex-col gap-4">
          <Skeleton className="aspect-4/3 w-full rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-20 rounded-lg" />
            ))}
          </div>

          <Skeleton className="mt-4 h-7 w-2/3" />
          <Skeleton className="h-4 w-40" />

          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Purchase panel */}
        <div className="flex flex-col gap-4 rounded-2xl border p-5">
          <Skeleton className="h-8 w-32" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>

      {/* Related */}
      <div className="mt-14">
        <Skeleton className="h-6 w-48" />
        <div className="mt-6">
          <ModelGridSkeleton count={4} />
        </div>
      </div>
    </PageSkeleton>
  )
}
