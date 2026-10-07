import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { CheckCircle2, Clock, HelpCircle } from "lucide-react"

import { getOrder, settleOrder, type OrderRow } from "@/lib/orders"
import { getPaymentProvider } from "@/lib/payments"
import { getCurrentUser } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"
import { ClearPurchased } from "@/components/checkout/clear-purchased"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout/success">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "checkout" })
  return { title: t("successTitle") }
}

/**
 * The provider's success return URL, `?order=<id>`.
 *
 * Arriving here proves nothing — anyone can type the URL — so the page asks
 * the provider itself before it says "paid". That same check is how a payment
 * settles when the provider's callback can't reach this host (local dev), or
 * simply hasn't arrived yet. The order must belong to the viewer; anyone else
 * sees "not found" rather than learning an order exists.
 */
async function resolveOrder(orderId: string | null) {
  if (!orderId) return null
  const user = await getCurrentUser()
  if (!user) return null
  const order = await getOrder(orderId)
  if (!order || order.buyer_id !== user.id) return null

  if (order.status === "pending" && order.provider_request_uid) {
    const provider = getPaymentProvider()
    if (provider && provider.id === order.provider) {
      try {
        const status = await settleOrder(order, await provider.verify(order.provider_request_uid))
        return { ...order, status } satisfies OrderRow
      } catch (error) {
        console.error("[checkout/success] verify failed", error)
      }
    }
  }
  return order
}

export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/[locale]/checkout/success">) {
  const t = await getTranslations("checkout")
  const { order: orderParam } = await searchParams
  const order = await resolveOrder(typeof orderParam === "string" ? orderParam : null)

  const state = !order ? "unknown" : order.status === "paid" ? "paid" : "processing"
  const Icon = state === "paid" ? CheckCircle2 : state === "processing" ? Clock : HelpCircle
  const title =
    state === "paid"
      ? t("successTitle")
      : state === "processing"
        ? t("processingTitle")
        : t("unknownOrderTitle")
  const body =
    state === "paid"
      ? t("successBody")
      : state === "processing"
        ? t("processingBody")
        : t("unknownOrderBody")

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="header-offset flex-1">
        <div className="shell py-16">
          <div className="mx-auto max-w-lg rounded-2xl border p-8 text-center">
            <Icon
              className={
                state === "paid"
                  ? "mx-auto size-12 text-brand-accent"
                  : "mx-auto size-12 text-muted-foreground"
              }
              aria-hidden
            />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-3 text-sm text-pretty text-muted-foreground">{body}</p>

            {order?.payment_ref && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{t("orderRef")}</span>
                <span className="font-mono font-medium">{order.payment_ref}</span>
              </p>
            )}

            {state === "paid" && order && <ClearPurchased orderId={order.id} />}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {state === "processing" && order ? (
                <Button
                  asChild
                  className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
                >
                  <Link href={`/checkout/success?order=${order.id}`}>
                    {t("processingRefresh")}
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
                >
                  <Link href="/profile">{t("successDownloads")}</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="h-10">
                <Link href="/3d-models">{t("successKeep")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
