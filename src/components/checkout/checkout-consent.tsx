"use client"

import { useActionState, useState } from "react"
import { Info, Loader2, Lock } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { startCheckout, type CheckoutState } from "@/lib/actions/checkout"

const ERROR_KEYS = {
  consent: "errorConsent",
  unavailable: "errorUnavailable",
  empty: "errorEmpty",
  alreadyOwned: "errorAlreadyOwned",
  failed: "errorFailed",
} as const

/**
 * Checkout consent gate.
 *
 * A payment-processor review requires the buyer to actively accept the Terms
 * and see the Refund/Privacy links before paying. The pay button stays disabled
 * until the box is ticked, and the policy links are right next to it.
 *
 * Submitting posts to `startCheckout`, which re-prices the cart on the server,
 * creates the order and redirects to the provider's hosted payment page. With
 * no provider configured it answers `unavailable` and the pending notice shows
 * instead — the button never pretends to take money.
 */
export function CheckoutConsent({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations("checkout")
  const [agreed, setAgreed] = useState(false)
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    startCheckout,
    {},
  )

  return (
    <form action={formAction} className="mt-5 border-t pt-5">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="checkout-terms"
          name="agree"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-4 rounded border-input accent-brand"
        />
        <Label
          htmlFor="checkout-terms"
          // `block`: the shadcn Label is a flex row, which turned every text
          // run and link of this sentence into its own narrow column.
          className="block text-xs leading-snug font-normal text-muted-foreground"
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
        type="submit"
        disabled={!agreed || pending}
        className="mt-4 h-10 w-full bg-brand text-brand-foreground hover:bg-brand/85 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Lock className="size-4" aria-hidden />
        )}
        {t("payNow")}
      </Button>

      {!signedIn && (
        <p className="mt-3 text-xs text-muted-foreground">{t("signInToPay")}</p>
      )}

      {state.error && (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground"
        >
          <Info className="mt-px size-4 shrink-0" aria-hidden />
          {state.error === "unavailable" ? t("pendingBody") : t(ERROR_KEYS[state.error])}
        </p>
      )}

      <p className="mt-4 text-xs text-muted-foreground">{t("secureNote")}</p>
    </form>
  )
}
