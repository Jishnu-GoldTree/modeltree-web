/**
 * Seeds the catalog into Postgres from scripts/catalog-seed.json.
 *
 * The JSON is a dump of the old in-memory generator, so the database starts out
 * showing exactly what the app already showed — the swap from fixtures to real
 * queries is then observable as "nothing changed", which is the point.
 *
 * Uses the service-role key (bypasses RLS), so it runs from a terminal only.
 * Idempotent: re-running upserts by slug rather than duplicating.
 *
 *   node --env-file=.env.local scripts/seed-catalog.mjs
 */
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY")
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })

const models = JSON.parse(readFileSync(new URL("./catalog-seed.json", import.meta.url)))

/* ── designers ──────────────────────────────────────────────────────────────
   models.designer_id references profiles, which references auth.users, so each
   author needs a real account. Created confirmed with an unguessable password:
   these are catalog fixtures, not sign-in-able demo accounts. */
const handles = [...new Set(models.map((m) => m.author))]
const { data: existing } = await db.auth.admin.listUsers({ perPage: 1000 })
const byEmail = new Map(existing.users.map((u) => [u.email?.toLowerCase(), u]))
const designerId = new Map()

for (const handle of handles) {
  const email = `${handle.replace(/[^a-z0-9]/g, "")}@designers.modeltree.internal`
  let user = byEmail.get(email)
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: crypto.randomUUID() + crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: handle, account_type: "designer" },
    })
    if (error) {
      console.error(`  ✗ designer ${handle}: ${error.message}`)
      continue
    }
    user = data.user
  }
  designerId.set(handle, user.id)
}
console.log(`designers: ${designerId.size}/${handles.length}`)

// The signup trigger writes profiles, but it is asynchronous relative to us.
await new Promise((r) => setTimeout(r, 1200))

const { data: cats } = await db.from("categories").select("id, slug")
const categoryId = new Map(cats.map((c) => [c.slug, c.id]))

/* ── models ─────────────────────────────────────────────────────────────── */
const rows = models
  .filter((m) => designerId.has(m.author) && categoryId.has(m.category))
  .map((m) => ({
    designer_id: designerId.get(m.author),
    category_id: categoryId.get(m.category),
    slug: m.slug,
    title: m.title,
    description: m.description,
    status: "published",
    // Prices were whole dollars in the fixture; the column is cents.
    price_cents: m.price === "free" ? 0 : m.price * 100,
    license_code: m.license,
    rigged: m.rigged,
    animated: m.animated,
    pbr: m.pbr,
    polygons: m.polygons,
    vertices: m.vertices,
    download_count: m.downloads,
    // No rating or review_count: a trigger derives both from the reviews table,
    // and the fixture's numbers described reviews that were never inserted.
    // ageDays is relative, so turn it into a real timestamp once, here.
    published_at: new Date(Date.now() - m.ageDays * 86_400_000).toISOString(),
  }))

const { data: saved, error } = await db
  .from("models")
  .upsert(rows, { onConflict: "slug" })
  .select("id, slug")
if (error) {
  console.error("models:", error.message)
  process.exit(1)
}
console.log(`models: ${saved.length} upserted`)

/* ── files ──────────────────────────────────────────────────────────────────
   Placeholder storage keys. Real objects arrive with the upload pipeline; the
   rows exist now so the product page and the download paywall have something
   to enforce against. */
const idBySlug = new Map(saved.map((m) => [m.slug, m.id]))
const files = models.flatMap((m) =>
  (m.formats ?? []).map((format) => ({
    model_id: idBySlug.get(m.slug),
    format,
    storage_key: `models/${m.slug}/${format.toLowerCase().replace(/\s+/g, "-")}.zip`,
    size_bytes: Math.round((m.polygons / 42_000 + 4) * 1_048_576),
  })),
)
const { error: fileError, count } = await db
  .from("model_files")
  .upsert(files, { onConflict: "storage_key", count: "exact" })
if (fileError) console.error("files:", fileError.message)
else console.log(`files: ${count ?? files.length} upserted`)

const { count: total } = await db
  .from("models")
  .select("id", { count: "exact", head: true })
  .eq("status", "published")
console.log(`\npublished models in catalog: ${total}`)
