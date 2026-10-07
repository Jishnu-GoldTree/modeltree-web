/**
 * The contract a payment provider meets.
 *
 * Two operations, both server-side. `createPaymentPage` hands the buyer off to
 * a hosted page — card data never touches this app, which keeps it out of PCI
 * scope. `verify` asks the provider, server to server, what actually happened.
 * An order is only ever marked paid on the strength of `verify`; a redirect or
 * a callback body is a prompt to call it, not proof.
 */

export type PaymentProviderId = "payplus" | "mock"

export type PaymentLine = {
  name: string
  /** Agorot, VAT included — Israeli consumer prices are quoted gross. */
  amount: number
}

export type PaymentRequest = {
  orderId: string
  reference: string
  /** Agorot. Must equal the sum of `lines`. */
  amount: number
  currency: "ILS"
  locale: "he" | "en"
  customer: { name: string; email: string }
  lines: PaymentLine[]
  urls: { success: string; failure: string; callback: string }
}

export type PaymentPage = {
  /** Where the buyer is sent to pay. */
  url: string
  /** The provider's id for this page; how `verify` finds it again. */
  requestUid: string
}

export type Verification =
  | {
      status: "paid"
      transactionUid: string
      /** Agorot actually captured — checked against the order total. */
      amount: number
      raw: unknown
    }
  | { status: "pending" | "failed"; raw: unknown }

export interface PaymentProvider {
  id: PaymentProviderId
  createPaymentPage(request: PaymentRequest): Promise<PaymentPage>
  verify(requestUid: string): Promise<Verification>
}
