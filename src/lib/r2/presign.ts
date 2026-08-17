import "server-only"

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
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
