import {
  HeadingSkeleton,
  ModelGridSkeleton,
  PageSkeleton,
} from "@/components/layout/page-skeleton"

export default function Loading() {
  return (
    <PageSkeleton>
      <HeadingSkeleton />
      <div className="mt-8">
        <ModelGridSkeleton count={8} />
      </div>
    </PageSkeleton>
  )
}
