import { getLocale, getTranslations } from "next-intl/server"
import { MessagesSquare, Plus } from "lucide-react"

import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { getCurrentUser } from "@/lib/supabase/server"
import { getProfile } from "@/lib/data/profile"
import { listRequests } from "@/lib/data/requests"
import { formatPrice } from "@/lib/money"
import { redirect } from "@/i18n/navigation"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { RequestStatusBadge } from "@/components/requests/status-badge"
import { Button } from "@/components/ui/button"

export async function generateMetadata({ params }: PageProps<"/[locale]/requests">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "requests" })
  return { title: t("metaTitle") }
}

/**
 * Requests, from both sides.
 *
 * A buyer sees their own threads; a designer sees the queue. The distinction is
 * RLS's, not this component's — the same query returns different rows depending
 * on who asks, which is why there is no branch here on account type beyond the
 * heading.
 */
export default async function RequestsPage() {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations("requests")
  const user = await getCurrentUser()
  if (!user) return redirect({ href: "/login?next=/requests", locale })

  const [profile, requests] = await Promise.all([getProfile(user.id), listRequests()])
  const isDesigner = profile?.accountType === "designer"

  return (
    <>
      <SiteHeader solid />

      <main className="flex-1 pt-16">
        <div className="shell max-w-4xl py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {isDesigner ? t("queueTitle") : t("title")}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isDesigner ? t("queueSubtitle") : t("subtitle")}
              </p>
            </div>
            {!isDesigner && (
              <Button asChild className="h-10 bg-brand text-brand-foreground hover:bg-brand/85">
                <Link href="/requests/new">
                  <Plus className="size-4" aria-hidden />
                  {t("new")}
                </Link>
              </Button>
            )}
          </div>

          {requests.length === 0 ? (
            <div className="mt-10 flex flex-col items-center rounded-xl border py-16 text-center">
              <MessagesSquare className="size-8 text-muted-foreground" aria-hidden />
              <h2 className="mt-4 font-semibold">{t("empty")}</h2>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                {t("emptyBody")}
              </p>
              {!isDesigner && (
                <Button asChild variant="outline" className="mt-5 h-10">
                  <Link href="/requests/new">{t("new")}</Link>
                </Button>
              )}
            </div>
          ) : (
            <ul className="mt-8 flex flex-col gap-3">
              {requests.map((request) => (
                <li key={request.id}>
                  <Link
                    href={`/requests/${request.id}`}
                    className="flex flex-col gap-2 rounded-xl border p-4 outline-none transition-colors hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-brand/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{request.title}</span>
                        <RequestStatusBadge status={request.status} />
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {t(
                          request.kind === "adjustment"
                            ? "kindAdjustment"
                            : "kindCommission",
                        )}
                        {request.model ? ` · ${request.model.title}` : ""}
                        {isDesigner ? ` · ${request.buyer.name ?? request.buyer.handle}` : ""}
                      </span>
                    </span>

                    <span className="shrink-0 text-sm tabular-nums">
                      {request.quoteAgorot !== null
                        ? formatPrice(request.quoteAgorot, locale).primary
                        : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
