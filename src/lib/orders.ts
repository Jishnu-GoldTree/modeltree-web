import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { CartLine } from "@/lib/cart"
import type { PaymentProviderId, Verification } from "@/lib/payments"

/**
 * Order writes.
 *
 * Every function here uses the service-role client, because `orders` and
 * `order_items` deliberately have no client write policies: a buyer must not be
 * able to insert a `paid` order for themselves. Callers are responsible for
 * passing a verified buyer id — `getCurrentUser()`, never form input.
 */

export type PendingOrder = {
  id: string
  reference: string
  total: number
  lines: { name: string; amount: number }[]
}

/** Short, human-quotable; the same shape the purchases list falls back to. */
const referenceFor = (id: string) => `MT-${id.slice(0, 8).toUpperCase()}`

/**
 * Turns a priced cart into an order with snapshotted lines.
 *
 * Models the buyer already owns are dropped — files are re-downloadable from
 * the account page, so a second charge buys nothing. Returns null if nothing
 * purchasable is left.
 *
 * A zero total settles immediately as provider 'free': there is nothing to
 * charge, and the download policy needs a paid order to admit the buyer.
 */
export async function createOrder(input: {
  buyerId: string
  buyerEmail: string | undefined
  lines: CartLine[]
  provider: PaymentProviderId
}): Promise<PendingOrder | null> {
  const db = createAdminClient()
  const slugs = input.lines.map((line) => line.model.slug)

  const { data: models, error: modelError } = await db
    .from("models")
    .select("id, slug, designer_id")
    .in("slug", slugs)
    .eq("status", "published")
  if (modelError) throw new Error(`Could not load models: ${modelError.message}`)

  const bySlug = new Map((models ?? []).map((m) => [m.slug as string, m]))

  const { data: owned } = await db
    .from("order_items")
    .select("model_id, orders!inner ( buyer_id, status )")
    .eq("orders.buyer_id", input.buyerId)
    .eq("orders.status", "paid")
    .in("model_id", (models ?? []).map((m) => m.id))
  const ownedIds = new Set((owned ?? []).map((row) => row.model_id as string))

  const items = input.lines.flatMap((line) => {
    const model = bySlug.get(line.model.slug)
    if (!model || ownedIds.has(model.id)) return []
    // Cart prices are whole shekels; the database stores agorot.
    const unit = Math.round(line.price * 100)
    return [
      {
        model_id: model.id as string,
        designer_id: model.designer_id as string,
        license_code: line.license,
        unit_price_cents: unit,
        // Phase 1: GoldTree is the only seller, so there is no third party to
        // pay out and no commission has been agreed. The whole price is booked
        // as the seller's share; revisit before onboarding outside designers.
        designer_share_cents: unit,
        platform_fee_cents: 0,
        name: line.model.title,
      },
    ]
  })
  if (items.length === 0) return null

  const total = items.reduce((sum, item) => sum + item.unit_price_cents, 0)
  const id = crypto.randomUUID()
  const reference = referenceFor(id)
  const free = total === 0

  const { error: orderError } = await db.from("orders").insert({
    id,
    buyer_id: input.buyerId,
    status: free ? "paid" : "pending",
    subtotal_cents: total,
    total_cents: total,
    currency: "ILS",
    payment_ref: reference,
    buyer_email: input.buyerEmail ?? null,
    provider: free ? "free" : input.provider,
    paid_at: free ? new Date().toISOString() : null,
  })
  if (orderError) throw new Error(`Could not create order: ${orderError.message}`)

  const { error: itemError } = await db
    .from("order_items")
    .insert(
      items.map((item) => ({
        order_id: id,
        model_id: item.model_id,
        designer_id: item.designer_id,
        license_code: item.license_code,
        unit_price_cents: item.unit_price_cents,
        designer_share_cents: item.designer_share_cents,
        platform_fee_cents: item.platform_fee_cents,
      })),
    )
  if (itemError) {
    // No transaction across two PostgREST calls; undo by hand so a half-written
    // order never reaches a payment page.
    await db.from("orders").delete().eq("id", id)
    throw new Error(`Could not create order lines: ${itemError.message}`)
  }

  return {
    id,
    reference,
    total,
    lines: items.map((item) => ({ name: item.name, amount: item.unit_price_cents })),
  }
}

export async function attachPaymentPage(orderId: string, requestUid: string) {
  const db = createAdminClient()
  const { error } = await db
    .from("orders")
    .update({ provider_request_uid: requestUid })
    .eq("id", orderId)
    .eq("status", "pending")
  if (error) throw new Error(`Could not record payment page: ${error.message}`)
}

export type OrderRow = {
  id: string
  buyer_id: string
  status: "pending" | "paid" | "refunded" | "failed"
  total_cents: number
  payment_ref: string | null
  provider: string | null
  provider_request_uid: string | null
}

const ORDER_COLUMNS =
  "id, buyer_id, status, total_cents, payment_ref, provider, provider_request_uid"

export async function getOrder(orderId: string): Promise<OrderRow | null> {
  const db = createAdminClient()
  const { data } = await db.from("orders").select(ORDER_COLUMNS).eq("id", orderId).maybeSingle()
  return (data as OrderRow | null) ?? null
}

export async function getOrderByRequestUid(requestUid: string): Promise<OrderRow | null> {
  const db = createAdminClient()
  const { data } = await db
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("provider_request_uid", requestUid)
    .maybeSingle()
  return (data as OrderRow | null) ?? null
}

/** Model slugs on an order, so the cart can drop exactly what was bought. */
export async function getOrderSlugs(orderId: string): Promise<string[]> {
  const db = createAdminClient()
  const { data } = await db
    .from("order_items")
    .select("models ( slug )")
    .eq("order_id", orderId)
  return (data ?? [])
    .map((row) => (row as unknown as { models: { slug: string } | null }).models?.slug)
    .filter((slug): slug is string => typeof slug === "string")
}

/**
 * Applies a provider verification to a pending order.
 *
 * Only `paid` changes anything, and only when the captured amount matches the
 * order total to the agora — a mismatch is left pending and logged for a human,
 * never accepted. The `status = 'pending'` guard makes this idempotent: the
 * callback and the success page race to settle the same order, and whichever
 * arrives second updates nothing.
 */
export async function settleOrder(order: OrderRow, verification: Verification) {
  if (order.status !== "pending" || verification.status !== "paid") return order.status

  if (verification.amount !== order.total_cents) {
    console.error(
      `[orders] amount mismatch on ${order.id}: charged ${verification.amount}, expected ${order.total_cents}`,
    )
    return order.status
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      provider_transaction_uid: verification.transactionUid,
      provider_payload: verification.raw as object,
    })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("status")
    .maybeSingle()
  if (error) throw new Error(`Could not settle order ${order.id}: ${error.message}`)
  return (data?.status as OrderRow["status"] | undefined) ?? "paid"
}

/** Settles a mock-provider order. Callers must check the provider is mock. */
export async function settleMockOrder(order: OrderRow) {
  return settleOrder(order, {
    status: "paid",
    transactionUid: `mock_txn_${order.id}`,
    amount: order.total_cents,
    raw: { mock: true },
  })
}
