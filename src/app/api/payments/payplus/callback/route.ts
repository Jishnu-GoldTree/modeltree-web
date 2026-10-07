import { getOrder, getOrderByRequestUid, settleOrder } from "@/lib/orders"
import { getPaymentProvider } from "@/lib/payments"
import { verifyPayPlusSignature } from "@/lib/payments/payplus"

/**
 * PayPlus server-to-server callback (refURL_callback).
 *
 * The signature proves the call came from PayPlus; the order is then settled
 * through a fresh `verify` against the PayPlus API, so the body is only used
 * to find which order to look at. The confirmation page runs the same verify,
 * which is what makes local development work: PayPlus can't reach localhost,
 * but the buyer's browser coming back can.
 */
export async function POST(request: Request) {
  const raw = await request.text()
  if (!verifyPayPlusSignature(raw, request.headers.get("hash"))) {
    return new Response("invalid signature", { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw)
  } catch {
    return new Response("bad request", { status: 400 })
  }

  const transaction = (body.transaction ?? {}) as Record<string, unknown>
  const requestUid =
    transaction.payment_page_request_uid ?? body.payment_page_request_uid
  const orderId = transaction.more_info ?? body.more_info

  const order =
    (typeof requestUid === "string" && (await getOrderByRequestUid(requestUid))) ||
    (typeof orderId === "string" && (await getOrder(orderId))) ||
    null

  // Unknown order: acknowledge so PayPlus stops retrying something we can
  // never match, and leave a trail for support.
  if (!order) {
    console.error("[payplus] callback for unknown order", { requestUid, orderId })
    return Response.json({ ok: true })
  }

  const provider = getPaymentProvider()
  if (order.status !== "pending" || !order.provider_request_uid || provider?.id !== "payplus") {
    return Response.json({ ok: true })
  }

  try {
    const verification = await provider.verify(order.provider_request_uid)
    const status = await settleOrder(order, verification)
    return Response.json({ ok: true, status })
  } catch (error) {
    // 5xx so PayPlus retries; the success page will also try on return.
    console.error("[payplus] settle failed", error)
    return new Response("retry", { status: 500 })
  }
}
