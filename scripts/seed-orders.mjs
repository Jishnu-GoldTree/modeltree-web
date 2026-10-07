/**
 * Gives the demo buyer a purchase history made of real rows.
 *
 * Replaces the old ORDER_FIXTURES: these go through orders/order_items, so the
 * profile page, the download paywall and the designer's earnings all read the
 * same data the real flow will produce.
 *
 *   node --env-file=.env.local scripts/seed-orders.mjs
 */
import { createClient } from "@supabase/supabase-js"

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
)

const BUYER_EMAIL = "omri@goldtree.com"
const ORDER_COUNT = 4
// Designers keep 80%; the split must reconcile or the check constraint rejects it.
const DESIGNER_SHARE = 0.8

const { data: users } = await db.auth.admin.listUsers({ perPage: 1000 })
const buyer = users.users.find((u) => u.email?.toLowerCase() === BUYER_EMAIL)
if (!buyer) {
  console.error(`No such user: ${BUYER_EMAIL}`)
  process.exit(1)
}

// Whatever is in the catalog, rather than a fixed slug list: the jewellery
// pivot deleted every model the old list named, so this seeded nothing and the
// demo buyer owned nothing — which also meant nobody could leave a review,
// since reviews_insert_purchased requires a paid order. Ordered by slug so a
// rerun buys the same four models instead of reshuffling the history.
const { data: models } = await db
  .from("models")
  .select("id, slug, title, price_cents, license_code, designer_id")
  .eq("status", "published")
  .order("slug")
  .limit(ORDER_COUNT)

if (!models?.length) {
  console.error("No published models; run seed-jewellery.mjs first")
  process.exit(1)
}

// Idempotent: drop any previous demo orders for this buyer before reseeding.
const { data: existing } = await db.from("orders").select("id").eq("buyer_id", buyer.id)
if (existing?.length) {
  await db.from("orders").delete().in("id", existing.map((o) => o.id))
  console.log(`cleared ${existing.length} previous order(s)`)
}

let n = 0
for (const [i, model] of models.entries()) {
  const price = model.price_cents
  const designerShare = Math.round(price * DESIGNER_SHARE)

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      buyer_id: buyer.id,
      status: "paid",
      subtotal_cents: price,
      total_cents: price,
      payment_ref: `MT-DEMO-${String(40000 + i * 137).padStart(5, "0")}`,
      placed_at: new Date(Date.now() - (i + 1) * 14 * 86_400_000).toISOString(),
    })
    .select("id")
    .single()

  if (orderError) {
    console.error(`  ✗ ${model.slug}: ${orderError.message}`)
    continue
  }

  const { error: itemError } = await db.from("order_items").insert({
    order_id: order.id,
    model_id: model.id,
    designer_id: model.designer_id,
    license_code: model.license_code,
    unit_price_cents: price,
    designer_share_cents: designerShare,
    platform_fee_cents: price - designerShare,
  })

  console.log(itemError ? `  ✗ ${model.slug}: ${itemError.message}` : `  ✓ ${model.title}`)
  if (!itemError) n++
}
console.log(`\n${n} paid orders for ${BUYER_EMAIL}`)
