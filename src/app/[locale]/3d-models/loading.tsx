import { PageSkeleton } from "@/components/layout/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { CatalogResultsSkeleton } from "@/components/marketplace/catalog-view"

/**
 * Covers /3d-models and /3d-models/[segment] — a loading boundary wraps its own
 * segment and everything nested under it, so the category pages inherit this.
 * Mirrors the real layout: breadcrumb and title, then the category tabs, the
 * filter bar and the grid.
 */
export default function Loading() {
  return (
    <PageSkeleton flush>
      <div className="shell flex flex-col gap-3 pt-8 pb-6">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <CatalogResultsSkeleton />
    </PageSkeleton>
  )
}
