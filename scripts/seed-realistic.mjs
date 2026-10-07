/**
 * Seeds 30 designers and their published listings from the prepared render
 * folders in ../seed-data. Each folder (named by a GoldTree catalog ref) holds
 * one R-prefixed technical CAD sheet and three SS/snapshot beauty renders; per
 * the plan we upload the hero beauty render + one variant + the R sheet to R2
 * and publish one model owned by one designer.
 *
 * Cover is the beauty render (position 0), not the busy spec sheet — the sheet
 * is kept last in the gallery. Images go to the PRIVATE bucket and the catalog
 * serves them through 1-day signed URLs, so the stored key just has to match
 * where the bytes land.
 *
 * Service-role + R2 write creds: terminal-only. Idempotent — a stable uploadId
 * per folder overwrites the same objects, models upsert by slug, and image/file
 * rows upsert by storage_key, so a re-run reconciles instead of duplicating.
 *
 *   node --env-file=.env.local scripts/seed-realistic.mjs
 */
import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const {
  NEXT_PUBLIC_SUPABASE_URL: SB_URL,
  SUPABASE_SECRET_KEY: SB_KEY,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
} = process.env

for (const [k, v] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SB_URL,
  SUPABASE_SECRET_KEY: SB_KEY,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
})) {
  if (!v) {
    console.error(`Missing ${k} in .env.local`)
    process.exit(1)
  }
}

const SEED_DIR = resolve(process.cwd(), process.argv[2] ?? "../seed-data")
// The production deployment serves with keyPrefix() === "prod/" (VERCEL_ENV),
// so store keys under prod/ regardless of where this script runs.
const KEY_PREFIX = "prod/"

const db = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } })
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

// ── Designers ────────────────────────────────────────────────────────────
// Israeli jewelers; Ramat Gan is the diamond-exchange hub, hence its weight.
// full_name + account_type ride in on user_metadata (the signup trigger reads
// them); handle is auto-derived from the email local-part like a real signup.
const CITIES_BLURB = {
  "Ramat Gan": "the Ramat Gan diamond exchange",
  "Tel Aviv": "a Tel Aviv studio",
  Jerusalem: "a Jerusalem workshop",
  Netanya: "a Netanya bench",
  Herzliya: "a Herzliya studio",
  Haifa: "a Haifa workshop",
}
const SPECIALTIES = [
  "bridal and solitaire settings",
  "eternity and anniversary bands",
  "bespoke cluster work",
  "hand-finished signets",
  "fine chain and pendantry",
  "halo and pavé settings",
  "classic four-prong mounts",
  "made-to-order engagement pieces",
]
const DESIGNERS = [
  ["Noa Katz", "Ramat Gan"],
  ["Eitan Mizrahi", "Tel Aviv"],
  ["Rivka Shapira", "Jerusalem"],
  ["Yael Barkai", "Netanya"],
  ["Amir Peretz", "Ramat Gan"],
  ["Tamar Cohen", "Herzliya"],
  ["Daniel Azoulay", "Tel Aviv"],
  ["Shira Levi", "Ramat Gan"],
  ["Ori Ben-David", "Haifa"],
  ["Maya Friedman", "Haifa"],
  ["Gilad Rosen", "Ramat Gan"],
  ["Liora Adler", "Jerusalem"],
  ["Avi Segal", "Tel Aviv"],
  ["Michal Weiss", "Netanya"],
  ["Yonatan Har-Even", "Ramat Gan"],
  ["Efrat Golan", "Herzliya"],
  ["Boaz Hadad", "Tel Aviv"],
  ["Sivan Nachmias", "Ramat Gan"],
  ["Nadav Klein", "Tel Aviv"],
  ["Hila Sasson", "Netanya"],
  ["Roi Dayan", "Ramat Gan"],
  ["Adi Malka", "Herzliya"],
  ["Lior Ganz", "Tel Aviv"],
  ["Tal Vardi", "Ramat Gan"],
  ["Meirav Ohana", "Netanya"],
  ["Elior Tzur", "Jerusalem"],
  ["Dana Rubin", "Ramat Gan"],
  ["Yossi Elbaz", "Tel Aviv"],
  ["Keren Amsalem", "Ramat Gan"],
  ["Itai Sharabi", "Tel Aviv"],
]

// ── Per-piece metadata, keyed by folder (catalog) code ─────────────────────
// [category, title, metal, stone, production, shekels, formats]
const META = {
  R00600: ["engagement-rings", "Marquise Solitaire (Twist Shank)", "yellow-gold", "marquise", "cast", 560, ["3dm", "stl", "obj"]],
  R00818: ["engagement-rings", "Petite Round Solitaire", "yellow-gold", "round", "cast", 420, ["3dm", "stl", "obj"]],
  R00819: ["engagement-rings", "Bypass Solitaire", "rose-gold", "round", "cast", 480, ["3dm", "stl", "obj"]],
  R00820: ["rings", "Flower Cluster Ring", "yellow-gold", "round", "cast", 430, ["3dm", "stl", "obj"]],
  R00821: ["engagement-rings", "Cathedral Solitaire (Accented)", "yellow-gold", "round", "cast", 520, ["3dm", "stl", "obj"]],
  R00822: ["engagement-rings", "Classic Four-Prong Solitaire", "white-gold", "round", "cast", 450, ["3dm", "stl", "obj"]],
  R00823: ["rings", "Love Knot Ring", "rose-gold", "none", "both", 240, ["3dm", "stl", "3mf"]],
  R00824: ["rings", "Twist Knot Ring (Accent)", "yellow-gold", "round", "cast", 280, ["3dm", "stl"]],
  R00825: ["engagement-rings", "Solitaire with Side Stones", "yellow-gold", "round", "cast", 540, ["3dm", "stl", "obj"]],
  R00826: ["rings", "Daisy Cluster Ring", "yellow-gold", "round", "cast", 410, ["3dm", "stl", "obj"]],
  R00827: ["engagement-rings", "Floral Halo Ring", "rose-gold", "round", "cast", 610, ["3dm", "stl", "obj"]],
  R00828: ["rings", "Swirl Ring (Solitaire Accent)", "rose-gold", "round", "cast", 320, ["3dm", "stl"]],
  R00829: ["rings", "Knot Ring (Petite Stone)", "yellow-gold", "round", "cast", 260, ["3dm", "stl"]],
  R00830: ["engagement-rings", "Delicate Solitaire", "yellow-gold", "round", "cast", 400, ["3dm", "stl", "obj"]],
  R10000: ["rings", "Polished Dome Ring", "rose-gold", "none", "both", 290, ["3dm", "stl", "3mf"]],
  R10001: ["wedding-bands", "Half-Eternity Band (Claw Set)", "white-gold", "round", "cast", 340, ["3dm", "stl", "obj"]],
  R10002: ["wedding-bands", "Three-Stone Accent Band", "yellow-gold", "round", "cast", 300, ["3dm", "stl", "obj"]],
  R10003: ["wedding-bands", "Beaded Eternity Band", "yellow-gold", "round", "cast", 390, ["3dm", "stl", "obj"]],
  R10004: ["wedding-bands", "Full Eternity Band (4mm)", "white-gold", "round", "cast", 420, ["3dm", "stl", "obj"]],
  R10005: ["engagement-rings", "Pavé Shoulder Solitaire", "white-gold", "round", "cast", 650, ["3dm", "stl", "obj"]],
  R10006: ["engagement-rings", "Oval Halo Solitaire", "yellow-gold", "oval", "cast", 690, ["3dm", "stl", "obj"]],
  R10007: ["wedding-bands", "Five-Stone Anniversary Band", "rose-gold", "round", "cast", 360, ["3dm", "stl", "obj"]],
  R10009: ["engagement-rings", "Raised Crown Solitaire", "platinum", "round", "cast", 720, ["3dm", "stl", "obj"]],
  R10010: ["engagement-rings", "Cathedral Round Solitaire", "white-gold", "round", "cast", 600, ["3dm", "stl", "obj"]],
  R10011: ["wedding-bands", "Scattered Diamond Band", "yellow-gold", "round", "cast", 330, ["3dm", "stl", "obj"]],
  R10012: ["engagement-rings", "Accented Band Solitaire", "rose-gold", "round", "cast", 560, ["3dm", "stl", "obj"]],
  R10014: ["engagement-rings", "Tall Prong Solitaire", "yellow-gold", "round", "cast", 520, ["3dm", "stl", "obj"]],
  R10025: ["rings", "Petite Signet Ring", "yellow-gold", "none", "print", 310, ["stl", "3mf"]],
  R10026: ["rings", "Square-Face Signet", "white-gold", "none", "both", 350, ["3dm", "stl", "3mf"]],
  R10027: ["engagement-rings", "Split-Shank Solitaire", "white-gold", "round", "cast", 740, ["3dm", "stl", "obj"]],
}

const METAL_LABEL = {
  "yellow-gold": "yellow gold",
  "white-gold": "white gold",
  "rose-gold": "rose gold",
  platinum: "platinum",
  silver: "silver",
}
const STONE_LABEL = {
  round: "round brilliant",
  princess: "princess",
  oval: "oval",
  emerald: "emerald",
  pear: "pear",
  marquise: "marquise",
  cushion: "cushion",
}
const CAT_NOUN = {
  "engagement-rings": "engagement ring",
  "wedding-bands": "wedding band",
  rings: "ring",
}
const STOP = new Set(["the", "and", "with", "for", "set", "mm", "ct"])
const FILE_EXT = { "3dm": "3dm", stl: "stl", obj: "obj", "3mf": "3mf", step: "step", fbx: "fbx", max: "max" }
const AVG_FILE_KB = { "3dm": 4200, stl: 2600, obj: 1900, "3mf": 1500, step: 3100, fbx: 2200, max: 5200 }

const hash = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
const slugify = (t) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)

// PNG dimensions live in the IHDR chunk right after the 8-byte signature.
const pngSize = (buf) => ({ width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) })

const describe = (title, cat, metal, stone) => {
  const noun = CAT_NOUN[cat] ?? "piece"
  const set =
    stone === "none"
      ? "in polished metal with clean, hand-finished bevels"
      : `set with a ${STONE_LABEL[stone]}-cut centre stone`
  const sizing =
    stone === "none"
      ? "Ring sizes adjusted on request."
      : "Ring sizes and stone dimensions adjusted on request."
  return `${title} — a ${METAL_LABEL[metal]} ${noun} ${set}. Watertight, casting-ready geometry with correct wall thickness and stone seats cut to standard sizes. ${sizing}`
}

const makeTags = (title, cat, stone, metal) => {
  const words = title
    .toLowerCase()
    .replace(/[()]/g, " ")
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
  const base = cat.split("-")
  const stoneTag = stone !== "none" ? [stone] : []
  return [...new Set([...base, ...words, ...stoneTag, metal])].slice(0, 10)
}

// Look up the category ids once.
const { data: cats, error: catErr } = await db.from("categories").select("id, slug")
if (catErr) {
  console.error(`categories: ${catErr.message}`)
  process.exit(1)
}
const catId = new Map(cats.map((c) => [c.slug, c.id]))

// Existing users, so a re-run reuses accounts instead of failing on the email.
const { data: existing } = await db.auth.admin.listUsers({ perPage: 1000 })
const byEmail = new Map(existing.users.map((u) => [u.email?.toLowerCase(), u]))

const folders = readdirSync(SEED_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^R\d+$/.test(d.name))
  .map((d) => d.name)
  .sort()

if (folders.length !== DESIGNERS.length) {
  console.warn(`⚠ ${folders.length} folders but ${DESIGNERS.length} designers — pairing the overlap.`)
}

const uploadPng = async (key, absPath) => {
  const body = readFileSync(absPath)
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/png",
      ContentLength: body.length,
    }),
  )
  return pngSize(body)
}

const pick = (dir, primary, fallback) => {
  const files = readdirSync(dir)
  return files.includes(primary) ? primary : fallback
}

let ok = 0
const n = Math.min(folders.length, DESIGNERS.length)
for (let i = 0; i < n; i++) {
  const code = folders[i]
  const meta = META[code]
  const [name, city] = DESIGNERS[i]
  if (!meta) {
    console.log(`  ⚠ ${code}: no metadata, skipped`)
    continue
  }
  const [cat, title, metal, stone, prod, shekels, formats] = meta

  // 1. Account (idempotent). Handle is derived from the email by the trigger.
  const first = name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "")
  const last = name.split(" ").slice(1).join("").toLowerCase().replace(/[^a-z]/g, "")
  const email = `${first}.${last}@designers.modeltree.internal`
  let user = byEmail.get(email.toLowerCase())
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: crypto.randomUUID() + crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: name, account_type: "designer" },
    })
    if (error) {
      console.log(`  ✗ ${code} (${name}): ${error.message}`)
      continue
    }
    user = data.user
  }

  const bio = `Bench jeweler and CAD modeler at ${CITIES_BLURB[city] ?? `a ${city} studio`}, specialising in ${SPECIALTIES[hash(code) % SPECIALTIES.length]}.`
  await db
    .from("profiles")
    .update({ full_name: name, bio, location: `${city}, Israel`, account_type: "designer" })
    .eq("id", user.id)

  // 2. Images → private R2. 0 = hero beauty render (cover), 1 = variant, 2 = R sheet.
  const dir = join(SEED_DIR, code)
  const hero = pick(dir, "SS10.png", "snapshot.png")
  const variant = pick(dir, "SS10 (1).png", "snapshot (1).png")
  const rSheet = `${code}.png`
  const imageSources = [hero, variant, rSheet]

  const imageRows = []
  let uploadFailed = false
  for (let pos = 0; pos < imageSources.length; pos++) {
    const key = `${KEY_PREFIX}images/${user.id}/${code}/${String(pos).padStart(2, "0")}.png`
    try {
      const { width, height } = await uploadPng(key, join(dir, imageSources[pos]))
      imageRows.push({ storage_key: key, position: pos, width, height })
    } catch (e) {
      console.log(`  ✗ ${code}: upload ${imageSources[pos]} → ${e.message}`)
      uploadFailed = true
      break
    }
  }
  if (uploadFailed) continue

  // 3. Model row (upsert by slug).
  const h = hash(code)
  const weight = Math.round((2 + (h % 30) / 10) * 100) / 100
  const model = {
    designer_id: user.id,
    category_id: catId.get(cat),
    slug: slugify(title),
    title,
    description: describe(title, cat, metal, stone),
    status: "published",
    price_cents: shekels * 100,
    currency: "ILS",
    license_code: "standard",
    metal,
    stone,
    production: prod,
    weight_grams: weight,
    size_mm: 17.3,
    vertices: Math.round(weight * 5000 + 7000),
    download_count: 40 + (h % 380),
    published_at: new Date(Date.now() - (i * 2 + (h % 5)) * 86_400_000).toISOString(),
    tags: makeTags(title, cat, stone, metal),
  }
  const { data: saved, error: modelErr } = await db
    .from("models")
    .upsert(model, { onConflict: "slug" })
    .select("id")
    .single()
  if (modelErr) {
    console.log(`  ✗ ${code}: model ${modelErr.message}`)
    continue
  }

  // 4. Images rows (upsert by storage_key) + placeholder file rows so the
  //    format chips and "what you get" sizes populate via the sync trigger.
  //    No 3D bytes were supplied, so downloads of these keys will 404.
  const images = imageRows.map((r) => ({ model_id: saved.id, ...r }))
  const { error: imgErr } = await db
    .from("model_images")
    .upsert(images, { onConflict: "storage_key" })
  if (imgErr) console.log(`  ⚠ ${code}: images ${imgErr.message}`)

  const fileRows = formats.map((f) => ({
    model_id: saved.id,
    format: f,
    storage_key: `${KEY_PREFIX}models/${user.id}/${code}/${f}.${FILE_EXT[f]}`,
    size_bytes: Math.round((AVG_FILE_KB[f] + (h % 800)) * 1024),
  }))
  const { error: fileErr } = await db
    .from("model_files")
    .upsert(fileRows, { onConflict: "storage_key" })
  if (fileErr) console.log(`  ⚠ ${code}: files ${fileErr.message}`)

  ok++
  console.log(`  ✓ ${code} → ${name} · ${title}`)
}

const { count } = await db
  .from("models")
  .select("id", { count: "exact", head: true })
  .eq("status", "published")
console.log(`\n${ok}/${n} listings seeded. Published models now: ${count}.\n`)
