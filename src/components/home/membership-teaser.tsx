import { getTranslations } from "next-intl/server"
import { Check, Sparkles } from "lucide-react"

import { Link } from "@/i18n/navigation"

/**
 * The client's ₪55 monthly membership: two models a month.
 *
 * It can't be bought yet — recurring billing isn't built — so the card says
 * so instead of sending people into a sign-up that can't charge them. When
 * PayPlus recurring payments land, swap the "Coming soon" pill for a real
 * subscribe button and point it at checkout.
 */
export async function MembershipTeaser() {
  const t = await getTranslations("promo")
  const home = await getTranslations("home.membership")

  return (
    <section className="shell">
      <div className="flex flex-col gap-6 rounded-3xl border border-brand/20 bg-brand-muted/60 p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-medium text-brand-foreground">
            <Sparkles className="size-3.5" aria-hidden />
            {t("badge")}
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance">{t("title")}</h2>
          <p className="mt-2 text-sm text-pretty text-muted-foreground sm:text-base">{t("body")}</p>
          <Link href="/pricing" className="mt-4 inline-block text-sm font-medium text-brand-accent hover:underline">
            {t("cta")}
          </Link>
        </div>

        <div className="shrink-0 rounded-2xl bg-ink p-6 text-ink-foreground sm:min-w-64">
          <p className="text-xs text-white/60">{t("priceLabel")}</p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">₪55</span>
            <span className="text-sm text-white/60">{t("perMonth")}</span>
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-white/75">
            <Check className="size-3.5 text-brand-on-ink" aria-hidden />
            {t("included")}
          </p>
          <p className="mt-5 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/85">
            {home("comingSoon")}
          </p>
        </div>
      </div>
    </section>
  )
}
