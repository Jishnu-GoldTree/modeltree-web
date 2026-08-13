import Link from "next/link"
import { redirect } from "next/navigation"
import { Download, MapPin, Package, Receipt, Star } from "lucide-react"

import { getCurrentUser } from "@/lib/supabase/server"
import {
  getAccountStats,
  getDemoUserByEmail,
  getDesignerStats,
  getOrders,
  initials,
} from "@/lib/data/account"
import { LICENSE_LABELS } from "@/lib/data/catalog"
import { getFavoriteModels } from "@/lib/favorites"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ModelCard } from "@/components/marketplace/model-card"
import { Thumb } from "@/components/marketplace/thumb"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Your profile" }

const money = (value: number) =>
  value === 0 ? "Free" : `$${value.toLocaleString("en-US")}`

export default async function ProfilePage() {
  const user_ = await getCurrentUser()
  // Anonymous visitors get bounced to login with a return path, rather than an
  // empty profile that looks broken.
  if (!user_) redirect("/login?next=/profile")

  const user = getDemoUserByEmail(user_.email)
  const name =
    user?.name ??
    (user_.user_metadata?.full_name as string | undefined) ??
    user_.email ??
    "Your account"
  const userId = user?.id ?? "u_alex"

  const orders = await getOrders(userId)
  // Saved models come from the cookie, same as /favorites — one source, so
  // the two screens can never disagree. Orders stay fixtures until there are
  // real orders to read.
  const favorites = await getFavoriteModels()
  const stats = await getAccountStats(userId)
  const isDesigner = user?.accountType === "designer"
  const designer = isDesigner ? getDesignerStats(user.handle) : null

  const tiles = [
    { label: "Purchases", value: String(stats.purchases), Icon: Package },
    { label: "Total spent", value: money(stats.spent), Icon: Receipt },
    { label: "Files available", value: String(stats.downloads), Icon: Download },
    { label: "Saved models", value: String(favorites.length), Icon: Star },
  ]

  return (
    <>
      <SiteHeader solid />

      <main className="flex-1 pt-16">
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
                  {isDesigner ? "Designer" : "Buyer"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-white/60">
                {user_.email}
                {user && ` · Member since ${user.memberSince}`}
              </p>
              {user && (
                <>
                  <p className="mt-3 max-w-2xl text-sm text-white/75">{user.bio}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
                    <MapPin className="size-3.5" aria-hidden />
                    {user.location}
                  </p>
                </>
              )}
            </div>

            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline" className="h-9 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/profile/settings">Edit profile</Link>
              </Button>
              {isDesigner && (
                <Button asChild className="h-9 bg-brand text-brand-foreground hover:bg-brand/85">
                  <Link href="/dashboard">Designer dashboard</Link>
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
              <h2 className="text-lg font-semibold tracking-tight">Selling</h2>
              <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: "Models published", value: designer.published.toLocaleString() },
                  { label: "Total sales", value: designer.sales.toLocaleString() },
                  { label: "Followers", value: designer.followers.toLocaleString() },
                  { label: "Average rating", value: designer.rating.toFixed(1) },
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
              <h2 className="text-lg font-semibold tracking-tight">Purchases</h2>
              <Link
                href="/3d-models"
                className="text-sm text-brand-accent hover:underline"
              >
                Browse models
              </Link>
            </div>

            {orders.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Nothing purchased yet.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border p-3"
                  >
                    <Link
                      href={`/3d-model/${order.model.slug}`}
                      className="shrink-0 outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
                    >
                      <Thumb
                        seed={order.model.seed}
                        grid={false}
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
                        by {order.model.author} · {LICENSE_LABELS[order.license]}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {order.id} · {order.placedOn}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums">
                        {money(order.total)}
                      </span>
                      <Button asChild variant="outline" size="lg" className="h-9">
                        <Link href={`/3d-model/${order.model.slug}`}>
                          <Download className="size-4" aria-hidden />
                          Files
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
              <h2 className="text-lg font-semibold tracking-tight">Saved models</h2>
              <Link href="/favorites" className="text-sm text-brand-accent hover:underline">
                See all
              </Link>
            </div>
            {favorites.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Nothing saved yet.
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
