# MODELTREE

A 3D model marketplace — designers upload and sell 3D assets, buyers license
and download them. Modeled on CGTrader.

**Status:** landing page complete. Catalog, auth, uploads and checkout are not
built yet.

## Stack

| Concern     | Choice                                |
| ----------- | ------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack)    |
| Language    | TypeScript                            |
| Styling     | Tailwind CSS v4 (`@theme` tokens)     |
| Components  | shadcn/ui (`new-york`, Radix UI base) |
| Forms       | React Hook Form + Zod                 |
| Package mgr | Yarn                                  |

## Getting started

```bash
yarn install
yarn dev          # http://localhost:3000
yarn build        # production build + typecheck
yarn lint
```

## Layout

```
src/
  app/
    page.tsx              # landing page — composes the sections below
    search/page.tsx       # stub, so the search form has a destination
    globals.css           # design tokens (brand palette lives here)
  components/
    landing/              # one file per landing-page band
    layout/               # header, footer, logo
    marketplace/          # model-card, thumb — reused beyond the landing page
    forms/                # RHF + Zod forms (search, newsletter)
    ui/                   # shadcn primitives — regenerate, don't hand-edit
  lib/
    data/landing.ts       # all landing copy and mock catalog data
    validations/forms.ts  # Zod schemas
```

### Where to change things

- **Copy, categories, trending models, nav, footer links** → `src/lib/data/landing.ts`.
  Section components are presentational; nothing is hardcoded in them.
- **Brand colors** → the `--brand*` and `--ink*` tokens in `src/app/globals.css`.
  `--brand` is the fill; `--brand-foreground` is text _on_ that fill;
  `--brand-accent` is the darkened variant that stays readable as text on white.
- **Page gutter** → the `.shell` class in `globals.css`, shared by every section
  so the bands stay aligned.

## Placeholder imagery

There is no asset pipeline yet, so `components/marketplace/thumb.tsx` generates
a deterministic "studio shot" per model from a seed string: dark stage,
perspective grid floor, lit subject. Hues are constrained to a cool band so a
full grid reads as one system. Replace `<Thumb>` with `next/image` once real
renders exist — the seed field on each record can go away with it.

## Cloudflare R2 uploads

Model files and preview images upload directly from the browser to R2 via
presigned PUT URLs — the app server never sees the bytes, so a 500 MB Rhino
file bypasses the Vercel Function body limit entirely.

Required env vars (see `.env.local`):

| Var                    | Meaning                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `R2_ACCOUNT_ID`        | Cloudflare account id — used to derive the S3 endpoint.    |
| `R2_ACCESS_KEY_ID`     | R2 API token access key.                                   |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret.                                       |
| `R2_BUCKET`            | Bucket name. Keep model files private.                     |
| `R2_PUBLIC_BASE_URL`   | Public base for preview images (custom domain or Worker).  |

**Bucket CORS** must allow PUT from the dev and production origins, e.g.:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3001", "https://modeltree.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**Storage layout:**

```
models/<userId>/<uploadId>/<format>.<ext>   private — signed download only
images/<userId>/<uploadId>/<position>.<ext> public via R2_PUBLIC_BASE_URL
```

`<userId>` is enforced by the presign endpoint (`src/app/api/uploads/presign/route.ts`)
so a signed-in designer cannot target another designer's namespace. The
`<uploadId>` is a UUID minted by the listing form, so a whole draft cleans up
as a single prefix delete.

## Next up

Catalog browse + filters, model detail page, designer storefronts, auth,
cart and checkout, and the file-serving side of R2 (signed downloads,
preview image URLs).
