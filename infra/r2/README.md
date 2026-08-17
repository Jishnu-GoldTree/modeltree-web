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

- `cors.json` — allows `PUT` from local dev and prod origins so the browser
  can upload directly to R2 via presigned URLs. `Content-Type` is the only
  header the SDK sends on those PUTs; add more here only if that changes.
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

## API token

Wrangler cannot mint R2 API tokens; do it once in the dashboard:

1. R2 → Manage R2 API Tokens → **Create API Token**
2. Permission: **Object Read & Write**
3. Bucket: **Apply to specific buckets** → `modeltree-assets`
4. TTL: leave forever (or set per your rotation policy)
5. Copy the access key id + secret into `.env.local` and Vercel (preview +
   prod) as `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`.
