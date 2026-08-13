import {
  HeadingSkeleton,
  PageSkeleton,
  RowsSkeleton,
  StatTilesSkeleton,
} from "@/components/layout/page-skeleton"

export default function Loading() {
  return (
    <PageSkeleton>
      <HeadingSkeleton />

      <div className="mt-8">
        <StatTilesSkeleton />
      </div>

      <div className="mt-10">
        <RowsSkeleton count={5} />
      </div>
    </PageSkeleton>
  )
}
