import "server-only"

import { S3Client } from "@aws-sdk/client-s3"

/**
 * Cloudflare R2 client.
 *
 * R2 is S3-compatible, so the AWS SDK works verbatim once the endpoint points
 * at Cloudflare and the region is hard-coded to `auto` (R2 has no regions in
 * the AWS sense — a region string is still required by the SDK). The client is
 * memoised because the underlying HTTPS agent is expensive to build and reuses
 * connections across requests on the same Fluid Compute instance.
 */
let cached: S3Client | undefined

export function r2() {
  if (cached) return cached

  const accountId = requireEnv("R2_ACCOUNT_ID")
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID")
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY")

  cached = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
  return cached
}

export function r2Bucket() {
  return requireEnv("R2_BUCKET")
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    // A missing R2 var is a deploy misconfiguration, not something to fall
    // back around. Fail loudly at the first use site so the error points at
    // config rather than at an opaque S3 SDK rejection later.
    throw new Error(`Missing ${name}. R2 upload requires it — see .env.local.`)
  }
  return value
}
