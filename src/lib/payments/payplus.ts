import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

import type {
  PaymentPage,
  PaymentProvider,
  PaymentRequest,
  Verification,
} from "./types"

/**
 * PayPlus (payplus.co.il) — hosted payment page + server-side verification.
 *
 * Docs: https://docs.payplus.co.il/reference/post_paymentpages-generatelink
 *
 * PayPlus takes amounts in shekels (major units) as numbers, so agorot are
 * divided at this boundary and nowhere else. Bit, Apple Pay and Google Pay are
 * switched on per payment page in the PayPlus dashboard, not here; so is the
 * tax invoice, which PayPlus issues itself when the terminal has invoicing
 * enabled.
 */

const BASE_URLS = {
  production: "https://restapi.payplus.co.il/api/v1.0",
  sandbox: "https://restapidev.payplus.co.il/api/v1.0",
} as const

/** "000" is PayPlus' approved status code; everything else is a decline. */
const APPROVED = "000"

type Config = {
  apiKey: string
  secretKey: string
  paymentPageUid: string
  baseUrl: string
}

export function payplusConfig(): Config | null {
  const apiKey = process.env.PAYPLUS_API_KEY
  const secretKey = process.env.PAYPLUS_SECRET_KEY
  const paymentPageUid = process.env.PAYPLUS_PAYMENT_PAGE_UID
  if (!apiKey || !secretKey || !paymentPageUid) return null
  const env = process.env.PAYPLUS_ENV === "production" ? "production" : "sandbox"
  return { apiKey, secretKey, paymentPageUid, baseUrl: BASE_URLS[env] }
}

async function call(config: Config, path: string, body: unknown) {
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": config.apiKey,
      "secret-key": config.secretKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  })
  const json = (await response.json().catch(() => null)) as Record<string, unknown> | null
  if (!response.ok || !json) {
    throw new Error(`PayPlus ${path} answered ${response.status}`)
  }
  return json
}

const toShekels = (agorot: number) => Math.round(agorot) / 100

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/**
 * Finds the transaction in an IPN response.
 *
 * The response schema is not published; observed payloads carry the fields
 * either directly on `data` or under `data.transaction`, and the related-
 * transactions variant returns an array. Accept all three rather than guess.
 */
function findTransaction(json: Record<string, unknown>) {
  const data = json.data
  const candidates = Array.isArray(data) ? data : [data]
  for (const candidate of candidates) {
    const record = asRecord(candidate)
    if (!record) continue
    const nested = asRecord(record.transaction)
    const txn = nested ?? record
    if (typeof txn.status_code === "string" || typeof txn.status_code === "number") {
      return txn
    }
  }
  return null
}

export function createPayPlusProvider(config: Config): PaymentProvider {
  return {
    id: "payplus",

    async createPaymentPage(request: PaymentRequest): Promise<PaymentPage> {
      const json = await call(config, "/PaymentPages/generateLink", {
        payment_page_uid: config.paymentPageUid,
        charge_method: 1, // charge immediately
        amount: toShekels(request.amount),
        currency_code: request.currency,
        language_code: request.locale,
        sendEmailApproval: true,
        sendEmailFailure: false,
        send_failure_callback: true,
        refURL_success: request.urls.success,
        refURL_failure: request.urls.failure,
        refURL_callback: request.urls.callback,
        // Returned on every callback and redirect: the order is found by it
        // even if the page uid were somehow lost.
        more_info: request.orderId,
        more_info_2: request.reference,
        customer: {
          customer_name: request.customer.name,
          email: request.customer.email,
        },
        items: request.lines.map((line) => ({
          name: line.name,
          quantity: 1,
          price: toShekels(line.amount),
          vat_type: 0, // VAT included in the price
        })),
      })

      const data = asRecord(json.data)
      const url = data?.payment_page_link
      const requestUid = data?.page_request_uid
      if (typeof url !== "string" || typeof requestUid !== "string") {
        const results = asRecord(json.results)
        throw new Error(
          `PayPlus did not return a payment link: ${String(results?.description ?? "unknown error")}`,
        )
      }
      return { url, requestUid }
    },

    async verify(requestUid: string): Promise<Verification> {
      const json = await call(config, "/PaymentPages/ipn", {
        payment_request_uid: requestUid,
      })
      const txn = findTransaction(json)
      // No transaction yet: the buyer hasn't submitted the page.
      if (!txn) return { status: "pending", raw: json }

      if (String(txn.status_code) !== APPROVED) {
        return { status: "failed", raw: json }
      }

      const uid = txn.uid ?? txn.transaction_uid
      const amount = Number(txn.amount)
      if (typeof uid !== "string" || !Number.isFinite(amount)) {
        return { status: "pending", raw: json }
      }
      return {
        status: "paid",
        transactionUid: uid,
        amount: Math.round(amount * 100),
        raw: json,
      }
    },
  }
}

/**
 * Checks the `hash` header PayPlus signs every callback with: base64
 * HMAC-SHA256 of the raw body under the secret key.
 *
 * A valid signature only proves the callback came from PayPlus. The order is
 * still settled through `verify`, so a replayed or reordered callback can't
 * mark anything paid that PayPlus doesn't say is paid right now.
 */
export function verifyPayPlusSignature(rawBody: string, hash: string | null) {
  const config = payplusConfig()
  if (!config || !hash) return false
  const expected = createHmac("sha256", config.secretKey).update(rawBody).digest("base64")
  const a = Buffer.from(expected)
  const b = Buffer.from(hash)
  return a.length === b.length && timingSafeEqual(a, b)
}
