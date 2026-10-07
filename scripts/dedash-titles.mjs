/**
 * One-off: rewrite the em dash out of model titles already in the database.
 *
 * The seed files were updated in the same pass, so a fresh seed produces the
 * new form; this brings existing rows into line without re-seeding. Titles use
 * the em dash as a name/qualifier separator ("Rally Car — Rigged"), which
 * becomes parentheses ("Rally Car (Rigged)").
 *
 * Slugs are never touched. They are public URLs and 192 of these pages are
 * prerendered, so moving them would 404 every existing link.
 *
 *   node --env-file=.env.local scripts/dedash-titles.mjs [--dry]
 */
import { createClient } from "@supabase/supabase-js"

const dry = process.argv.includes("--dry")

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
)

const retitle = (title) => {
  const m = title.match(/^(.*?) — (.*)$/)
  return m ? `${m[1].trim()} (${m[2].trim()})` : title
}

const { data: rows, error } = await db
  .from("models")
  .select("id, slug, title, description")
if (error) {
  console.error(error.message)
  process.exit(1)
}

const edits = []
for (const row of rows) {
  const title = retitle(row.title)
  // Descriptions are prose; an em dash there reads as a comma or a colon, so
  // they are reported rather than rewritten blind.
  if (row.description?.includes("—")) {
    console.warn(`  description still has an em dash: ${row.slug}`)
  }
  if (title !== row.title) edits.push({ id: row.id, slug: row.slug, from: row.title, to: title })
}

console.log(`${rows.length} models, ${edits.length} titles to rewrite`)
for (const e of edits.slice(0, 3)) console.log(`  ${e.from}  ->  ${e.to}`)
if (edits.length > 3) console.log(`  … and ${edits.length - 3} more`)

if (dry) {
  console.log("dry run, nothing written")
  process.exit(0)
}

for (const e of edits) {
  const { error } = await db.from("models").update({ title: e.to }).eq("id", e.id)
  if (error) console.error(`  ✗ ${e.slug}: ${error.message}`)
}

const { data: after } = await db.from("models").select("slug, title")
const left = after.filter((m) => m.title.includes("—"))
console.log(`done. titles still holding an em dash: ${left.length}`)
