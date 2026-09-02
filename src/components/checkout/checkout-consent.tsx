"use client"

import { useState } from "react"
import { Info, Lock } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

/**
 * Checkout consent gate.
 *
 * A payment-processor review requires the buyer to actively accept the Terms
 * and see the Refund/Privacy links before paying. The pay button stays disabled
 * until the box is ticked, and the policy links are right next to it. The actual
 * charge is handed to the payment provider once it is connected; until then the
 * button surfaces the pending notice rather than pretending to take money.
 */
export function CheckoutConsent() {
  const t = useTranslations("checkout")
  const [agreed, setAgreed] = useState(false)
  const [showPending, setShowPending] = useState(false)

  return (
    <div className="mt-5 border-t pt-5">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="checkout-terms"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked)
            if (e.target.checked) setShowPending(false)
          }}
          className="mt-0.5 size-4 rounded border-input accent-brand"
        />
        <Label
          htmlFor="checkout-terms"
          className="text-xs leading-snug font-normal text-muted-foreground"
        >
          {t.rich("agreeLabel", {
            terms: (chunks) => (
              <Link href="/terms" className="text-brand-accent hover:underline">
                {chunks}
              </Link>
            ),
            refunds: (chunks) => (
              <Link
                href="/refunds"
                className="text-brand-accent hover:underline"
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href="/privacy"
                className="text-brand-accent hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </Label>
      </div>

      <Button
        type="button"
        onClick={() => {
          if (!agreed) return
          setShowPending(true)
        }}
        disabled={!agreed}
        className="mt-4 h-10 w-full bg-brand text-brand-foreground hover:bg-brand/85 disabled:opacity-60"
      >
        <Lock className="size-4" aria-hidden />
        {t("payNow")}
      </Button>

      {showPending && (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground"
        >
          <Info className="mt-px size-4 shrink-0" aria-hidden />
          {t("pendingBody")}
        </p>
      )}

      <p className="mt-4 text-xs text-muted-foreground">{t("secureNote")}</p>
    </div>
  )
}
