import {
  HeadingSkeleton,
  ModelGridSkeleton,
  PageSkeleton,
  RowsSkeleton,
  StatTilesSkeleton,
} from "@/components/layout/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <PageSkeleton>
      <div className="flex items-center gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>

      <div className="mt-8">
        <StatTilesSkeleton count={3} />
      </div>

      <div className="mt-10 flex flex-col gap-4">
        <HeadingSkeleton />
        <RowsSkeleton count={3} />
      </div>

      <div className="mt-10 flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <ModelGridSkeleton count={4} />
      </div>
    </PageSkeleton>
  )
}
