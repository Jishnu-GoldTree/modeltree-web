import Link from "next/link"
import { Building2, CreditCard, FileCheck, Users } from "lucide-react"

import { BUSINESS_PERKS, SITE, TRUSTED_BY } from "@/lib/data/landing"
import { Button } from "@/components/ui/button"

const ICONS = {
  users: Users,
  "credit-card": CreditCard,
  "file-check": FileCheck,
} as const

export function BusinessAccount() {
  return (
    <section className="py-16 sm:py-20">
      <div className="shell">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <Building2 className="size-3.5" aria-hidden />
            Solution for enterprise
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {SITE.name} Business Account
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-pretty text-muted-foreground">
            Every asset needs production-ready, created by verified artists and
            industry experts. Review the models you need instantly, accelerating
            your project timeline from concept to completion.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/business">Apply for a Business Account</Link>
          </Button>
        </div>

        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {BUSINESS_PERKS.map((perk) => {
            const Icon = ICONS[perk.icon]
            return (
              <li key={perk.title} className="rounded-2xl border bg-card p-6">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand/15 text-brand-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold tracking-tight">
                  {perk.title}
                </h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {perk.body}
                </p>
              </li>
            )
          })}
        </ul>

        <div className="mt-14">
          <p className="text-center text-sm text-muted-foreground">
            Trusted by Fortune 500 companies, including:
          </p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {TRUSTED_BY.map((company) => (
              <li
                key={company}
                className="text-lg font-semibold tracking-tight text-muted-foreground/55 grayscale transition-colors hover:text-muted-foreground"
              >
                {company}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
