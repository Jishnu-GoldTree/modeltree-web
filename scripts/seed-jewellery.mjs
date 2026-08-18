/**
 * Seeds the jewellery catalog.
 *
 * GoldTree's real library is ~40,000 pieces built in-house by four designers;
 * that import belongs with the R2 pipeline. This seeds a representative slice
 * across every category so the catalog, the filter rail and the facet counts
 * all have something real to work against.
 *
 * Prices are in agorot (1/100 of a shekel). Shekels are the stored currency:
 * Israel is the primary market and the client prices in ₪.
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

// Deliverables, not native CAD project files.
const CAD = ["STL", "OBJ"]
const CAD_PLUS = ["STL", "OBJ", "3MF"]
const PRINT = ["STL", "3MF"]

// title, category, metal, stone, production, ₪, grams, mm, formats
const PIECES = [
  ["Solitaire Engagement Ring (6 Prong)", "engagement-rings", "white-gold", "round", "cast", 420, 3.1, 17.3, CAD_PLUS],
  ["Halo Engagement Ring (Round Centre)", "engagement-rings", "white-gold", "round", "cast", 520, 3.8, 17.3, CAD_PLUS],
  ["Cathedral Solitaire (1ct)", "engagement-rings", "platinum", "round", "cast", 480, 4.2, 17.3, CAD],
  ["Three Stone Trilogy", "engagement-rings", "yellow-gold", "oval", "cast", 550, 4.0, 17.3, CAD_PLUS],
  ["Pear Halo with Split Shank", "engagement-rings", "rose-gold", "pear", "cast", 610, 4.4, 17.3, CAD],
  ["Emerald Cut Bezel Solitaire", "engagement-rings", "platinum", "emerald", "cast", 540, 4.1, 17.3, CAD],
  ["Marquise Vintage Halo", "engagement-rings", "white-gold", "marquise", "cast", 590, 3.9, 17.3, CAD_PLUS],
  ["Cushion Double Halo", "engagement-rings", "rose-gold", "cushion", "cast", 640, 4.6, 17.3, CAD],

  ["Eternity Band (Channel Set)", "wedding-bands", "white-gold", "princess", "cast", 390, 3.6, 17.3, CAD],
  ["Pavé Wedding Band (2.5mm)", "wedding-bands", "yellow-gold", "round", "cast", 260, 2.4, 17.3, CAD],
  ["Comfort Fit Plain Band (4mm)", "wedding-bands", "yellow-gold", "none", "both", 150, 4.8, 17.3, CAD],
  ["Milgrain Vintage Band", "wedding-bands", "rose-gold", "none", "cast", 210, 2.9, 17.3, CAD],
  ["Men's Brushed Band (6mm)", "wedding-bands", "platinum", "none", "both", 280, 7.2, 19.8, CAD],
  ["Half Eternity Shared Prong", "wedding-bands", "white-gold", "round", "cast", 340, 3.0, 17.3, CAD_PLUS],

  ["Signet Ring (Engravable Face)", "rings", "yellow-gold", "none", "both", 320, 6.1, 18.1, CAD],
  ["Cocktail Ring (Emerald Cut)", "rings", "white-gold", "emerald", "cast", 720, 5.4, 17.3, CAD_PLUS],
  ["Claddagh Ring (Traditional)", "rings", "silver", "none", "both", 180, 3.3, 17.3, CAD],
  ["Stacking Band Set (Three)", "rings", "rose-gold", "none", "print", 240, 2.1, 17.3, PRINT],
  ["Toi et Moi Bypass Ring", "rings", "yellow-gold", "pear", "cast", 560, 3.7, 17.3, CAD],
  ["Wide Statement Dome Ring", "rings", "yellow-gold", "none", "cast", 430, 8.9, 18.1, CAD],

  ["Bezel Set Oval Pendant", "pendants", "white-gold", "oval", "cast", 290, 1.9, 12.0, CAD],
  ["Solitaire Drop Pendant", "pendants", "yellow-gold", "round", "cast", 250, 1.4, 9.5, CAD],
  ["Locket Pendant (Hinged Oval)", "pendants", "yellow-gold", "none", "cast", 410, 5.2, 24.0, CAD_PLUS],
  ["Halo Cluster Pendant", "pendants", "white-gold", "cushion", "cast", 350, 2.2, 13.5, CAD],
  ["Bar Pendant (Engravable)", "pendants", "rose-gold", "none", "both", 190, 1.7, 28.0, CAD],

  ["Stud Earrings (4 Prong Martini)", "earrings", "white-gold", "round", "cast", 160, 1.1, 5.5, CAD],
  ["Drop Earrings (Pear Cut)", "earrings", "yellow-gold", "pear", "cast", 380, 2.6, 22.0, CAD_PLUS],
  ["Huggie Hoops (12mm)", "earrings", "yellow-gold", "none", "cast", 220, 2.0, 12.0, CAD],
  ["Chandelier Earrings (Marquise)", "earrings", "white-gold", "marquise", "cast", 640, 4.1, 38.0, CAD],
  ["Ear Climber (Pavé)", "earrings", "rose-gold", "round", "cast", 300, 1.8, 18.0, CAD],
  ["Threader Earrings (Fine Chain)", "earrings", "silver", "none", "cast", 140, 1.2, 60.0, CAD],

  ["Tennis Bracelet (4mm Links)", "bracelets", "white-gold", "round", "cast", 890, 9.4, 180.0, CAD_PLUS],
  ["Bangle (Hinged with Clasp)", "bracelets", "yellow-gold", "none", "cast", 620, 11.2, 62.0, CAD],
  ["Cuff Bracelet (Hammered)", "bracelets", "silver", "none", "both", 280, 14.0, 58.0, CAD],
  ["Charm Bracelet (Oval Links)", "bracelets", "yellow-gold", "none", "cast", 450, 8.1, 190.0, CAD],

  ["Cuban Link Chain (6mm)", "necklaces", "yellow-gold", "none", "cast", 680, 18.4, 550.0, CAD_PLUS],
  ["Fine Cable Chain (1.2mm)", "necklaces", "white-gold", "none", "cast", 210, 2.6, 450.0, CAD],
  ["Rope Chain (3mm)", "necklaces", "yellow-gold", "none", "cast", 420, 9.8, 500.0, CAD],
  ["Rivière Necklace (Graduated)", "necklaces", "platinum", "round", "cast", 1250, 12.6, 400.0, CAD_PLUS],

  ["Four Prong Head (6.5mm)", "settings", "white-gold", "round", "cast", 90, 0.4, 6.5, CAD],
  ["Six Prong Crown Head", "settings", "platinum", "round", "cast", 110, 0.5, 6.5, CAD],
  ["Bezel Mount (Oval 8x6)", "settings", "yellow-gold", "oval", "cast", 95, 0.6, 8.0, CAD],
  ["Halo Under-Gallery", "settings", "white-gold", "round", "cast", 130, 0.8, 11.0, CAD_PLUS],
  ["Emerald Cut V-Prong Mount", "settings", "platinum", "emerald", "cast", 120, 0.7, 9.0, CAD],

  ["Charm (Evil Eye)", "charms", "yellow-gold", "none", "both", 120, 1.3, 11.0, CAD],
  ["Charm (Hamsa)", "charms", "yellow-gold", "none", "both", 130, 1.5, 13.0, CAD],
  ["Charm (Star of David)", "charms", "silver", "none", "both", 100, 1.1, 12.0, CAD],
  ["Charm (Heart Locket)", "charms", "rose-gold", "none", "cast", 170, 1.9, 14.0, CAD],

  ["Brooch (Art Deco Fan)", "brooches", "platinum", "round", "cast", 780, 6.8, 42.0, CAD_PLUS],
  ["Brooch (Floral Spray)", "brooches", "yellow-gold", "oval", "cast", 660, 7.4, 48.0, CAD],
  ["Lapel Pin (Minimal Bar)", "brooches", "silver", "none", "print", 90, 2.2, 30.0, PRINT],

  ["Lobster Clasp (11mm)", "findings", "yellow-gold", "none", "cast", 45, 0.6, 11.0, CAD],
  ["Jump Ring Set (Assorted)", "findings", "silver", "none", "print", 35, 0.2, 6.0, PRINT],
  ["Earring Backs (Butterfly)", "findings", "white-gold", "none", "cast", 40, 0.3, 5.0, CAD],
  ["Ring Guard (Size Adjuster)", "findings", "yellow-gold", "none", "both", 55, 0.5, 17.3, CAD],
  ["Bail (Pinch Style)", "findings", "white-gold", "none", "cast", 50, 0.4, 8.0, CAD],
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

// The handle generator strips dots, so "e.mizrahi" becomes "emizrahi" — the
// display name is what carries the designer's real name on the storefront.
for (const [i, d] of DESIGNERS.entries()) {
  if (ids[i]) await db.from("profiles").update({ full_name: d.name }).eq("id", ids[i])
}

const { data: cats } = await db.from("categories").select("id, slug")
const catId = new Map((cats ?? []).map((c) => [c.slug, c.id]))

const slugify = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

const rows = PIECES.map(
  ([title, category, metal, stone, production, shekels, grams, mm, formats], i) => ({
    designer_id: ids[i % ids.length],
    category_id: catId.get(category),
    slug: slugify(title),
    title,
    description: `${title.split(" (")[0]} modelled for ${
      production === "print" ? "direct resin print" : "casting and direct resin print"
    }. Watertight geometry, correct metal thickness, and stone seats cut to standard sizes. Ring sizes and stone dimensions adjusted on request.`,
    status: "published",
    price_cents: shekels * 100,
    currency: "ILS",
    license_code: "royalty-free",
    metal,
    stone,
    production,
    weight_grams: grams,
    size_mm: mm,
    vertices: Math.round(grams * 5000 + 7000),
    download_count: Math.round(80 + ((i * 37) % 400)),
    // rating and review_count are deliberately absent: a trigger derives them
    // from the reviews table, and seeding numbers here invented an average with
    // no reviews behind it — a listing claiming 23 reviews and showing none.
    published_at: new Date(Date.now() - i * 3 * 86_400_000).toISOString(),
    formats,
  }),
)

const missing = rows.filter((r) => !r.category_id)
if (missing.length) {
  console.error(`missing categories for: ${missing.map((r) => r.slug).join(", ")}`)
  process.exit(1)
}

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
    size_bytes: Math.round(r.weight_grams * 10 + 60) * 1024,
  })),
)
await db.from("model_files").upsert(files, { onConflict: "storage_key" })

const { count } = await db
  .from("models")
  .select("id", { count: "exact", head: true })
  .eq("status", "published")
console.log(`published models: ${count}`)
