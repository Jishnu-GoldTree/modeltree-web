/**
 * Creates the demo accounts as real Supabase users.
 *
 * Uses the service-role key, so it must only ever run from a terminal — never
 * from the app. Idempotent: re-running updates the password instead of failing
 * on a duplicate email.
 *
 *   node --env-file=.env.local scripts/seed-users.mjs
 */
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY")
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS = [
  {
    email: "omri@goldtree.com",
    password: "demo1234",
    full_name: "Omri GoldTree",
    account_type: "buyer",
  },
  {
    email: "designer@modeltree.demo",
    password: "demo1234",
    full_name: "Kamara Bay",
    account_type: "designer",
  },
]

const { data: existing, error: listError } = await supabase.auth.admin.listUsers()
if (listError) {
  console.error("Could not list users:", listError.message)
  process.exit(1)
}

for (const user of USERS) {
  const found = existing.users.find(
    (u) => u.email?.toLowerCase() === user.email.toLowerCase(),
  )

  const payload = {
    email: user.email,
    password: user.password,
    // Confirmed up front: these are fixtures and no one can click a link sent
    // to modeltree.demo, which does not resolve.
    email_confirm: true,
    user_metadata: { full_name: user.full_name, account_type: user.account_type },
  }

  const { error } = found
    ? await supabase.auth.admin.updateUserById(found.id, payload)
    : await supabase.auth.admin.createUser(payload)

  console.log(
    error
      ? `  ✗ ${user.email} — ${error.message}`
      : `  ✓ ${user.email} (${found ? "updated" : "created"})`,
  )
}
