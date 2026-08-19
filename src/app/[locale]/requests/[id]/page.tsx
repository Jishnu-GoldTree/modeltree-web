import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { ArrowLeft } from "lucide-react"

import { Link, redirect } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { getCurrentUser } from "@/lib/supabase/server"
import { getProfile } from "@/lib/data/profile"
import { getRequest } from "@/lib/data/requests"
import { formatPrice } from "@/lib/money"
import { requestReference } from "@/lib/whatsapp"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { FlashToast } from "@/components/layout/flash-toast"
import { RequestStatusBadge } from "@/components/requests/status-badge"
import { WhatsAppButton } from "@/components/requests/whatsapp-button"
import { QuotePanel } from "@/components/requests/quote-panel"

export async function generateMetadata({ params }: PageProps<"/[locale]/requests/[id]">) {
  const { id, locale } = await params
  const request = await getRequest(id)
  const t = await getTranslations({ locale, namespace: "requests" })
  return { title: request?.title ?? t("metaTitle") }
}

/**
 * One request thread.
 *
 * Both sides read the same page; what differs is the panel beside it. A
 * designer can price it, the buyer can accept — and RLS means neither can do
 * the other's action even by posting the form directly.
 */
export default async function RequestPage({ params }: PageProps<"/[locale]/requests/[id]">) {
  const { id } = await params
  const locale = (await getLocale()) as Locale
  const t = await getTranslations("requests")

  const user = await getCurrentUser()
  if (!user) return redirect({ href: `/login?next=/requests/${id}`, locale })

  const [request, profile] = await Promise.all([getRequest(id), getProfile(user.id)])
  // Not-found and not-allowed are the same response on purpose: RLS returns no
  // row either way, and distinguishing them would confirm a thread exists.
  if (!request) notFound()

  const isDesigner = profile?.accountType === "designer"

  return (
    <>
      <FlashToast />
      <SiteHeader />

      <main id="main-content" className="flex-1 pt-26">
        <div className="shell max-w-5xl py-10">
          <Link
            href="/requests"
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            {t("back")}
          </Link>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{request.title}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t(request.kind === "adjustment" ? "kindAdjustment" : "kindCommission")}
                {request.model ? " · " : ""}
                {request.model && (
                  <Link
                    href={`/3d-model/${request.model.slug}`}
                    className="text-brand-accent hover:underline"
                  >
                    {request.model.title}
                  </Link>
                )}
              </p>
            </div>
            <RequestStatusBadge status={request.status} />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("brief")}
              </p>
              <p className="mt-2 text-sm whitespace-pre-wrap">{request.brief}</p>

              <div className="mt-6 rounded-xl border bg-muted/40 p-5">
                <h2 className="font-medium">{t("waTitle")}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{t("waBody")}</p>
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  #{requestReference(request.id)}
                </p>
                <div className="mt-4 sm:max-w-xs">
                  <WhatsAppButton
                    context={{
                      reference: requestReference(request.id),
                      title: request.title,
                      modelTitle: request.model?.title,
                    }}
                  />
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <QuotePanel
                requestId={request.id}
                status={request.status}
                quote={
                  request.quoteAgorot === null
                    ? null
                    : {
                        agorot: request.quoteAgorot,
                        formatted: formatPrice(request.quoteAgorot, locale).primary,
                      }
                }
                isDesigner={isDesigner}
              />
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
