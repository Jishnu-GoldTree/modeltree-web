"use client"

import { useEffect } from "react"

import { clearPurchasedFromCart } from "@/lib/actions/checkout"

/**
 * Removes a paid order's models from the cart cookie. Rendered by the
 * confirmation page, which can't write cookies during its own render. The
 * action re-checks ownership and payment, so the id here is only a hint.
 */
export function ClearPurchased({ orderId }: { orderId: string }) {
  useEffect(() => {
    void clearPurchasedFromCart(orderId)
  }, [orderId])
  return null
}
