import { HeadingSkeleton, PageSkeleton } from "@/components/layout/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <PageSkeleton>
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <HeadingSkeleton />

        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}

        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </PageSkeleton>
  )
}
