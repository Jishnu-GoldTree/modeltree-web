import "server-only"

import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { r2, r2Bucket } from "@/lib/r2/client"

/**
 * Presigned uploads.
 *
 * The browser PUTs bytes straight to R2. A Vercel Function has a 100 MB body
 * limit and a jewellery CAD file (Rhino, Matrix) can top 500 MB, so the app
 * server must never see the bytes. What it does own is the storage key: the
 * server names it (scoped by userId + a random uploadId) so a client cannot
 * write into another designer's namespace or overwrite an existing key.
 */

const FIVE_MINUTES = 60 * 5

export type PresignArgs = {
  storageKey: string
  contentType: string
  /** Enforced by R2 against the actual PUT body — a client cannot lie. */
  contentLength: number
}

export async function presignPut({ storageKey, contentType, contentLength }: PresignArgs) {
  const command = new PutObjectCommand({
    Bucket: r2Bucket(),
    Key: storageKey,
    ContentType: contentType,
    ContentLength: contentLength,
  })
  // Short TTL: a URL that leaks from a browser history or a log stays valid
  // for five minutes at most, which is longer than a real upload takes and
  // shorter than most exfiltration windows.
  return getSignedUrl(r2(), command, { expiresIn: FIVE_MINUTES })
}

const ONE_DAY = 60 * 60 * 24

/**
 * Signed download URL. Used for preview images embedded on catalog pages —
 * one day is the sweet spot: comfortably longer than any Next revalidation
 * window we set today, short enough that a URL scraped out of HTML goes
 * stale within a day. Model source files get a much tighter TTL at the
 * point of purchase; this helper is for public-facing previews only.
 */
export async function presignGet(storageKey: string, expiresIn: number = ONE_DAY) {
  return getSignedUrl(
    r2(),
    new GetObjectCommand({ Bucket: r2Bucket(), Key: storageKey }),
    { expiresIn },
  )
}

/**
 * Signed URL that a browser follows to pull a purchased source file down.
 *
 * A tight five-minute TTL because this is the paid asset itself, not a public
 * preview: the URL is handed out only after an entitlement check, and any copy
 * of it goes stale before it can be shared. `ResponseContentDisposition` makes
 * R2 send the bytes as an attachment named for the model, so the buyer gets
 * "rally-car.stl" rather than the opaque storage key.
 */
export async function presignDownload(
  storageKey: string,
  filename: string,
  expiresIn: number = FIVE_MINUTES,
) {
  // Quotes and control chars would break the header; keep it to a safe subset.
  const safeName = filename.replace(/[^\w.\-]+/g, "_") || "model"
  return getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: r2Bucket(),
      Key: storageKey,
      ResponseContentDisposition: `attachment; filename="${safeName}"`,
    }),
    { expiresIn },
  )
}

export type StoredObject = { size: number; checksum: string | null }

/**
 * What R2 actually holds at a key, or null if it holds nothing.
 *
 * A presigned URL is permission to upload, not proof of one: if the browser's
 * PUT fails, is cancelled, or the tab closes mid-flight, the key stays empty
 * while the client still reports success. Everything the client says about an
 * upload — that it happened, how big it was — is therefore unverified until
 * this call, which is why publishing goes through it.
 *
 * The ETag is R2's own digest of the bytes. Stored as `checksum` so a later
 * download path can detect a truncated or swapped object.
 */
export async function headObject(storageKey: string): Promise<StoredObject | null> {
  try {
    const head = await r2().send(
      new HeadObjectCommand({ Bucket: r2Bucket(), Key: storageKey }),
    )
    return {
      size: head.ContentLength ?? 0,
      checksum: head.ETag?.replaceAll('"', "") ?? null,
    }
  } catch (error) {
    // A genuinely absent key is the expected answer here, so it maps to null.
    // Anything else — credentials, network, a bucket that doesn't exist — is a
    // fault the caller must not read as "the designer forgot to upload".
    if (isNotFound(error)) return null
    throw error
  }
}

function isNotFound(error: unknown) {
  if (typeof error !== "object" || error === null) return false
  const { name, $metadata } = error as { name?: string; $metadata?: { httpStatusCode?: number } }
  return name === "NotFound" || name === "NoSuchKey" || $metadata?.httpStatusCode === 404
}

/**
 * `prod/` on Vercel production, `dev/` everywhere else (preview deploys,
 * `next dev`, `next start` locally). Sourced from the runtime, not a
 * hand-set env var, so nobody can accidentally point a dev deploy at prod
 * keys. R2 API tokens are bucket-scoped — this prefix is the only thing
 * keeping dev writes out of prod's namespace.
 */
export function keyPrefix() {
  return process.env.VERCEL_ENV === "production" ? "prod/" : "dev/"
}

/** `<env>/models/<userId>/<uploadId>/<format>.<ext>` — designer-scoped, collision-free. */
export function modelFileKey(args: {
  userId: string
  uploadId: string
  format: string
  extension: string
}) {
  const format = safeSegment(args.format)
  const ext = safeSegment(args.extension || format)
  return `${keyPrefix()}models/${args.userId}/${args.uploadId}/${format}.${ext}`
}

/** `<env>/images/<userId>/<uploadId>/<position>.<ext>` — preview images. */
export function modelImageKey(args: {
  userId: string
  uploadId: string
  position: number
  extension: string
}) {
  const ext = safeSegment(args.extension || "jpg")
  const position = String(args.position).padStart(2, "0")
  return `${keyPrefix()}images/${args.userId}/${args.uploadId}/${position}.${ext}`
}

function safeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
}
