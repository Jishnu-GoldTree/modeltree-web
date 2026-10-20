"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CheckCircle2, Loader2, Trash2, UploadCloud, XCircle } from "lucide-react"

import { Link } from "@/i18n/navigation"
import {
  bulkCreateListings,
  type BulkCreateResult,
} from "@/lib/actions/models"
import {
  FORMATS,
  METALS,
  PRODUCTION,
  STONES,
} from "@/lib/data/catalog-facets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Bulk import.
 *
 * A designer with a folder of finished files picks them all at once; each one is
 * uploaded to R2 through the same presign → PUT path the single listing form
 * uses, then `bulkCreateListings` turns the batch into one *draft* listing per
 * file. Title comes from the file name; category, licence, price and the
 * jewellery facets are chosen once and applied to every file. Drafts are then
 * fleshed out and published from the normal edit form.
 *
 * Separate from `ListingForm` on purpose: that form is the authority on a single
 * rich listing (description, previews, per-format files), and overloading it
 * with a multi-model mode would tangle two very different flows.
 */

type FormatValue = (typeof FORMATS)[number]["value"]

const MAX_BATCH = 25

/** Map a file extension to a deliverable format, or null if we don't accept it.
 *  `.stp` is the other common spelling of STEP; everything else is 1:1. */
const FORMAT_BY_EXT: Record<string, FormatValue> = {
  stl: "stl",
  obj: "obj",
  fbx: "fbx",
  "3dm": "3dm",
  "3mf": "3mf",
  step: "step",
  stp: "step",
  max: "max",
}

const ACCEPT = ".stl,.obj,.fbx,.3dm,.3mf,.step,.stp,.max"

type Row = {
  id: string
  name: string
  /** Title the draft will get — file name without its extension. */
  title: string
  bytes: number
  format: FormatValue | null
  status: "uploading" | "uploaded" | "error" | "unsupported"
  storageKey?: string
  error?: string
}

function extensionOf(name: string) {
  const dot = name.lastIndexOf(".")
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase()
}

function titleOf(name: string) {
  const dot = name.lastIndexOf(".")
  const base = (dot === -1 ? name : name.slice(0, dot)).trim()
  return base || "model"
}

function formatBytes(bytes: number) {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

export function BulkImportForm({
  categories,
  licenses,
}: {
  categories: { id: string; slug: string; label: string; kind: string }[]
  licenses: { code: string; label: string; blurb: string }[]
}) {
  const t = useTranslations("bulkUpload")
  const facet = useTranslations("facet")

  const [categoryId, setCategoryId] = useState("")
  const [licenseCode, setLicenseCode] = useState(licenses[0]?.code ?? "")
  const [price, setPrice] = useState("0")
  const [metal, setMetal] = useState<(typeof METALS)[number]>("unspecified")
  const [stone, setStone] = useState<(typeof STONES)[number]>("none")
  const [production, setProduction] = useState<(typeof PRODUCTION)[number]>("cast")

  const [rows, setRows] = useState<Row[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BulkCreateResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadModel = useCallback(async (file: File, format: FormatValue) => {
    const uploadId = crypto.randomUUID()
    const extension = extensionOf(file.name).replace(/[^a-z0-9]/g, "") || format
    const res = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "model",
        uploadId,
        format,
        extension,
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
    return storageKey
  }, [])

  const onFilesPicked = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      setResult(null)
      const room = MAX_BATCH - rows.length
      const picked = Array.from(fileList).slice(0, Math.max(0, room))
      if (picked.length < fileList.length) {
        toast.error(t("tooMany", { max: MAX_BATCH }))
      }

      const newRows: Row[] = picked.map((file) => {
        const format = FORMAT_BY_EXT[extensionOf(file.name)] ?? null
        return {
          id: crypto.randomUUID(),
          name: file.name,
          title: titleOf(file.name),
          bytes: file.size,
          format,
          status: format ? "uploading" : "unsupported",
        }
      })
      setRows((prev) => [...prev, ...newRows])

      // Upload the supported ones in parallel; R2 handles concurrent PUTs fine.
      for (const [i, file] of picked.entries()) {
        const row = newRows[i]
        if (!row.format) continue
        const format = row.format
        void (async () => {
          try {
            const storageKey = await uploadModel(file, format)
            setRows((prev) =>
              prev.map((r) =>
                r.id === row.id ? { ...r, status: "uploaded", storageKey } : r,
              ),
            )
          } catch (err) {
            const message = err instanceof Error ? err.message : "Upload failed"
            setRows((prev) =>
              prev.map((r) => (r.id === row.id ? { ...r, status: "error", error: message } : r)),
            )
            toast.error(t("uploadFailed", { name: file.name }))
          }
        })()
      }

      // Let the same file be re-picked after a removal.
      if (inputRef.current) inputRef.current.value = ""
    },
    [rows.length, t, uploadModel],
  )

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const uploadedCount = useMemo(
    () => rows.filter((r) => r.status === "uploaded").length,
    [rows],
  )
  const busy = rows.some((r) => r.status === "uploading")
  const canSubmit =
    Boolean(categoryId) && Boolean(licenseCode) && uploadedCount > 0 && !busy && !submitting

  async function onSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setResult(null)
    try {
      const items = rows
        .filter((r) => r.status === "uploaded" && r.storageKey && r.format)
        .map((r) => ({ storageKey: r.storageKey!, format: r.format!, title: r.title }))

      const res = await bulkCreateListings({
        categoryId,
        licenseCode,
        price: Number(price) || 0,
        metal,
        stone,
        production,
        items,
      })
      setResult(res)

      if (res.error) {
        toast.error(res.error)
      } else if (res.created > 0) {
        toast.success(t("created", { count: res.created }))
        // Clear the rows that became drafts; keep any that failed so they can retry.
        const failedTitles = new Set(res.failed.map((f) => f.title))
        setRows((prev) =>
          prev.filter((r) => r.status !== "uploaded" || failedTitles.has(r.title)),
        )
      }
    } catch {
      toast.error(t("submitFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  const selectClass =
    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-brand/50"

  return (
    <section className="rounded-2xl border bg-card p-6 sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{t("body")}</p>

      {/* Batch defaults applied to every file in this import. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="bulk-category">{t("category")}</Label>
          <select
            id="bulk-category"
            className={selectClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">{t("selectCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="bulk-license">{t("license")}</Label>
          <select
            id="bulk-license"
            className={selectClass}
            value={licenseCode}
            onChange={(e) => setLicenseCode(e.target.value)}
          >
            {licenses.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="bulk-price">{t("price")}</Label>
          <Input
            id="bulk-price"
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="bulk-production">{t("production")}</Label>
          <select
            id="bulk-production"
            className={selectClass}
            value={production}
            onChange={(e) => setProduction(e.target.value as (typeof PRODUCTION)[number])}
          >
            {PRODUCTION.map((p) => (
              <option key={p} value={p}>
                {facet(`production.${p}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="bulk-metal">{t("metal")}</Label>
          <select
            id="bulk-metal"
            className={selectClass}
            value={metal}
            onChange={(e) => setMetal(e.target.value as (typeof METALS)[number])}
          >
            {METALS.map((m) => (
              <option key={m} value={m}>
                {facet(`metal.${m}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="bulk-stone">{t("stone")}</Label>
          <select
            id="bulk-stone"
            className={selectClass}
            value={stone}
            onChange={(e) => setStone(e.target.value as (typeof STONES)[number])}
          >
            {STONES.map((s) => (
              <option key={s} value={s}>
                {facet(`stone.${s}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* File picker */}
      <div className="mt-6">
        <label
          htmlFor="bulk-files"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-background px-6 py-10 text-center transition-colors hover:border-brand/50 hover:bg-accent/40"
        >
          <UploadCloud className="size-7 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">{t("pickFiles")}</span>
          <span className="text-xs text-muted-foreground">{t("hint", { max: MAX_BATCH })}</span>
          <input
            ref={inputRef}
            id="bulk-files"
            type="file"
            multiple
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => onFilesPicked(e.target.files)}
          />
        </label>
      </div>

      {/* Picked files */}
      {rows.length > 0 && (
        <ul className="mt-5 grid gap-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm"
            >
              <span className="flex size-6 shrink-0 items-center justify-center">
                {row.status === "uploading" && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                )}
                {row.status === "uploaded" && (
                  <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                )}
                {(row.status === "error" || row.status === "unsupported") && (
                  <XCircle className="size-4 text-destructive" aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
              {row.format && (
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs uppercase text-muted-foreground">
                  {row.format}
                </span>
              )}
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {row.status === "unsupported"
                  ? t("unsupported")
                  : row.status === "error"
                    ? (row.error ?? t("uploadError"))
                    : formatBytes(row.bytes)}
              </span>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="shrink-0 rounded-md p-1 text-muted-foreground outline-none hover:text-destructive focus-visible:ring-3 focus-visible:ring-brand/50"
                aria-label={t("remove")}
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Result summary */}
      {result && !result.error && (
        <div className="mt-5 rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">{t("created", { count: result.created })}</p>
          {result.failed.length > 0 && (
            <ul className="mt-2 grid gap-1 text-xs text-muted-foreground">
              {result.failed.map((f, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">{f.title}</span>: {f.reason}
                </li>
              ))}
            </ul>
          )}
          {result.created > 0 && (
            <Link
              href="/dashboard"
              className="mt-3 inline-flex text-sm font-medium text-brand-accent hover:underline"
            >
              {t("viewDrafts")}
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button type="button" onClick={onSubmit} disabled={!canSubmit}>
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {submitting ? t("creating") : t("create", { count: uploadedCount })}
        </Button>
        {!categoryId && uploadedCount > 0 && (
          <span className="text-xs text-muted-foreground">{t("needCategory")}</span>
        )}
      </div>
    </section>
  )
}
