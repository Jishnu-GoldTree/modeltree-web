import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"

import { Logo } from "@/components/layout/logo"
import { Thumb } from "@/components/marketplace/thumb"
import { SignupForm } from "@/components/forms/signup-form"
import { enabledProviders } from "@/auth"

export const metadata = { title: "Create an account" }

/**
 * Mirrors /login: same split layout and same reasons for dropping the site
 * nav. The brand panel sells the seller side, since that's the side that needs
 * convincing — buyers can browse without an account at all.
 */

const BENEFITS = [
  "Publish unlimited models and keep up to 80% of every sale",
  "Reach 200,000+ studios and buyers already on the platform",
  "Licensing, invoicing and payouts handled for you",
]

export default function SignupPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-white lg:flex">
        <Thumb
          seed="modeltree-signup"
          className="absolute inset-0 opacity-35 blur-[1px]"
        />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Turn your 3D work into revenue
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 text-sm text-white/80"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative max-w-md text-sm text-white/60">
          Free to join. No listing fees, no subscription — you only pay a
          commission when a model sells.
        </p>
      </aside>

      <div className="flex flex-col px-4 py-8 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Logo tone="dark" />
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to marketplace
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
            One account to buy, license and sell 3D models.
          </p>

          <SignupForm enabledProviders={enabledProviders} />
        </div>
      </div>
    </main>
  )
}
