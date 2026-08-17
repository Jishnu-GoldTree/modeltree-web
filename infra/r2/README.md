# R2 bucket provisioning

One bucket serves every environment: `modeltree-assets` (Eastern Europe
region hint — nearest available to Israel). Environments are separated by
key prefix, derived at runtime from `VERCEL_ENV`:

- `prod/…` — production
- `dev/…` — everything else (local dev, preview deploys, `next start` locally)

R2 API tokens are bucket-scoped, not prefix-scoped, so a leaked dev token
technically has the same reach as a prod one. Isolation is at the
application layer only — the prefix is derived from the runtime, never
from a hand-set env var. If that ever becomes insufficient, split into
`modeltree-dev` + `modeltree-prod` and mint separate tokens.

## Files

- `cors.json` — allows `PUT` from local dev and deployed origins so the
  browser can upload directly to R2 via presigned URLs. `Content-Type` is the
  only header the SDK sends on those PUTs; add more here only if that changes.

  Origins must be exact — R2 takes a literal `Origin` header value
  (`scheme://host[:port]`), so there is no `https://*.vercel.app` to fall back
  on. That means only Vercel's **stable aliases** can upload: production and
  the per-branch `…-git-<branch>-…` URLs, which are listed here. The unique
  per-deployment URL (`modeltree-<hash>-…`) changes every push and cannot be
  enumerated, so test uploads on the branch alias, not on a specific
  deployment. Registering a custom domain means adding it here and re-running
  the command below — nothing picks it up automatically.
- `lifecycle.json` — expires `dev/` objects after 7 days and aborts stale
  multipart uploads under both prefixes.

## Applying

```sh
wrangler r2 bucket cors set modeltree-assets --file infra/r2/cors.json --force
wrangler r2 bucket lifecycle set modeltree-assets --file infra/r2/lifecycle.json --force
```

Both commands overwrite the whole config — treat these JSON files as the
source of truth. Editing rules in the dashboard drifts silently from the
repo; re-run the commands after any change.

## Public read Worker (`../../workers/assets-cdn`)

Preview images are served publicly via a Worker at
`https://modeltree-assets-cdn.<subdomain>.workers.dev` (subdomain not
registered yet — see below). The Worker fronts the bucket via a native R2
binding: no S3 credentials are used or exposed, and only `<env>/images/*`
is served — `<env>/models/*` returns 403 regardless of the key. Keys use
UUIDs so responses cache forever (`Cache-Control: public, max-age=31536000, immutable`).

Deploy: `wrangler deploy --config workers/assets-cdn/wrangler.jsonc`.

### One-time dashboard step

Cloudflare requires each account to pick a workers.dev subdomain the first
time before workers.dev URLs resolve. Visit
`https://dash.cloudflare.com/c91f1311bbd0950bb02be4d54bb84fe9/workers/subdomain`
and pick a name (e.g. `goldtree` or `modeltree`). After that,
`modeltree-assets-cdn.<subdomain>.workers.dev` starts responding.

### Wiring the app to it (not done yet)

When the subdomain (or a custom domain) is ready, set
`R2_PUBLIC_BASE_URL=https://modeltree-assets-cdn.<subdomain>.workers.dev`
in `.env.local` and on Vercel, then replace the `presignGet` calls in
`src/lib/data/catalog.ts` and `src/lib/data/designer.ts` with
`${R2_PUBLIC_BASE_URL}/${storage_key}` — signed URLs re-fetch on every
render because the signature changes; the Worker URL is stable so the
image optimizer can actually cache it.

## API token

Wrangler cannot mint R2 API tokens; do it once in the dashboard:

1. R2 → Manage R2 API Tokens → **Create API Token**
2. Permission: **Object Read & Write**
3. Bucket: **Apply to specific buckets** → `modeltree-assets`
4. TTL: leave forever (or set per your rotation policy)
5. Copy the access key id + secret into `.env.local` and Vercel (preview +
   prod) as `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`.
