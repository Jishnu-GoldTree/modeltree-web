"use client"

import { useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Info, Loader2, UploadCloud } from "lucide-react"

import { cn } from "@/lib/utils"
import { createListing, type ListingState } from "@/lib/actions/models"
import { FORMATS } from "@/lib/data/catalog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Listing form.
 *
 * A plain <form> posting to a server action rather than react-hook-form: this
 * is the one form where the server has to be the authority anyway (slug
 * collisions, RLS, category ids), so validating twice would mean two rule sets
 * drifting apart. Errors come back from the action keyed by field.
 */

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

function SubmitButtons({ publish, draft }: { publish: string; draft: string }) {
  // Pending state has to come from a child of <form>, which is what
  // useFormStatus requires.
  const { pending } = useFormStatus()
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="submit"
        name="publish"
        value="1"
        disabled={pending}
        className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {publish}
      </Button>
      <Button type="submit" name="publish" value="0" variant="outline" disabled={pending} className="h-10">
        {draft}
      </Button>
    </div>
  )
}

export function ListingForm({
  categories,
  licenses,
}: {
  categories: { id: string; slug: string; label: string; kind: string }[]
  licenses: { code: string; label: string; blurb: string }[]
}) {
  const feedback = useTranslations("toast")
  const t = useTranslations("listing")
  const [state, formAction] = useActionState<ListingState, FormData>(createListing, {})

  // Only the failure path needs a toast here — a successful create redirects to
  // the dashboard and carries its own flash marker.
  useEffect(() => {
    if (state.error) toast.error(feedback("listingFailed"))
  }, [state, feedback])

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {/* File upload is deliberately not wired yet: 3D files run to hundreds of
          MB and must go straight to object storage with a presigned URL, never
          through a serverless function with a 4.5MB body limit. */}
      <div className="rounded-xl border border-dashed p-6 text-center">
        <UploadCloud className="mx-auto size-7 text-muted-foreground" aria-hidden />
        <p className="mt-3 text-sm font-medium">File upload lands with storage</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
          Model files upload directly to object storage from your browser, so
          they never pass through the app server. Until that is connected, pick
          the formats you will ship below.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">{t("title")}</Label>
        <Input id="title" name="title" placeholder={t("titlePlaceholder")} className="h-10" required />
        <FieldError message={state.fieldErrors?.title} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">{t("description")}</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          required
        />
        <p className="text-xs text-muted-foreground">
          Buyers decide from this. Mention topology, texture resolution and what
          is included.
        </p>
        <FieldError message={state.fieldErrors?.description} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">{t("category")}</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue=""
            required
            className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Choose a category
            </option>
            {["asset", "print"].map((kind) => (
              <optgroup key={kind} label={kind === "asset" ? "3D models" : "3D printing"}>
                {categories
                  .filter((c) => c.kind === kind)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.categoryId} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">{t("price")}</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">{t("priceHint")}</p>
          <FieldError message={state.fieldErrors?.price} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">{t("license")}</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {licenses.map((l, i) => (
            <label
              key={l.code}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors",
                "hover:bg-accent has-checked:border-brand has-checked:bg-brand-muted",
                "has-focus-visible:ring-3 has-focus-visible:ring-brand/50",
              )}
            >
              <input
                type="radio"
                name="licenseCode"
                value={l.code}
                defaultChecked={i === 0}
                className="sr-only"
              />
              <span className="text-sm font-medium">{l.label}</span>
              <span className="text-xs text-muted-foreground">{l.blurb}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">{t("formats")}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <label
              key={f.value}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors",
                "hover:bg-accent has-checked:border-brand has-checked:bg-brand-muted has-checked:text-brand-accent",
                "has-focus-visible:ring-3 has-focus-visible:ring-brand/50",
              )}
            >
              <input type="checkbox" name="formats" value={f.label} className="sr-only" />
              {f.label}
            </label>
          ))}
        </div>
        <FieldError message={state.fieldErrors?.formats} />
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="polygons">{t("polygons")}</Label>
          <Input id="polygons" name="polygons" type="number" min={0} placeholder="24000" className="h-10" />
          <FieldError message={state.fieldErrors?.polygons} />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("features")}</legend>
          {[
            { name: "rigged", label: "Rigged" },
            { name: "animated", label: "Animated" },
            { name: "pbr", label: "PBR materials" },
          ].map((f) => (
            <label key={f.name} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={f.name}
                className="size-4 rounded border-input accent-brand"
              />
              {f.label}
            </label>
          ))}
        </fieldset>
      </div>

      <p className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-px size-4 shrink-0" aria-hidden />
        Publishing queues the listing for processing. It appears in the catalog
        once previews are generated and the files pass checks.
      </p>

      <SubmitButtons publish={t("publish")} draft={t("saveDraft")} />
    </form>
  )
}
