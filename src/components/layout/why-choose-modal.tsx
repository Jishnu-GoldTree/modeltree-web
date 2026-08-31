"use client"

import { useTranslations } from "next-intl"
import { Gem, Sparkles } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { dismissWhyChoose } from "@/lib/preferences"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Reason = { title: string; body: string }

/**
 * First-visit "Why choose us?" promo.
 *
 * A proper centred modal rather than the corner prompts: it is a sales pitch
 * meant to be read, not a preference toggle. Shown once — dismissing (close,
 * Esc, overlay, or tapping the Premium CTA) writes the cookie so it never
 * nags a returning visitor. Visibility and sequencing are decided upstream in
 * VisitorPrompts; this component only reflects the `open` it is handed.
 */
export function WhyChooseModal({ open }: { open: boolean }) {
  const t = useTranslations("whyChoose")
  const reasons = t.raw("reasons") as Reason[]

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismissWhyChoose()
      }}
    >
      <DialogContent
        // The shared DialogContent centres with logical `start-1/2`, which
        // lands left-of-centre under RTL (Hebrew is the default locale).
        // Override to physical centring so it's centred in both directions.
        className="flex max-h-[85dvh] flex-col gap-0 p-0 text-start start-auto left-1/2 sm:max-w-lg"
      >
        <DialogHeader className="border-b p-5 pe-12">
          <DialogTitle className="text-lg">{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("intro")}
          </p>

          <div>
            <h3 className="font-heading text-sm font-medium">
              {t("reasonsTitle")}
            </h3>
            <ol className="mt-3 space-y-3">
              {reasons.map((reason, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand-accent tabular-nums">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{reason.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {reason.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Premium pitch — the reason this popup exists. */}
          <div className="rounded-xl border border-brand bg-brand-muted/60 p-4">
            <p className="flex items-center gap-2 font-heading text-sm font-medium text-brand-accent">
              <Sparkles className="size-4 shrink-0" aria-hidden />
              {t("premiumTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("premiumIntro")}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {t("price")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("gift")}
            </p>

            <div className="mt-4 rounded-lg border bg-popover p-3">
              <p className="text-sm font-medium">{t("savingsTitle")}</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>{t("savingsCost")}</li>
                <li>{t("savingsGet")}</li>
              </ul>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("savingsBody")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("closing")}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("closingBody")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("closingCta")}
            </p>
          </div>
        </div>

        <div className="border-t p-4">
          <Button
            asChild
            className="h-11 w-full gap-2 bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/85"
          >
            <Link href="/pricing" onClick={dismissWhyChoose}>
              <Gem className="size-4" aria-hidden />
              {t("cta")}
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
