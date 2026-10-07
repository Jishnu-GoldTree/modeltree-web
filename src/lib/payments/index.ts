import "server-only"

import { createPayPlusProvider, payplusConfig } from "./payplus"
import type { PaymentProvider } from "./types"

export type { PaymentProvider, PaymentProviderId, Verification } from "./types"

/**
 * The provider this deployment charges through.
 *
 * PayPlus whenever its keys are present. Without them, the mock provider — so
 * `pnpm dev` can run a purchase end to end with no merchant account — except on
 * Vercel production, where silently "charging" through a mock would hand out
 * paid files for free. There it refuses, and checkout shows the pending notice.
 */
export function getPaymentProvider(): PaymentProvider | null {
  const config = payplusConfig()
  if (config) return createPayPlusProvider(config)
  if (mockPaymentsAllowed()) return mockProvider
  return null
}

export function mockPaymentsAllowed() {
  if (process.env.VERCEL_ENV === "production") return false
  return process.env.PAYMENTS_ALLOW_MOCK !== "false"
}

/**
 * Stands in for a hosted payment page: it sends the buyer to the storefront's
 * own `/checkout/mock` page, which settles the order directly. `verify` is never
 * the path to `paid` for a mock order — the mock page is — so it reports
 * pending and leaves the order as it finds it.
 */
const mockProvider: PaymentProvider = {
  id: "mock",
  async createPaymentPage(request) {
    const url = new URL(request.urls.success)
    url.pathname = url.pathname.replace(/\/checkout\/success$/, "/checkout/mock")
    url.searchParams.set("order", request.orderId)
    return { url: url.toString(), requestUid: `mock_${request.orderId}` }
  },
  async verify() {
    return { status: "pending", raw: null }
  },
}
