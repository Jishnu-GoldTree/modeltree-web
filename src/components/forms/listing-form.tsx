"use client"

import { useActionState, useCallback, useEffect, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CheckCircle2, ImagePlus, Info, Loader2, UploadCloud, X, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { createListing, type ListingState } from "@/lib/actions/models"
import { FORMATS, METALS, PRODUCTION, STONES } from "@/lib/data/catalog-facets"
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
 *
 * File bytes never pass through this form's action. Selecting a file kicks off
 * a presign → PUT-to-R2 flow client-side; only the resulting storage_key and
 * size ride along in a hidden JSON field. That keeps a 500 MB Rhino file out
 * of a serverless function's 100 MB body cap.
 */

type FormatValue = (typeof FORMATS)[number]["value"]

type FileSlot = {
  file: File
  status: "uploading" | "uploaded" | "error"
  storageKey?: string
  size?: number
  error?: string
}

type ImageSlot = {
  id: string
  file: File
  previewUrl: string
  status: "uploading" | "uploaded" | "error"
  storageKey?: string
  size?: number
  error?: string
}

const MAX_IMAGES = 12

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

/** The three jewellery enums render identically; one component, three uses. */
function Select({
  name,
  label,
  options,
  prefix,
}: {
  name: string
  label: string
  options: readonly string[]
  prefix: string
}) {
  const facet = useTranslations("facet")
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={options[options.length - 1]}
        className="h-10 rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {facet(`${prefix}.${option}`)}
          </option>
        ))}
      </select>
    </div>
  )
}

function SubmitButtons({
  publish,
  draft,
  uploading,
}: {
  publish: string
  draft: string
  uploading: boolean
}) {
  // Pending state has to come from a child of <form>, which is what
  // useFormStatus requires.
  const { pending } = useFormStatus()
  const disabled = pending || uploading
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="submit"
        name="publish"
        value="1"
        disabled={disabled}
        className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
      >
        {(pending || uploading) && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {publish}
      </Button>
      <Button type="submit" name="publish" value="0" variant="outline" disabled={pending} className="h-10">
        {draft}
      </Button>
    </div>
  )
}

function humanBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
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
  const u = useTranslations("upload")
  const [state, formAction] = useActionState<ListingState, FormData>(createListing, {})

  // One uploadId per form session groups everything under a single R2 prefix,
  // which makes cleanup (abandoned drafts) a directory delete later.
  const [uploadId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  )

  const [selectedFormats, setSelectedFormats] = useState<Set<FormatValue>>(new Set())
  const [fileSlots, setFileSlots] = useState<Partial<Record<FormatValue, FileSlot>>>({})
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([])

  // Object URLs are handles into memory; leaking them means holding onto the
  // image bytes long after the row is gone.
  useEffect(() => {
    return () => {
      for (const img of imageSlots) URL.revokeObjectURL(img.previewUrl)
    }
    // Intentionally empty: cleanup on unmount only. Per-image revoke happens
    // in the remove handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const uploadFile = useCallback(
    async (kind: "model", file: File, format: FormatValue) => {
      const extension = (file.name.split(".").pop() ?? format).toLowerCase().replace(/[^a-z0-9]/g, "")
      const res = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          uploadId,
          format,
          extension: extension || format,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      })
      if (!res.ok) throw new Error(`Presign failed (${res.status})`)
      const { url, storageKey } = (await res.json()) as { url: string; storageKey: string }

      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      })
      if (!put.ok) throw new Error(`R2 rejected the upload (${put.status})`)
      return { storageKey, size: file.size }
    },
    [uploadId],
  )

  const uploadImage = useCallback(
    async (file: File, position: number) => {
      const rawExt = (file.name.split(".").pop() ?? "jpg").toLowerCase()
      const extension = (rawExt === "jpeg" ? "jpg" : rawExt) as "jpg" | "png" | "webp"
      const res = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "image",
          uploadId,
          position,
          extension,
          size: file.size,
          contentType: file.type,
        }),
      })
      if (!res.ok) throw new Error(`Presign failed (${res.status})`)
      const { url, storageKey } = (await res.json()) as { url: string; storageKey: string }

      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!put.ok) throw new Error(`R2 rejected the upload (${put.status})`)
      return { storageKey, size: file.size }
    },
    [uploadId],
  )

  function toggleFormat(format: FormatValue, checked: boolean) {
    setSelectedFormats((prev) => {
      const next = new Set(prev)
      if (checked) next.add(format)
      else next.delete(format)
      return next
    })
    if (!checked) {
      setFileSlots((prev) => {
        const next = { ...prev }
        delete next[format]
        return next
      })
    }
  }

  async function onFilePicked(format: FormatValue, file: File) {
    setFileSlots((prev) => ({ ...prev, [format]: { file, status: "uploading" } }))
    try {
      const { storageKey, size } = await uploadFile("model", file, format)
      setFileSlots((prev) => ({
        ...prev,
        [format]: { file, status: "uploaded", storageKey, size },
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed"
      setFileSlots((prev) => ({ ...prev, [format]: { file, status: "error", error: message } }))
      toast.error(u("uploadFailed", { name: file.name }))
    }
  }

  async function onImagesPicked(files: FileList | null) {
    if (!files || files.length === 0) return
    const room = MAX_IMAGES - imageSlots.length
    const picked = Array.from(files).slice(0, room)
    if (picked.length === 0) return

    const startIndex = imageSlots.length
    const newSlots: ImageSlot[] = picked.map((file, i) => ({
      id: `${Date.now()}-${startIndex + i}-${file.name}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    }))
    setImageSlots((prev) => [...prev, ...newSlots])

    // Upload in parallel — R2 handles concurrent PUTs fine and the images are
    // small enough that serialising them would only add wall time.
    await Promise.all(
      newSlots.map(async (slot, i) => {
        try {
          const { storageKey, size } = await uploadImage(slot.file, startIndex + i)
          setImageSlots((prev) =>
            prev.map((s) => (s.id === slot.id ? { ...s, status: "uploaded", storageKey, size } : s)),
          )
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed"
          setImageSlots((prev) =>
            prev.map((s) => (s.id === slot.id ? { ...s, status: "error", error: message } : s)),
          )
          toast.error(u("uploadFailed", { name: slot.file.name }))
        }
      }),
    )
  }

  function removeImage(id: string) {
    setImageSlots((prev) => {
      const target = prev.find((s) => s.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((s) => s.id !== id)
    })
  }

  const uploadedFilesPayload = useMemo(
    () =>
      Object.entries(fileSlots)
        .filter(([, slot]) => slot?.status === "uploaded" && slot.storageKey)
        .map(([format, slot]) => ({
          format,
          storageKey: slot!.storageKey!,
          size: slot!.size ?? 0,
        })),
    [fileSlots],
  )

  const uploadedImagesPayload = useMemo(
    () =>
      imageSlots
        .filter((s) => s.status === "uploaded" && s.storageKey)
        .map((s, position) => ({
          storageKey: s.storageKey!,
          size: s.size ?? 0,
          position,
        })),
    [imageSlots],
  )

  const anyUploading =
    Object.values(fileSlots).some((s) => s?.status === "uploading") ||
    imageSlots.some((s) => s.status === "uploading")

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

      {/* Serialised R2 upload manifest — the server action parses these and
          inserts the model_files / model_images rows. */}
      <input type="hidden" name="uploadedFiles" value={JSON.stringify(uploadedFilesPayload)} />
      <input type="hidden" name="uploadedImages" value={JSON.stringify(uploadedImagesPayload)} />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">{u("filesLegend")}</legend>
        <p className="text-xs text-muted-foreground">{u("filesHint")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {FORMATS.map((f) => {
            const checked = selectedFormats.has(f.value)
            const slot = fileSlots[f.value]
            return (
              <div
                key={f.value}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
                  checked ? "border-brand bg-brand-muted/40" : "hover:bg-accent",
                )}
              >
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="formats"
                    value={f.value}
                    checked={checked}
                    onChange={(e) => toggleFormat(f.value, e.target.checked)}
                    className="size-4 accent-brand"
                  />
                  {f.label}
                </label>
                {checked && (
                  <div className="flex flex-col gap-1.5">
                    <input
                      id={`file-${f.value}`}
                      type="file"
                      className="text-xs file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-accent"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onFilePicked(f.value, file)
                      }}
                    />
                    {slot && (
                      <p
                        className={cn(
                          "flex items-center gap-1.5 text-xs",
                          slot.status === "error" && "text-destructive",
                          slot.status === "uploaded" && "text-brand-accent",
                          slot.status === "uploading" && "text-muted-foreground",
                        )}
                      >
                        {slot.status === "uploading" && <Loader2 className="size-3 animate-spin" aria-hidden />}
                        {slot.status === "uploaded" && <CheckCircle2 className="size-3" aria-hidden />}
                        {slot.status === "error" && <XCircle className="size-3" aria-hidden />}
                        <span className="truncate" title={slot.file.name}>
                          {slot.file.name} · {humanBytes(slot.file.size)}
                          {slot.status === "uploading" && ` · ${u("uploading")}`}
                          {slot.status === "uploaded" && ` · ${u("uploaded")}`}
                          {slot.status === "error" && ` · ${slot.error ?? u("failed")}`}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <FieldError message={state.fieldErrors?.formats ?? state.fieldErrors?.uploadedFiles} />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">{u("imagesLegend")}</legend>
        <p className="text-xs text-muted-foreground">
          {u("imagesHint", { max: MAX_IMAGES })}
        </p>
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-6 text-center transition-colors",
            imageSlots.length >= MAX_IMAGES ? "cursor-not-allowed opacity-60" : "hover:bg-accent",
          )}
        >
          <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">{u("addImages")}</span>
          <span className="text-xs text-muted-foreground">{u("imagesFormats")}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={imageSlots.length >= MAX_IMAGES}
            onChange={(e) => {
              onImagesPicked(e.target.files)
              e.currentTarget.value = ""
            }}
          />
        </label>
        {imageSlots.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {imageSlots.map((img) => (
              <li key={img.id} className="group relative overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt="" className="aspect-square w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 px-2 py-1 text-[10px] text-white">
                  <span className="flex items-center gap-1 truncate">
                    {img.status === "uploading" && <Loader2 className="size-3 animate-spin" aria-hidden />}
                    {img.status === "uploaded" && <CheckCircle2 className="size-3" aria-hidden />}
                    {img.status === "error" && <XCircle className="size-3" aria-hidden />}
                    <span className="truncate">
                      {img.status === "uploading" && u("uploading")}
                      {img.status === "uploaded" && humanBytes(img.file.size)}
                      {img.status === "error" && (img.error ?? u("failed"))}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="rounded p-0.5 hover:bg-white/20"
                    aria-label={u("removeImage")}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

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
          <Label htmlFor="price">{t("priceIls")}</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">{t("priceHintIls")}</p>
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

      <div className="grid gap-6 sm:grid-cols-2">

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="weightGrams">{t("weight")}</Label>
          <Input id="weightGrams" name="weightGrams" type="number" min={0} step="0.01" placeholder="3.4" className="h-10" />
          <FieldError message={state.fieldErrors?.weightGrams} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Select name="metal" label={t("metal")} options={METALS} prefix="metal" />
        <Select name="stone" label={t("stone")} options={STONES} prefix="stone" />
        <Select name="production" label={t("production")} options={PRODUCTION} prefix="production" />
      </div>

      <p className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-px size-4 shrink-0" aria-hidden />
        <span>
          <UploadCloud className="mr-1 inline size-3.5 -translate-y-px" aria-hidden />
          {u("publishNote")}
        </span>
      </p>

      <SubmitButtons publish={t("publish")} draft={t("saveDraft")} uploading={anyUploading} />
    </form>
  )
}
