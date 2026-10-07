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
| Package mgr | pnpm (workspace at the repo root)     |

## Getting started

From the repo root:

```bash
pnpm install
pnpm dev:web      # http://localhost:3000
pnpm --filter modeltree build
pnpm --filter modeltree lint
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

**Provisioning** is version-controlled under `infra/r2/` (bucket
`modeltree-assets`, EEUR region hint). CORS and lifecycle live there as
JSON and are reapplied with `wrangler r2 bucket cors/lifecycle set`. See
`infra/r2/README.md` for the two commands and the one-time dashboard
step to mint an R2 API token.

**Storage layout:**

```
<env>/models/<userId>/<uploadId>/<format>.<ext>   private — signed download only
<env>/images/<userId>/<uploadId>/<position>.<ext> public via R2_PUBLIC_BASE_URL
```

`<env>` is `prod/` on Vercel production and `dev/` everywhere else,
derived at runtime from `VERCEL_ENV` in `lib/r2/presign.ts`. One bucket
serves every environment; R2 API tokens are bucket-scoped, so isolation
between dev and prod keys is enforced at the application layer only —
the prefix is never sourced from a hand-set env var.

`<userId>` is enforced by the presign endpoint (`src/app/api/uploads/presign/route.ts`)
so a signed-in designer cannot target another designer's namespace. The
`<uploadId>` is a UUID minted by the listing form, so a whole draft cleans up
as a single prefix delete. Stale `dev/` objects auto-expire after 7 days
via the lifecycle rule so local iteration doesn't accrete storage.

## Checkout and payments

Buyers pay in shekels through **PayPlus**'s hosted payment page, so card
data never touches this app. Flow:

1. `startCheckout` (`lib/actions/checkout.ts`) re-prices the cart from the
   database, creates a `pending` order with snapshotted lines
   (`lib/orders.ts`, service role) and redirects to the PayPlus page.
2. PayPlus calls `/api/payments/payplus/callback` (HMAC-signed) and returns
   the buyer to `/checkout/success?order=…`.
3. Both paths call PayPlus's `/PaymentPages/ipn` to check the charge, and only
   then flip the order to `paid` — idempotently, and only if the captured
   amount equals the order total. The `model_files_read` RLS policy admits the
   buyer to downloads the moment the order is `paid`.

A zero-total cart settles immediately without a payment page.

| Var                        | Meaning                                                           |
| -------------------------- | ----------------------------------------------------------------- |
| `PAYPLUS_API_KEY`          | PayPlus dashboard → Settings → API.                               |
| `PAYPLUS_SECRET_KEY`       | Same place. Also verifies callback signatures.                    |
| `PAYPLUS_PAYMENT_PAGE_UID` | The payment page to charge through (enable Bit / Apple Pay there). |
| `PAYPLUS_ENV`              | `production` for live; anything else uses the PayPlus sandbox.    |
| `NEXT_PUBLIC_SITE_URL`     | Public origin for return/callback URLs, e.g. `https://modeltree.co.il`. |
| `PAYMENTS_ALLOW_MOCK`      | `false` disables the mock provider outside production.            |

**Without PayPlus keys** checkout uses a mock provider: the "payment page" is
`/checkout/mock`, with approve/decline buttons. The mock is refused on Vercel
production (`VERCEL_ENV=production`), where checkout shows the "not connected
yet" notice instead of handing out files for free.

**Tax invoices** are issued by PayPlus when invoicing is enabled on the
terminal (Israel Tax Authority allocation numbers included); prices are sent as
VAT-inclusive (`vat_type: 0`).

PayPlus can't reach `localhost`, so in local development the order settles when
the buyer returns to the success page. Use the sandbox keys and a tunnel
(`cloudflared tunnel --url http://localhost:3000`, then set
`NEXT_PUBLIC_SITE_URL`) to exercise the callback itself.

## Sellers (phase 1)

GoldTree is the only seller. Every sign-up is a buyer; `account_type` can only
be changed by the service role (migration `…_designer_role_granted_only.sql`),
and only designers can create listings or get upload URLs. Grant a seller
account to a GoldTree staff member with:

```bash
node --env-file=.env.local scripts/grant-designer.mjs name@goldtree.co.il
```

Orders book the whole price as the seller's share (`platform_fee_cents = 0`)
until a commission is agreed for outside designers.

## Next up

Catalog browse + filters, model detail page, designer storefronts, auth,
cart and checkout, and the file-serving side of R2 (signed downloads,
preview image URLs).
