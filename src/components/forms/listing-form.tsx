"use client"

import { useActionState, useCallback, useEffect, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CheckCircle2, ImagePlus, Info, Loader2, Trash2, UploadCloud, X, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { createListing, updateListing, type ListingState } from "@/lib/actions/models"
import type { ListingEditData } from "@/lib/data/designer"
import {
  FORMATS,
  MAX_TAGS,
  METALS,
  PRODUCTION,
  STONES,
  normalizeTag,
} from "@/lib/data/catalog-facets"
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
  // Display name and byte count, carried directly so an already-stored file
  // (edit mode, no File object in hand) renders the same as a freshly picked one.
  name: string
  bytes: number
  status: "uploading" | "uploaded" | "error"
  storageKey?: string
  size?: number
  error?: string
}

type ImageSlot = {
  id: string
  // Absent for images loaded from an existing listing — those arrive already
  // uploaded, with a signed preview URL rather than a local object URL.
  file?: File
  previewUrl: string
  bytes: number
  status: "uploading" | "uploaded" | "error"
  storageKey?: string
  size?: number
  width?: number
  height?: number
  error?: string
}

/**
 * Natural pixel size of a picked image.
 *
 * Read here rather than server-side: the bytes go straight to R2, so the only
 * place that ever holds the image is this browser. Recorded so the catalog can
 * reserve the right box before a preview loads instead of shifting layout.
 * Null when the browser cannot decode the file — the columns are nullable and
 * a missing size is not worth failing an upload over.
 */
async function readImageSize(file: File) {
  try {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    return null
  }
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
  defaultValue,
}: {
  name: string
  label: string
  options: readonly string[]
  prefix: string
  defaultValue?: string
}) {
  const facet = useTranslations("facet")
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        // Falls back to the last option ("unspecified"/"none"/"both") when the
        // form isn't seeded from an existing listing.
        defaultValue={defaultValue ?? options[options.length - 1]}
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
  canPublish,
  previewHint,
}: {
  publish: string
  draft: string
  uploading: boolean
  /** A publish must ship a thumbnail, so it stays disabled until at least one
   *  preview image has finished uploading. A draft has no such requirement. */
  canPublish: boolean
  previewHint: string
}) {
  // Pending state has to come from a child of <form>, which is what
  // useFormStatus requires.
  const { pending } = useFormStatus()
  const disabled = pending || uploading
  return (
    <div className="flex flex-col items-end gap-2">
      {!canPublish && (
        <p className="text-xs text-muted-foreground">{previewHint}</p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="submit"
          name="publish"
          value="1"
          disabled={disabled || !canPublish}
          title={canPublish ? undefined : previewHint}
          className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
        >
          {(pending || uploading) && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {publish}
        </Button>
        <Button type="submit" name="publish" value="0" variant="outline" disabled={pending} className="h-10">
          {draft}
        </Button>
      </div>
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
  initial,
}: {
  categories: { id: string; slug: string; label: string; kind: string }[]
  licenses: { code: string; label: string; blurb: string }[]
  /** Present in edit mode: pre-fills every field and seeds the already-stored
   *  files and images so leaving them untouched preserves them on save. */
  initial?: ListingEditData
}) {
  const feedback = useTranslations("toast")
  const t = useTranslations("listing")
  const u = useTranslations("upload")
  const editing = initial !== undefined
  const [state, formAction] = useActionState<ListingState, FormData>(
    editing ? updateListing : createListing,
    {},
  )

  // The server action is the single source of validation, so errors only arrive
  // on submit. Mirroring them locally lets a field's error clear the instant
  // that field changes, instead of a stale "too short" sitting under text the
  // designer has already fixed. Re-synced on every new submit result.
  const [errors, setErrors] = useState<Record<string, string>>({})
  useEffect(() => {
    setErrors(state.fieldErrors ?? {})
  }, [state])
  const clearError = useCallback((...fields: string[]) => {
    setErrors((prev) => {
      if (!fields.some((f) => f in prev)) return prev
      const next = { ...prev }
      for (const f of fields) delete next[f]
      return next
    })
  }, [])

  // One uploadId per form session groups everything under a single R2 prefix,
  // which makes cleanup (abandoned drafts) a directory delete later.
  const [uploadId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  )

  const [selectedFormats, setSelectedFormats] = useState<Set<FormatValue>>(
    () => new Set((initial?.files ?? []).map((f) => f.format as FormatValue)),
  )
  const [fileSlots, setFileSlots] = useState<Partial<Record<FormatValue, FileSlot>>>(() =>
    Object.fromEntries(
      (initial?.files ?? []).map((f) => [
        f.format,
        {
          name: `${f.format.toUpperCase()} file`,
          bytes: f.sizeBytes,
          status: "uploaded" as const,
          storageKey: f.storageKey,
          size: f.sizeBytes,
        },
      ]),
    ),
  )
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(() =>
    (initial?.images ?? []).map((img, i) => ({
      id: `existing-${i}-${img.storageKey}`,
      previewUrl: img.previewUrl,
      bytes: 0,
      status: "uploaded" as const,
      storageKey: img.storageKey,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
    })),
  )

  // Keyword tags. Stored normalised so a chip reads exactly as it will be saved
  // and searched; the server re-normalises regardless, so this is convenience.
  const [tags, setTags] = useState<string[]>(() => initial?.tags ?? [])
  const [tagDraft, setTagDraft] = useState("")
  const tagsFull = tags.length >= MAX_TAGS

  const commitTag = useCallback((raw: string) => {
    const tag = normalizeTag(raw)
    if (!tag) return
    setTags((prev) =>
      prev.includes(tag) || prev.length >= MAX_TAGS ? prev : [...prev, tag],
    )
    setTagDraft("")
  }, [])

  function onTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Enter and comma both commit; Enter must not submit the whole form.
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      commitTag(tagDraft)
    } else if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      // Backspace on an empty field peels the last chip — the expected shortcut
      // for a chips input.
      setTags((prev) => prev.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  // Object URLs are handles into memory; leaking them means holding onto the
  // image bytes long after the row is gone.
  useEffect(() => {
    return () => {
      // Only the locally-created object URLs need freeing; existing images
      // carry a signed https URL that revokeObjectURL would ignore anyway.
      for (const img of imageSlots) {
        if (img.previewUrl.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl)
      }
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
    clearError("formats", "uploadedFiles")
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
    clearError("formats", "uploadedFiles")
    const meta = { name: file.name, bytes: file.size }
    setFileSlots((prev) => ({ ...prev, [format]: { ...meta, status: "uploading" } }))
    try {
      const { storageKey, size } = await uploadFile("model", file, format)
      setFileSlots((prev) => ({
        ...prev,
        [format]: { ...meta, status: "uploaded", storageKey, size },
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed"
      setFileSlots((prev) => ({ ...prev, [format]: { ...meta, status: "error", error: message } }))
      toast.error(u("uploadFailed", { name: file.name }))
    }
  }

  async function onImagesPicked(files: FileList | null) {
    if (!files || files.length === 0) return
    clearError("uploadedImages")
    const room = MAX_IMAGES - imageSlots.length
    const picked = Array.from(files).slice(0, room)
    if (picked.length === 0) return

    const startIndex = imageSlots.length
    const newSlots: ImageSlot[] = picked.map((file, i) => ({
      id: `${Date.now()}-${startIndex + i}-${file.name}`,
      file,
      previewUrl: URL.createObjectURL(file),
      bytes: file.size,
      status: "uploading",
    }))
    setImageSlots((prev) => [...prev, ...newSlots])

    // Upload in parallel — R2 handles concurrent PUTs fine and the images are
    // small enough that serialising them would only add wall time.
    await Promise.all(
      newSlots.map(async (slot, i) => {
        // Always set here — these slots were just built from picked files.
        const file = slot.file!
        try {
          // Decoding runs alongside the PUT rather than before it, so reading
          // the dimensions costs no extra wall time.
          const [dimensions, { storageKey, size }] = await Promise.all([
            readImageSize(file),
            uploadImage(file, startIndex + i),
          ])
          setImageSlots((prev) =>
            prev.map((s) =>
              s.id === slot.id
                ? { ...s, status: "uploaded", storageKey, size, ...dimensions }
                : s,
            ),
          )
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed"
          setImageSlots((prev) =>
            prev.map((s) => (s.id === slot.id ? { ...s, status: "error", error: message } : s)),
          )
          toast.error(u("uploadFailed", { name: file.name }))
        }
      }),
    )
  }

  function removeImage(id: string) {
    setImageSlots((prev) => {
      const target = prev.find((s) => s.id === id)
      if (target?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((s) => s.id !== id)
    })
  }

  /** Drops an uploaded deliverable without unchecking its format — the
   *  designer can pick a replacement without also losing their format
   *  selection. Also clears the file input so re-picking the same file name
   *  still fires `onChange`. */
  function removeFile(format: FormatValue) {
    setFileSlots((prev) => {
      const next = { ...prev }
      delete next[format]
      return next
    })
    const input = document.getElementById(`file-${format}`)
    if (input instanceof HTMLInputElement) input.value = ""
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
          width: s.width,
          height: s.height,
        })),
    [imageSlots],
  )

  const anyUploading =
    Object.values(fileSlots).some((s) => s?.status === "uploading") ||
    imageSlots.some((s) => s.status === "uploading")

  // A listing with no preview has no thumbnail, so it renders blank in the
  // catalog and reads as broken. Publishing is gated on at least one uploaded
  // image; drafts may still be saved without one.
  const hasUploadedImage = uploadedImagesPayload.length > 0

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

      {editing && <input type="hidden" name="modelId" value={initial.id} />}

      {/* Serialised R2 upload manifest — the server action parses these and
          inserts the model_files / model_images rows. */}
      <input type="hidden" name="uploadedFiles" value={JSON.stringify(uploadedFilesPayload)} />
      <input type="hidden" name="uploadedImages" value={JSON.stringify(uploadedImagesPayload)} />
      <input type="hidden" name="tags" value={JSON.stringify(tags)} />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">{u("filesLegend")}</legend>
        <p className="text-xs text-muted-foreground">{u("filesHint")}</p>
        <div className="flex flex-col gap-2">
          {FORMATS.map((f) => {
            const checked = selectedFormats.has(f.value)
            const slot = fileSlots[f.value]
            return (
              <div
                key={f.value}
                className={cn(
                  "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border p-3 transition-colors",
                  checked ? "border-brand bg-brand-muted/40" : "hover:bg-accent",
                )}
              >
                <label className="flex w-20 shrink-0 cursor-pointer items-center gap-2 text-sm font-medium">
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
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
                    <input
                      id={`file-${f.value}`}
                      type="file"
                      className="min-w-0 flex-1 text-xs file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-accent"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onFilePicked(f.value, file)
                      }}
                    />
                    {slot && (
                      <div
                        className={cn(
                          // Full width so a long filename never squeezes the
                          // file picker sharing this row.
                          "flex w-full min-w-0 items-center gap-1.5 text-xs",
                          slot.status === "error" && "text-destructive",
                          slot.status === "uploaded" && "text-brand-accent",
                          slot.status === "uploading" && "text-muted-foreground",
                        )}
                      >
                        {slot.status === "uploading" && <Loader2 className="size-3 animate-spin" aria-hidden />}
                        {slot.status === "uploaded" && <CheckCircle2 className="size-3" aria-hidden />}
                        {slot.status === "error" && <XCircle className="size-3" aria-hidden />}
                        <span className="min-w-0 flex-1 truncate" title={slot.name}>
                          {slot.name} · {humanBytes(slot.bytes)}
                          {slot.status === "uploading" && ` · ${u("uploading")}`}
                          {slot.status === "uploaded" && ` · ${u("uploaded")}`}
                          {slot.status === "error" && ` · ${slot.error ?? u("failed")}`}
                        </span>
                        {/* Removing a file leaves the format checked so the
                            designer can pick a replacement without having to
                            re-select the format checkbox. */}
                        {slot.status !== "uploading" && (
                          <button
                            type="button"
                            onClick={() => removeFile(f.value)}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:outline-none"
                            aria-label={u("removeFile")}
                            title={u("removeFile")}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <FieldError message={errors.formats ?? errors.uploadedFiles} />
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
                {/* Floating trash — top-end so it reads regardless of the
                    tile's height, and end-side rather than right so it flips
                    to the correct side in RTL. Solid backing + destructive
                    accent on hover so the affordance is unambiguous. */}
                {img.status !== "uploading" && (
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute end-1.5 top-1.5 rounded-md bg-white/90 p-1.5 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-destructive hover:text-white focus-visible:ring-2 focus-visible:ring-destructive/50 focus-visible:outline-none dark:bg-black/70 dark:text-white/80"
                    aria-label={u("removeImage")}
                    title={u("removeImage")}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/60 px-2 py-1 text-[10px] text-white">
                  {img.status === "uploading" && <Loader2 className="size-3 animate-spin" aria-hidden />}
                  {img.status === "uploaded" && <CheckCircle2 className="size-3" aria-hidden />}
                  {img.status === "error" && <XCircle className="size-3" aria-hidden />}
                  <span className="truncate">
                    {img.status === "uploading" && u("uploading")}
                    {img.status === "uploaded" && (img.bytes > 0 ? humanBytes(img.bytes) : u("uploaded"))}
                    {img.status === "error" && (img.error ?? u("failed"))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <FieldError message={errors.uploadedImages} />
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">{t("title")}</Label>
        <Input
          id="title"
          name="title"
          defaultValue={initial?.title ?? ""}
          placeholder={t("titlePlaceholder")}
          className="h-10"
          required
          onChange={() => clearError("title")}
        />
        <FieldError message={errors.title} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">{t("description")}</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={initial?.description ?? ""}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          required
          onChange={() => clearError("description")}
        />
        <p className="text-xs text-muted-foreground">
          Buyers decide from this. Mention topology, texture resolution and what
          is included.
        </p>
        <FieldError message={errors.description} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tag-input">{t("tags")}</Label>
        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent p-2 text-sm",
            "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          )}
          onClick={() => document.getElementById("tag-input")?.focus()}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md border border-brand bg-brand-muted/60 py-0.5 ps-2 pe-1 text-xs font-medium text-brand-accent"
            >
              {/* dir=auto so a Hebrew tag lays out right-to-left inside an
                  otherwise LTR chip row. */}
              <span dir="auto">{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-sm p-0.5 hover:bg-brand/15 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                aria-label={t("tagRemove", { tag })}
                title={t("tagRemove", { tag })}
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
          {!tagsFull && (
            <input
              id="tag-input"
              type="text"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKeyDown}
              onBlur={() => commitTag(tagDraft)}
              placeholder={tags.length === 0 ? t("tagsPlaceholder") : ""}
              className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {tagsFull ? t("tagsFull", { max: MAX_TAGS }) : t("tagsHint", { max: MAX_TAGS })}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">{t("category")}</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={initial?.categoryId ?? ""}
            required
            onChange={() => clearError("categoryId")}
            className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              {t("choose")}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.categoryId} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">{t("priceIls")}</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step={1}
            defaultValue={initial?.priceIls ?? 0}
            className="h-10"
            onChange={() => clearError("price")}
          />
          <p className="text-xs text-muted-foreground">{t("priceHintIls")}</p>
          <FieldError message={errors.price} />
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
                defaultChecked={initial ? initial.licenseCode === l.code : i === 0}
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
          <Input
            id="weightGrams"
            name="weightGrams"
            type="number"
            min={0}
            step="0.01"
            defaultValue={initial?.weightGrams ?? undefined}
            placeholder="3.4"
            className="h-10"
            onChange={() => clearError("weightGrams")}
          />
          <FieldError message={errors.weightGrams} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Select name="metal" label={t("metal")} options={METALS} prefix="metal" defaultValue={initial?.metal} />
        <Select name="stone" label={t("stone")} options={STONES} prefix="stone" defaultValue={initial?.stone} />
        <Select name="production" label={t("production")} options={PRODUCTION} prefix="production" defaultValue={initial?.production} />
      </div>

      <p className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-px size-4 shrink-0" aria-hidden />
        <span>
          <UploadCloud className="mr-1 inline size-3.5 -translate-y-px" aria-hidden />
          {u("publishNote")}
        </span>
      </p>

      <SubmitButtons
        publish={editing ? t("update") : t("publish")}
        draft={t("saveDraft")}
        uploading={anyUploading}
        canPublish={hasUploadedImage}
        previewHint={u("previewRequired")}
      />
    </form>
  )
}
