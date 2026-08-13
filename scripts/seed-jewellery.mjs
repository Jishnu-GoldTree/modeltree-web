/**
 * Seeds a sample of the jewellery library.
 *
 * GoldTree's real library is ~40,000 pieces built in-house by four designers
 * over two years. That import is a separate job (files, previews, categorisation
 * — it belongs with the R2 pipeline). This seeds a representative slice so the
 * jewellery category is not empty while the landing page advertises it.
 *
 *   node --env-file=.env.local scripts/seed-jewellery.mjs
 */
import { createClient } from "@supabase/supabase-js"

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
)

/** The four in-house designers, matching the "4 designers" claim on the page. */
const DESIGNERS = [
  { handle: "goldtree.studio", name: "GoldTree Studio" },
  { handle: "n.katz", name: "Noa Katz" },
  { handle: "e.mizrahi", name: "Eitan Mizrahi" },
  { handle: "r.shapira", name: "Rivka Shapira" },
]

const PIECES = [
  ["Solitaire Engagement Ring — 6 Prong", 4, 1800, ["STL", "3ds Max"]],
  ["Halo Ring — Round Brilliant Centre", 4, 2200, ["STL", "OBJ"]],
  ["Eternity Band — Channel Set", 3, 1500, ["STL"]],
  ["Cathedral Setting — 1ct", 4, 1950, ["STL", "OBJ"]],
  ["Pavé Wedding Band — 2.5mm", 2, 900, ["STL"]],
  ["Signet Ring — Engravable Face", 2, 1100, ["STL", "OBJ"]],
  ["Tennis Bracelet — 4mm Links", 5, 3400, ["STL", "3ds Max"]],
  ["Pendant — Bezel Set Oval", 3, 1250, ["STL"]],
  ["Drop Earrings — Pear Cut", 3, 1400, ["STL", "OBJ"]],
  ["Huggie Hoops — 12mm", 2, 850, ["STL"]],
  ["Three Stone Ring — Trilogy", 4, 2100, ["STL", "OBJ"]],
  ["Claddagh Ring — Traditional", 3, 1150, ["STL"]],
  ["Cuban Link Chain — 6mm", 4, 2600, ["STL", "3ds Max"]],
  ["Locket Pendant — Hinged Oval", 4, 1700, ["STL", "OBJ"]],
  ["Stud Earrings — 4 Prong Martini", 1, 600, ["STL"]],
  ["Bangle — Hinged with Clasp", 4, 2300, ["STL"]],
  ["Cocktail Ring — Emerald Cut", 5, 2800, ["STL", "OBJ"]],
  ["Charm — Evil Eye", 1, 450, ["STL"]],
  ["Nose Ring — Seamless Hoop", 1, 380, ["STL"]],
  ["Toe Ring — Adjustable Band", 1, 400, ["STL"]],
  ["Men's Band — Brushed Tungsten Profile", 2, 950, ["STL", "OBJ"]],
  ["Anklet — Fine Cable Chain", 2, 780, ["STL"]],
  ["Brooch — Art Deco Fan", 5, 2450, ["STL", "3ds Max"]],
  ["Ring Guard — Size Adjuster", 1, 320, ["STL"]],
]

const { data: users } = await db.auth.admin.listUsers({ perPage: 1000 })
const byEmail = new Map(users.users.map((u) => [u.email?.toLowerCase(), u]))
const ids = []

for (const d of DESIGNERS) {
  const email = `${d.handle.replace(/[^a-z0-9]/g, "")}@designers.modeltree.internal`
  let user = byEmail.get(email)
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: crypto.randomUUID() + crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: d.name, account_type: "designer" },
    })
    if (error) {
      console.error(`  ✗ ${d.handle}: ${error.message}`)
      continue
    }
    user = data.user
  }
  ids.push(user.id)
}
await new Promise((r) => setTimeout(r, 1200))
console.log(`designers: ${ids.length}/${DESIGNERS.length}`)

const { data: cat } = await db
  .from("categories")
  .select("id")
  .eq("slug", "jewelry")
  .single()

const rows = PIECES.map(([title, complexity, priceCents, formats], i) => ({
  designer_id: ids[i % ids.length],
  category_id: cat.id,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  title,
  description: `${title.split(" — ")[0]} modelled for casting and direct resin print. Watertight geometry, correct metal thickness, and stone seats cut to standard sizes. Ring sizes and stone dimensions adjusted on request.`,
  status: "published",
  price_cents: priceCents,
  license_code: "royalty-free",
  // Jewellery is dense, static geometry — never rigged or animated.
  rigged: false,
  animated: false,
  pbr: true,
  polygons: complexity * 24_000,
  vertices: complexity * 13_000,
  download_count: Math.round(200 + complexity * 137),
  rating: Math.round((4.2 + (complexity % 3) * 0.2) * 10) / 10,
  review_count: 8 + complexity * 5,
  published_at: new Date(Date.now() - i * 6 * 86_400_000).toISOString(),
  formats,
}))

const { data: saved, error } = await db
  .from("models")
  .upsert(rows, { onConflict: "slug" })
  .select("id, slug")
if (error) {
  console.error("models:", error.message)
  process.exit(1)
}

const idBySlug = new Map(saved.map((m) => [m.slug, m.id]))
const files = rows.flatMap((r) =>
  r.formats.map((format) => ({
    model_id: idBySlug.get(r.slug),
    format,
    storage_key: `models/${r.slug}/${format.toLowerCase().replace(/\s+/g, "-")}.zip`,
    size_bytes: Math.round(r.polygons / 900) * 1024,
  })),
)
await db.from("model_files").upsert(files, { onConflict: "storage_key" })

const { count } = await db
  .from("models")
  .select("id", { count: "exact", head: true })
  .eq("category_id", cat.id)
  .eq("status", "published")
console.log(`jewellery models published: ${count}`)
