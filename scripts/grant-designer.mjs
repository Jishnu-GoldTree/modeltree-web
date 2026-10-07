/**
 * Grants (or revokes) a seller account.
 *
 * Phase 1 sellers are GoldTree staff only, and `account_type` can only be
 * changed by the service role (see the guard_account_type migration), so this
 * is how one is made. Run from a terminal, never from the app.
 *
 *   node --env-file=.env.local scripts/grant-designer.mjs dana@goldtree.co.il
 *   node --env-file=.env.local scripts/grant-designer.mjs dana@goldtree.co.il --revoke
 */
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
const [email, flag] = process.argv.slice(2)
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY")
  process.exit(1)
}
if (!email) {
  console.error("Usage: grant-designer.mjs <email> [--revoke]")
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// listUsers pages at 50 by default; walk until the email turns up.
let user = null
for (let page = 1; !user; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
  if (error) {
    console.error("Could not list users:", error.message)
    process.exit(1)
  }
  user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null
  if (data.users.length < 200) break
}
if (!user) {
  console.error(`No account for ${email}. They need to sign up first.`)
  process.exit(1)
}

const accountType = flag === "--revoke" ? "buyer" : "designer"
const { error } = await supabase
  .from("profiles")
  .update({ account_type: accountType })
  .eq("id", user.id)
if (error) {
  console.error("Could not update profile:", error.message)
  process.exit(1)
}
console.log(`${email} is now a ${accountType}.`)
