"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect as externalRedirect } from "next/navigation"
import { getLocale } from "next-intl/server"

import { getPathname, redirect } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"

import { getCart, readCart, writeCart } from "@/lib/cart"
import {
  attachPaymentPage,
  createOrder,
  getOrder,
  getOrderSlugs,
  settleMockOrder,
} from "@/lib/orders"
import { getPaymentProvider } from "@/lib/payments"
import { getCurrentUser } from "@/lib/supabase/server"

export type CheckoutState = {
  error?: "consent" | "unavailable" | "empty" | "alreadyOwned" | "failed"
}

/**
 * Where the provider sends the buyer and its callbacks.
 *
 * `NEXT_PUBLIC_SITE_URL` when set — the provider must reach a stable public
 * host, and a request's Origin can be a preview alias. Otherwise the request's
 * own origin, which is what local development needs.
 */
async function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, "")
  const h = await headers()
  const origin = h.get("origin")
  if (origin) return origin
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "https"
  return `${proto}://${host}`
}

/**
 * Pay button. Prices are recomputed from the database here — the checkout page
 * showed them, but nothing the browser posts is trusted for an amount.
 */
export async function startCheckout(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  if (formData.get("agree") !== "on") return { error: "consent" }

  const locale = (await getLocale()) as Locale
  const user = await getCurrentUser()
  if (!user) {
    redirect({ href: "/login?next=/checkout", locale })
    return {}
  }

  const provider = getPaymentProvider()
  if (!provider) return { error: "unavailable" }

  const { lines } = await getCart()
  if (lines.length === 0) return { error: "empty" }

  const name =
    (user.user_metadata.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "ModelTree buyer"

  let paymentUrl: string
  try {
    const order = await createOrder({
      buyerId: user.id,
      buyerEmail: user.email,
      lines,
      provider: provider.id,
    })
    if (!order) return { error: "alreadyOwned" }

    const origin = await siteOrigin()
    const page = (path: string) =>
      `${origin}${getPathname({ href: path, locale })}`

    if (order.total === 0) {
      paymentUrl = page(`/checkout/success?order=${order.id}`)
    } else {
      const created = await provider.createPaymentPage({
        orderId: order.id,
        reference: order.reference,
        amount: order.total,
        currency: "ILS",
        locale,
        customer: { name, email: user.email ?? "" },
        lines: order.lines,
        urls: {
          success: page(`/checkout/success?order=${order.id}`),
          failure: page(`/checkout/failed?order=${order.id}`),
          callback: `${origin}/api/payments/payplus/callback`,
        },
      })
      await attachPaymentPage(order.id, created.requestUid)
      paymentUrl = created.url
    }
  } catch (error) {
    console.error("[checkout]", error)
    return { error: "failed" }
  }

  // Outside the try: redirect() works by throwing, and must not be caught.
  externalRedirect(paymentUrl)
}

/**
 * Drops what an order bought from the cart. Called from the confirmation page
 * once the order is paid — a Server Component can't write cookies itself, and
 * clearing the cart at checkout would lose it if the payment failed.
 */
export async function clearPurchasedFromCart(orderId: string) {
  const user = await getCurrentUser()
  if (!user) return
  const order = await getOrder(orderId)
  if (!order || order.buyer_id !== user.id || order.status !== "paid") return

  const bought = new Set(await getOrderSlugs(orderId))
  const cart = await readCart()
  const remaining = cart.filter((entry) => !bought.has(entry.slug))
  if (remaining.length === cart.length) return
  await writeCart(remaining)
  revalidatePath("/cart")
}

/** The mock payment page's buttons. Refuses anything but a mock order. */
export async function completeMockPayment(formData: FormData) {
  const locale = await getLocale()
  const orderId = formData.get("order")
  const outcome = formData.get("outcome")
  if (typeof orderId !== "string") return

  const provider = getPaymentProvider()
  const user = await getCurrentUser()
  const order = await getOrder(orderId)
  if (
    provider?.id !== "mock" ||
    !user ||
    !order ||
    order.buyer_id !== user.id ||
    order.provider !== "mock"
  ) {
    redirect({ href: "/checkout", locale })
    return
  }

  if (outcome === "pay") {
    await settleMockOrder(order)
    redirect({ href: `/checkout/success?order=${order.id}`, locale })
  } else {
    redirect({ href: `/checkout/failed?order=${order.id}`, locale })
  }
}
