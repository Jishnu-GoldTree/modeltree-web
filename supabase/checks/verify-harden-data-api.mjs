/**
 * Verifies 20260915120000_harden_data_api_surface.sql against a real database.
 *
 * Applies the migration inside a transaction, asserts what each role can and
 * cannot reach afterwards, then rolls back. Nothing is written unless every
 * check passes AND --apply is given.
 *
 *   node supabase/checks/verify-harden-data-api.mjs           # dry run
 *   node supabase/checks/verify-harden-data-api.mjs --apply   # commit if green
 *
 * Needs DIRECT_URL (or DATABASE_URL) in .env.local, and the `pg` package.
 *
 * The load-bearing assertion is "set_updated_at trigger fires for a role
 * without EXECUTE". The revokes on trigger functions rest on PostgreSQL
 * checking that privilege at CREATE TRIGGER rather than on every fire. If that
 * check ever fails, drop the four trigger-function revokes and keep the rest —
 * they are the least valuable part of the migration.
 */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import pkg from "pg"

const { Client } = pkg
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const MIGRATION = join(
  ROOT,
  "supabase/migrations/20260915120000_harden_data_api_surface.sql",
)

const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]
    }),
)

const APPLY = process.argv.includes("--apply")
const sql = readFileSync(MIGRATION, "utf8")
const c = new Client({
  connectionString: env.DIRECT_URL || env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await c.connect()

const results = []
const check = (name, pass, detail = "") => results.push({ name, pass, detail })
const canExec = async (role, fn) =>
  (await c.query("select has_function_privilege($1,$2,'EXECUTE') as x", [role, fn]))
    .rows[0].x

await c.query("begin")
try {
  await c.query(sql)
  console.log("migration applied inside transaction\n")

  // ── Who may call what ────────────────────────────────────────────────────
  check("anon CANNOT exec is_designer", (await canExec("anon", "public.is_designer()")) === false)
  check("anon CANNOT exec is_platform_admin", (await canExec("anon", "public.is_platform_admin()")) === false)
  check("anon CANNOT exec platform_admin_role", (await canExec("anon", "public.platform_admin_role()")) === false)
  check("anon CANNOT exec claim_jobs", (await canExec("anon", "public.claim_jobs(int)")) === false)
  check("authenticated CANNOT exec platform_admin_role", (await canExec("authenticated", "public.platform_admin_role()")) === false)
  check("authenticated CAN exec is_designer (RLS needs it)", (await canExec("authenticated", "public.is_designer()")) === true)
  check("authenticated CAN exec is_platform_admin (RLS needs it)", (await canExec("authenticated", "public.is_platform_admin()")) === true)
  check("service_role CAN exec claim_jobs", (await canExec("service_role", "public.claim_jobs(int)")) === true)
  check("service_role CAN exec platform_admin_role", (await canExec("service_role", "public.platform_admin_role()")) === true)

  const grants = await c.query(
    `select count(*)::int n from information_schema.role_table_grants
      where table_schema='public' and table_name='jobs'
        and grantee in ('anon','authenticated')`,
  )
  check("jobs carries no anon/authenticated grants", grants.rows[0].n === 0, `found ${grants.rows[0].n}`)

  const paths = await c.query(
    `select proname, array_to_string(proconfig,',') cfg
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and proname in ('set_updated_at','claim_jobs')`,
  )
  for (const r of paths.rows) {
    check(`${r.proname} has an explicit search_path`, /search_path=/.test(r.cfg || ""), r.cfg || "none")
  }

  // ── What the app must still be able to do ────────────────────────────────
  const uid = (await c.query("select id from public.profiles limit 1")).rows[0]?.id
  if (uid) {
    await c.query("savepoint s1")
    await c.query("set local role authenticated")
    await c.query(
      `select set_config('request.jwt.claims',
         json_build_object('sub',$1::text,'role','authenticated')::text, true)`,
      [uid],
    )
    try {
      const r = await c.query("select count(*)::int n from public.requests")
      check("authenticated reads requests (policy calls is_designer)", true, `${r.rows[0].n} visible`)
    } catch (e) {
      check("authenticated reads requests (policy calls is_designer)", false, e.message)
    }
    try {
      const r = await c.query("select count(*)::int n from public.models where status='published'")
      check("authenticated reads published models", r.rows[0].n > 0, `${r.rows[0].n} rows`)
    } catch (e) {
      check("authenticated reads published models", false, e.message)
    }
    try {
      await c.query("update public.profiles set full_name = full_name where id = $1", [uid])
      check("set_updated_at trigger fires for a role without EXECUTE", true)
    } catch (e) {
      check("set_updated_at trigger fires for a role without EXECUTE", false, e.message)
    }
    try {
      await c.query("select public.claim_jobs(1)")
      check("authenticated is blocked from claim_jobs", false, "call succeeded")
    } catch (e) {
      check("authenticated is blocked from claim_jobs", /permission denied/i.test(e.message), e.message.slice(0, 60))
    }
    await c.query("rollback to savepoint s1")
  }

  await c.query("savepoint s2")
  await c.query("set local role anon")
  try {
    const r = await c.query("select count(*)::int n from public.models where status='published'")
    check("anon still reads the public catalogue", r.rows[0].n > 0, `${r.rows[0].n} published`)
  } catch (e) {
    check("anon still reads the public catalogue", false, e.message)
  }
  try {
    await c.query("select public.is_platform_admin()")
    check("anon is blocked from is_platform_admin", false, "call succeeded")
  } catch (e) {
    check("anon is blocked from is_platform_admin", /permission denied/i.test(e.message), e.message.slice(0, 60))
  }
  try {
    await c.query("select count(*) from public.jobs")
    check("anon is blocked from jobs", false, "select succeeded")
  } catch (e) {
    check("anon is blocked from jobs", /permission denied/i.test(e.message), e.message.slice(0, 60))
  }
  await c.query("rollback to savepoint s2")

  await c.query("savepoint s3")
  await c.query("set local role service_role")
  try {
    await c.query("select * from public.claim_jobs(1)")
    check("service_role can still claim jobs", true)
  } catch (e) {
    check("service_role can still claim jobs", false, e.message.slice(0, 80))
  }
  await c.query("rollback to savepoint s3")

  const failed = results.filter((r) => !r.pass).length
  for (const r of results) {
    console.log(` ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  — " + r.detail : ""}`)
  }
  console.log(`\n${results.length - failed}/${results.length} passed`)

  if (APPLY && failed === 0) {
    await c.query("commit")
    console.log("\nCOMMITTED.")
  } else {
    await c.query("rollback")
    console.log(failed ? "\nROLLED BACK — failures above." : "\nROLLED BACK — dry run. Pass --apply to commit.")
  }
} catch (e) {
  await c.query("rollback")
  console.error("Migration failed, rolled back:\n", e.message)
  process.exitCode = 1
}
await c.end()
