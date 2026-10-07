"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { useTranslations } from "next-intl"
import { Loader2, PencilRuler, Ruler } from "lucide-react"

import { cn } from "@/lib/utils"
import { openRequest, type RequestState } from "@/lib/actions/requests"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type OwnedModel = { id: string; slug: string; title: string }

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 bg-brand text-brand-foreground hover:bg-brand/85"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {label}
    </Button>
  )
}

/**
 * Opens a request.
 *
 * The kind is a choice up front because it changes what the form asks for and
 * what the work costs: an adjustment must name a model the buyer owns, a
 * commission must not have one at all. The database enforces the same pairing,
 * so a tampered form fails as a constraint violation rather than creating a
 * nonsensical row.
 */
export function RequestForm({
  ownedModels,
  preselectedModelId,
  preselectedKind,
}: {
  ownedModels: OwnedModel[]
  preselectedModelId?: string
  preselectedKind?: "adjustment" | "commission"
}) {
  const t = useTranslations("requests")
  const [state, formAction] = useActionState<RequestState, FormData>(openRequest, {})
  // A deep link decides; otherwise start on whichever the buyer can actually
  // use — adjustment is meaningless with nothing purchased. This survives a
  // failed submit on its own: the action re-renders the form rather than
  // remounting it, so the toggle stays where the buyer left it.
  const [kind, setKind] = useState<"adjustment" | "commission">(
    preselectedKind ??
      (preselectedModelId || ownedModels.length > 0 ? "adjustment" : "commission"),
  )

  const options = [
    { value: "adjustment", label: t("openAdjustment"), Icon: Ruler },
    { value: "commission", label: t("openCommission"), Icon: PencilRuler },
  ] as const

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <input type="hidden" name="kind" value={kind} />

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">{t("kindLabel")}</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setKind(option.value)}
              aria-pressed={kind === option.value}
              className={cn(
                "flex cursor-pointer flex-col items-start gap-1 rounded-lg border p-3 text-start outline-none transition-colors",
                "hover:bg-accent focus-visible:ring-3 focus-visible:ring-brand/50",
                kind === option.value && "border-brand bg-brand-muted",
              )}
            >
              <option.Icon className="size-4 text-brand-accent" aria-hidden />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {kind === "adjustment" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="modelId">{t("modelLabel")}</Label>
          {ownedModels.length === 0 ? (
            <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              {t("noOwnedModels")}
            </p>
          ) : (
            <>
              <select
                id="modelId"
                name="modelId"
                defaultValue={state.values?.modelId || preselectedModelId || ""}
                className="h-10 rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
              >
                <option value="" disabled>
                  {t("modelPlaceholder")}
                </option>
                {ownedModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{t("adjustmentHint")}</p>
            </>
          )}
          <FieldError message={state.fieldErrors?.modelId} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">{t("titleLabel")}</Label>
        <Input
          id="title"
          name="title"
          defaultValue={state.values?.title ?? ""}
          placeholder={t("titlePlaceholder")}
          className="h-10"
          required
        />
        <FieldError message={state.fieldErrors?.title} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brief">{t("briefLabel")}</Label>
        <textarea
          id="brief"
          name="brief"
          rows={6}
          defaultValue={state.values?.brief ?? ""}
          placeholder={t("briefPlaceholder")}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          required
        />
        <FieldError message={state.fieldErrors?.brief} />
      </div>

      <Submit label={t("submit")} />
    </form>
  )
}
