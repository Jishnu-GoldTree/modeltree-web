import Link from "next/link"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PromoBanner() {
  // The negative top margin lifts this card onto the hero's dark base.
  return (
    <section className="shell -mt-12 pb-16 sm:pb-20">
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(at 90% 20%, oklch(0.93 0.05 300) 0px, transparent 55%), radial-gradient(at 10% 90%, oklch(0.95 0.04 200) 0px, transparent 50%)",
          }}
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand-accent">
              <Sparkles className="size-3.5" aria-hidden />
              Subscription
            </span>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-balance sm:text-2xl">
              Get up to 25 premium 3D models every month for the price of one
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Unlimited downloads from the subscription catalog. Cancel any
              time — your licenses stay yours forever.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-brand text-brand-foreground hover:bg-brand/85"
              >
                <Link href="/pricing">Unlock 25 premium downloads</Link>
              </Button>
              <Link
                href="/pricing#compare"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Compare plans
              </Link>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border bg-background/70 p-5 backdrop-blur">
            <p className="text-xs text-muted-foreground">Get as low as</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              $2.36
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / model
              </span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Billed annually at $59/mo
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
