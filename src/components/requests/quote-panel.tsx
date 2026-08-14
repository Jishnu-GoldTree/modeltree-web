"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useTranslations } from "next-intl"
import { Check, Loader2 } from "lucide-react"

import { acceptQuote, quoteRequest, type RequestState } from "@/lib/actions/requests"
import type { RequestStatus } from "@/lib/data/requests"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function Submit({ label, className }: { label: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {label}
    </Button>
  )
}

/**
 * The commercial half of a request: price it, then accept it.
 *
 * Which control shows is decided by role and status, but neither side can
 * perform the other's action by posting the form directly — RLS lets only a
 * designer write a quote, and `acceptQuote` matches on `status = 'quoted'` so
 * accepting an unpriced request cannot leave the row inconsistent.
 */
export function QuotePanel({
  requestId,
  status,
  quote,
  isDesigner,
}: {
  requestId: string
  status: RequestStatus
  quote: { agorot: number; formatted: string } | null
  isDesigner: boolean
}) {
  const t = useTranslations("requests")
  const [quoteState, quoteAction] = useActionState<RequestState, FormData>(quoteRequest, {})
  const [acceptState, acceptAction] = useActionState<RequestState, FormData>(acceptQuote, {})

  const settled = status === "accepted" || status === "delivered" || status === "closed"

  return (
    <div className="rounded-xl border p-5">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t("quote")}
      </p>

      {quote ? (
        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
          {quote.formatted}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{t("statusOpen")}</p>
      )}

      {isDesigner && !settled && (
        <form action={quoteAction} className="mt-4 flex flex-col gap-2">
          <input type="hidden" name="requestId" value={requestId} />
          <Label htmlFor="amount" className="text-sm">
            {t("quoteLabel")}
          </Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step="1"
            defaultValue={quote ? quote.agorot / 100 : ""}
            className="h-10"
            required
          />
          {quoteState.fieldErrors?.amount && (
            <p className="text-xs text-destructive">{quoteState.fieldErrors.amount}</p>
          )}
          {quoteState.error && (
            <p className="text-xs text-destructive">{quoteState.error}</p>
          )}
          <Submit
            label={t("quoteSubmit")}
            className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
          />
        </form>
      )}

      {!isDesigner && status === "quoted" && (
        <form action={acceptAction} className="mt-4 flex flex-col gap-2">
          <input type="hidden" name="requestId" value={requestId} />
          {acceptState.error && (
            <p className="text-xs text-destructive">{acceptState.error}</p>
          )}
          <Submit
            label={t("accept")}
            className="h-10 w-full bg-brand text-brand-foreground hover:bg-brand/85"
          />
        </form>
      )}

      {status === "accepted" && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-brand-accent">
          <Check className="size-4" aria-hidden />
          {t("accepted")}
        </p>
      )}
    </div>
  )
}
