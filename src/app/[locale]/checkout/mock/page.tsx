import { notFound } from "next/navigation"

import { completeMockPayment } from "@/lib/actions/checkout"
import { getOrder } from "@/lib/orders"
import { getPaymentProvider } from "@/lib/payments"
import { formatILS } from "@/lib/money"
import { getCurrentUser } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Test payment", robots: { index: false } }

/**
 * Stand-in for the PayPlus hosted page, served only while the mock provider is
 * active (no PayPlus keys, and never on Vercel production). Developer-facing,
 * so not translated. Everywhere else it 404s.
 */
export default async function MockPaymentPage({
  searchParams,
}: PageProps<"/[locale]/checkout/mock">) {
  if (getPaymentProvider()?.id !== "mock") notFound()

  const { order: orderId } = await searchParams
  if (typeof orderId !== "string") notFound()

  const [user, order] = await Promise.all([getCurrentUser(), getOrder(orderId)])
  if (!user || !order || order.buyer_id !== user.id || order.provider !== "mock") notFound()

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-background p-6">
        <p className="text-xs font-medium tracking-wide text-amber-600 uppercase">
          Test mode: no real charge
        </p>
        <h1 className="mt-2 text-xl font-semibold">Mock payment page</h1>
        <dl className="mt-4 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Order</dt>
            <dd className="font-mono">{order.payment_ref}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-semibold tabular-nums">{formatILS(order.total_cents, "he")}</dd>
          </div>
        </dl>
        <form action={completeMockPayment} className="mt-6 flex flex-col gap-2">
          <input type="hidden" name="order" value={order.id} />
          <Button name="outcome" value="pay" className="h-10">
            Approve payment
          </Button>
          <Button name="outcome" value="fail" variant="outline" className="h-10">
            Decline payment
          </Button>
        </form>
      </div>
    </main>
  )
}
