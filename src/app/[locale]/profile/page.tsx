import { getLocale, getTranslations } from "next-intl/server"

import { formatPrice } from "@/lib/money"
import type { Locale } from "@/i18n/routing"
import { initials } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { redirect } from "@/i18n/navigation"
import { Download, MapPin, Package, Receipt, Star } from "lucide-react"

import { getCurrentUser } from "@/lib/supabase/server"

import { getDesignerStats, getMyPurchases, getProfile } from "@/lib/data/profile"
import { getFavoriteModels } from "@/lib/favorites"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ModelCard } from "@/components/marketplace/model-card"
import { Thumb } from "@/components/marketplace/thumb"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/profile">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "profile" })
  return { title: t("yourProfile") }
}



export default async function ProfilePage() {
  const locale = await getLocale()
  const free = await getTranslations("catalog")
  // Shekels are the stored currency; formatPrice adds the indicative $ for
  // English readers and omits it in Hebrew.
  const money = (agorot: number) =>
    formatPrice(agorot, locale as Locale, { freeLabel: free("free") }).primary
  const user_ = await getCurrentUser()
  // Anonymous visitors get bounced to login with a return path, rather than an
  // empty profile that looks broken.
  if (!user_) return redirect({ href: "/login?next=/profile", locale })

  // Everything here now comes from the profiles/orders tables; the demo
  // fixtures only survive as a fallback for the display name.
  const t = await getTranslations("profile")
  const lic = await getTranslations("license")
  const profile = await getProfile(user_.id)
  const name =
    profile?.fullName ??
    (user_.user_metadata?.full_name as string | undefined) ??
    user_.email ??
    "Your account"

  const orders = await getMyPurchases()
  // Saved models come from the cookie, same as /favorites — one source, so
  // the two screens can never disagree. Orders stay fixtures until there are
  // real orders to read.
  const favorites = await getFavoriteModels()
  const isDesigner = profile?.accountType === "designer"
  const designer = profile && isDesigner ? await getDesignerStats(profile.id) : null

  const stats = {
    purchases: orders.length,
    spent: orders.reduce((sum, o) => sum + o.priceCents, 0) / 100,
    downloads: orders.reduce((sum, o) => sum + o.model.formats.length, 0),
  }

  const tiles = [
    { label: t("purchases"), value: String(stats.purchases), Icon: Package },
    { label: t("totalSpent"), value: money(stats.spent * 100), Icon: Receipt },
    { label: t("filesAvailable"), value: String(stats.downloads), Icon: Download },
    { label: t("savedModels"), value: String(favorites.length), Icon: Star },
  ]

  return (
    <>
      <SiteHeader solid />

      <main id="main-content" className="flex-1 pt-16">
        <div className="border-b bg-ink">
          <div className="shell flex flex-col gap-5 py-10 sm:flex-row sm:items-center">
            <Avatar className="size-20 border-2 border-white/15">
              <AvatarFallback className="bg-brand text-xl font-semibold text-brand-foreground">
                {initials(name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  {name}
                </h1>
                <Badge className="border-0 bg-brand text-brand-foreground">
                  {isDesigner ? t("designer") : t("buyer")}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-white/60">
                {user_.email}
                {profile && ` · Member since ${profile.memberSince}`}
              </p>
              {profile?.bio && (
                <p className="mt-3 max-w-2xl text-sm text-white/75">{profile.bio}</p>
              )}
              {profile?.location && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
                  <MapPin className="size-3.5" aria-hidden />
                  {profile.location}
                </p>
              )}
            </div>

            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline" className="h-9 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/profile/settings">{t("editProfile")}</Link>
              </Button>
              {isDesigner && (
                <Button asChild className="h-9 bg-brand text-brand-foreground hover:bg-brand/85">
                  <Link href="/dashboard">{t("dashboard")}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="shell flex flex-col gap-14 py-10">
          <section>
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {tiles.map((tile) => (
                <li key={tile.label} className="rounded-xl border p-4">
                  <tile.Icon className="size-4 text-brand-accent" aria-hidden />
                  <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
                    {tile.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{tile.label}</p>
                </li>
              ))}
            </ul>
          </section>

          {designer && (
            <section>
              <h2 className="text-lg font-semibold tracking-tight">{t("selling")}</h2>
              <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: t("published"), value: designer.published.toLocaleString() },
                  { label: t("totalSales"), value: designer.sales.toLocaleString() },
                  { label: t("earned"), value: money(designer.earnedCents) },
                ].map((stat) => (
                  <li key={stat.label} className="rounded-xl border bg-brand-muted/40 p-4">
                    <p className="text-2xl font-semibold tracking-tight tabular-nums">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section id="purchases" className="scroll-mt-24">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">{t("purchases")}</h2>
              <Link
                href="/3d-models"
                className="text-sm text-brand-accent hover:underline"
              >
                {t("browseModels")}
              </Link>
            </div>

            {orders.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {t("nothingPurchased")}
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {orders.map((order) => (
                  <li
                    key={`${order.orderId}-${order.model.slug}`}
                    className="flex flex-wrap items-center gap-4 rounded-xl border p-3"
                  >
                    <Link
                      href={`/3d-model/${order.model.slug}`}
                      className="shrink-0 outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
                    >
                      <Thumb
                        seed={order.model.slug}
                        sizes="120px"
                        className="aspect-4/3 w-28 rounded-lg"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/3d-model/${order.model.slug}`}
                        className="font-medium hover:underline"
                      >
                        {order.model.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        by {order.model.author} · {lic(order.licenseCode)}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {order.reference} · {order.placedOn}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums">
                        {money(order.priceCents)}
                      </span>
                      <Button asChild variant="outline" size="lg" className="h-9">
                        <Link href={`/3d-model/${order.model.slug}`}>
                          <Download className="size-4" aria-hidden />
                          {t("files")}
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="saved" className="scroll-mt-24">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">{t("savedModels")}</h2>
              <Link href="/favorites" className="text-sm text-brand-accent hover:underline">
                {t("seeAll")}
              </Link>
            </div>
            {favorites.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {t("nothingSaved")}
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {favorites.map((model) => (
                  <li key={model.slug}>
                    <ModelCard model={model} favorited />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
