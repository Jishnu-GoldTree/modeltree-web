/**
 * Wipes seeded marketplace content and the demo accounts, leaving reference
 * data (categories, licenses) and platform admins intact. This is the "clean
 * slate before realistic seeding" step.
 *
 * Service-role key: terminal-only, never the app. Dry-run by default — it
 * prints what it would delete and touches nothing. Pass --yes to execute.
 *
 *   node --env-file=.env.local scripts/reset-data.mjs          # inspect
 *   node --env-file=.env.local scripts/reset-data.mjs --yes     # delete
 */
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY")
  process.exit(1)
}

const EXECUTE = process.argv.includes("--yes")
const db = createClient(url, key, { auth: { persistSession: false } })

// Child → parent. RESTRICT foreign keys (order_items→models, orders→buyer,
// payouts→designer) mean the referencing rows must go first, so order matters.
// Everything here is seeded content; categories/licenses/admin_users are not
// listed and survive.
const TABLES = [
  ["request_messages", "id"],
  ["requests", "id"],
  ["reviews", "id"],
  ["favorites", "profile_id"],
  ["order_items", "id"],
  ["orders", "id"],
  ["payouts", "id"],
  ["model_files", "id"],
  ["model_images", "id"],
  ["models", "id"],
  ["jobs", "id"],
]

const count = async (table) => {
  const { count, error } = await db
    .from(table)
    .select("*", { count: "exact", head: true })
  if (error) throw new Error(`${table}: ${error.message}`)
  return count ?? 0
}

// Admin profile ids are preserved along with their auth accounts, so the
// platform is never left without a way in. Include revoked admins too: their
// audit trail (actor_id) should keep resolving to a real profile.
const { data: admins, error: adminErr } = await db
  .from("admin_users")
  .select("id, role, revoked_at")
if (adminErr) {
  console.error(`Could not read admin_users: ${adminErr.message}`)
  process.exit(1)
}
const adminIds = new Set(admins.map((a) => a.id))

const { data: userList, error: userErr } = await db.auth.admin.listUsers({
  perPage: 1000,
})
if (userErr) {
  console.error(`Could not list auth users: ${userErr.message}`)
  process.exit(1)
}
const toDelete = userList.users.filter((u) => !adminIds.has(u.id))
const kept = userList.users.filter((u) => adminIds.has(u.id))

console.log(`\n${EXECUTE ? "DELETING" : "DRY RUN — would delete"}:\n`)
for (const [table] of TABLES) {
  console.log(`  ${table.padEnd(18)} ${await count(table)} row(s)`)
}
console.log(`  ${"auth users".padEnd(18)} ${toDelete.length} account(s)`)

console.log(`\nPreserved:`)
console.log(`  categories, licenses (reference data)`)
console.log(
  `  ${kept.length} admin account(s): ${
    kept.map((u) => u.email).join(", ") || "none"
  }`,
)
console.log(
  `  accounts to remove: ${toDelete.map((u) => u.email).join(", ") || "none"}`,
)

if (!EXECUTE) {
  console.log(`\nNothing changed. Re-run with --yes to execute.\n`)
  process.exit(0)
}

console.log(`\nDeleting content…`)
for (const [table, keycol] of TABLES) {
  const { error } = await db.from(table).delete().not(keycol, "is", null)
  console.log(error ? `  ✗ ${table}: ${error.message}` : `  ✓ ${table}`)
}

console.log(`\nDeleting demo accounts (cascades to their profiles)…`)
let removed = 0
for (const u of toDelete) {
  const { error } = await db.auth.admin.deleteUser(u.id)
  if (error) console.log(`  ✗ ${u.email}: ${error.message}`)
  else removed++
}
console.log(`  removed ${removed}/${toDelete.length} account(s)`)

console.log(`\nDone.\n`)
