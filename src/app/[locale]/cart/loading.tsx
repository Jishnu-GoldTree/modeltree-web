import { PageSkeleton, RowsSkeleton } from "@/components/layout/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <PageSkeleton>
      <Skeleton className="h-8 w-32" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <RowsSkeleton count={3} />

        <div className="flex flex-col gap-3 rounded-xl border p-5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-3 h-10 w-full rounded-lg" />
        </div>
      </div>
    </PageSkeleton>
  )
}
