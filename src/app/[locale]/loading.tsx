import { ModelGridSkeleton, PageSkeleton } from "@/components/layout/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Homepage fallback, drawn to the same layout as the page: the cream hero with
 * copy and search beside the 2×2 render grid, the trust bar, the category
 * tiles and the popular-models grid. Content lands where its placeholder sat
 * instead of reflowing the page.
 */
export default function Loading() {
  return (
    <PageSkeleton flush>
      <section className="bg-cream">
        <div className="shell grid items-center gap-10 py-12 sm:py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:py-20">
          <div className="max-w-xl">
            <Skeleton className="h-3 w-48 bg-foreground/8" />
            <Skeleton className="mt-5 h-11 w-4/5 bg-foreground/8 sm:h-13" />
            <Skeleton className="mt-3 h-11 w-3/5 bg-foreground/8 sm:h-13" />
            <div className="mt-6 flex flex-col gap-2.5">
              <Skeleton className="h-4 w-full bg-foreground/8" />
              <Skeleton className="h-4 w-11/12 bg-foreground/8" />
              <Skeleton className="h-4 w-2/5 bg-foreground/8" />
            </div>
            <Skeleton className="mt-8 h-14 rounded-lg border border-brand bg-background ring-3 ring-brand/30" />
            <div className="mt-4 flex gap-2">
              {["w-36", "w-16", "w-28"].map((w) => (
                <Skeleton key={w} className={`h-7 rounded-full bg-foreground/8 ${w}`} />
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <Skeleton className="h-11 w-44 bg-brand/25" />
              <Skeleton className="h-11 w-40 bg-foreground/8" />
            </div>
          </div>
          <ul className="hidden grid-cols-2 gap-2.5 md:grid lg:gap-3">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className={i % 2 === 1 ? "translate-y-6 lg:translate-y-8" : undefined}>
                <Skeleton className="aspect-4/5 rounded-2xl bg-foreground/6" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="border-b">
        <ul className="shell grid grid-cols-2 gap-4 py-5 sm:gap-6 sm:py-7 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex items-start gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="hidden h-3.5 w-full sm:block" />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="shell flex flex-col gap-16 py-16 sm:gap-20 sm:py-20">
        <div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                className={`aspect-4/3 rounded-2xl ${i === 0 ? "col-span-2 md:col-span-1" : ""}`}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="mt-6">
            <ModelGridSkeleton count={8} />
          </div>
        </div>
      </div>
    </PageSkeleton>
  )
}
