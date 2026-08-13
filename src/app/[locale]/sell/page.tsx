import Link from "next/link"
import { Check, Coins, Globe, Upload } from "lucide-react"

import { getCurrentUser } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Thumb } from "@/components/marketplace/thumb"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Sell your 3D models",
  description:
    "Publish your 3D models on ModelTree and keep up to 80% of every sale. No listing fees, no subscription.",
}

const STEPS = [
  {
    Icon: Upload,
    title: "Upload your files",
    body: "Drop in the formats you already export. We generate previews and check the mesh before it goes live.",
  },
  {
    Icon: Globe,
    title: "Reach 200,000+ buyers",
    body: "Studios, architects and product teams browse the catalog every day. Your listing appears the moment it passes review.",
  },
  {
    Icon: Coins,
    title: "Get paid monthly",
    body: "Keep up to 80% of every sale. Licensing, invoicing and payouts are handled for you.",
  },
]

const TERMS = [
  "No listing fees and no subscription — you pay a commission only when a model sells",
  "Keep publishing elsewhere; nothing here is exclusive",
  "Set your own price, or give a model away to build an audience",
  "Withdraw once your balance passes $50",
]

export default async function SellPage() {
  const user = await getCurrentUser()

  return (
    <>
      <SiteHeader solid />

      <main className="flex-1 pt-16">
        <section className="relative overflow-hidden border-b bg-ink">
          <Thumb seed="sell-hero" className="absolute inset-0 opacity-30 blur-[1px]" />
          <div className="shell relative py-16 md:py-24">
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
              Turn the models you&apos;ve already made into income
            </h1>
            <p className="mt-4 max-w-xl text-white/70">
              Publish once and sell as many times as you like. ModelTree handles
              licensing, invoicing and payouts so you can stay in your DCC.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-11 bg-brand px-6 text-brand-foreground hover:bg-brand/85">
                {/* Sends you where you can actually act: the upload form if you
                    already have an account, signup if you don't. */}
                <Link href={user ? "/dashboard/upload" : "/signup"}>
                  {user ? "Upload a model" : "Start selling"}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 border-white/25 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/3d-models">See what sells</Link>
              </Button>
            </div>

            <dl className="mt-12 flex flex-wrap gap-x-12 gap-y-6">
              {[
                { value: "80%", label: "Your share of each sale" },
                { value: "200K+", label: "Buyers on the platform" },
                { value: "$0", label: "To list a model" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-3xl font-semibold tracking-tight text-white">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-sm text-white/60">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="shell py-16">
          <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-xl border p-6">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-muted text-brand-accent">
                  <step.Icon className="size-4" aria-hidden />
                </span>
                <h3 className="mt-4 font-medium">
                  <span className="text-muted-foreground tabular-nums">{i + 1}. </span>
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t bg-muted/30 py-16">
          <div className="shell grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">The terms, plainly</h2>
              <ul className="mt-6 flex flex-col gap-3">
                {TERMS.map((term) => (
                  <li key={term} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-accent" aria-hidden />
                    {term}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-background p-6">
              <h3 className="font-medium">What a sale looks like</h3>
              <dl className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Buyer pays</dt>
                  <dd className="tabular-nums">$100</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Platform commission</dt>
                  <dd className="tabular-nums">−$20</dd>
                </div>
                <div className="flex justify-between gap-4 border-t pt-2 font-medium">
                  <dt>You receive</dt>
                  <dd className="tabular-nums">$80</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                Paid out monthly once your balance passes $50. Every sale carries
                an invoice you can download.
              </p>
              <Button asChild className="mt-6 h-10 w-full bg-brand text-brand-foreground hover:bg-brand/85">
                <Link href={user ? "/dashboard/upload" : "/signup"}>
                  {user ? "Upload a model" : "Create a designer account"}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
