"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Star, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { deleteReview, submitReview, type ReviewState } from "@/lib/actions/reviews"
import { Button } from "@/components/ui/button"
import type { ViewerReview } from "@/lib/data/reviews"

/**
 * Write or edit the one review this buyer is allowed on a model.
 *
 * Only rendered for someone who has actually bought it; the server enforces
 * that regardless, via reviews_insert_purchased.
 */

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {label}
    </Button>
  )
}

export function ReviewForm({
  slug,
  viewer,
}: {
  slug: string
  viewer: ViewerReview
}) {
  const t = useTranslations("review")
  const [state, formAction] = useActionState<ReviewState, FormData>(submitReview, {})

  // Radio inputs carry the value so the control is a real radiogroup — arrow
  // keys work and the label is announced. React drives the fill rather than a
  // CSS sibling selector, which would need the stars reversed in the DOM and
  // then break again under RTL.
  const [rating, setRating] = useState(viewer.existing?.rating ?? 0)

  if (!viewer.purchased) {
    return (
      <p className="mt-6 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        {t("needsPurchase")}
      </p>
    )
  }

  return (
    <div className="mt-6 rounded-xl border p-4">
      <h3 className="text-sm font-semibold">
        {viewer.existing ? t("editTitle") : t("title")}
      </h3>

      <form action={formAction} className="mt-3 flex flex-col gap-4">
        <input type="hidden" name="slug" value={slug} />

        <fieldset>
          <legend className="text-xs text-muted-foreground">{t("rating")}</legend>
          <div className="mt-1.5 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className="cursor-pointer rounded p-0.5">
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  className="peer sr-only"
                />
                <Star
                  className={cn(
                    "size-6 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50",
                    value <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40",
                  )}
                  aria-hidden
                />
                <span className="sr-only">{t("starLabel", { count: value })}</span>
              </label>
            ))}
          </div>
          {state.fieldErrors?.rating && (
            <p className="mt-1 text-xs text-destructive">{state.fieldErrors.rating}</p>
          )}
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="review-body" className="text-xs text-muted-foreground">
            {t("body")}
          </label>
          <textarea
            id="review-body"
            name="body"
            rows={4}
            defaultValue={viewer.existing?.body ?? ""}
            placeholder={t("bodyPlaceholder")}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {state.fieldErrors?.body && (
            <p className="text-xs text-destructive">{state.fieldErrors.body}</p>
          )}
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <SubmitButton label={viewer.existing ? t("update") : t("submit")} />
        </div>
      </form>

      {viewer.existing && (
        <form action={deleteReview} className="mt-2 flex justify-end">
          <input type="hidden" name="slug" value={slug} />
          <Button
            type="submit"
            variant="outline"
            className="h-9 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden />
            {t("remove")}
          </Button>
        </form>
      )}
    </div>
  )
}
