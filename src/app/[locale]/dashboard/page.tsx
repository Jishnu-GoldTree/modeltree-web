import Link from "next/link"
import { redirect } from "next/navigation"
import { Download, Plus, Star, Trash2, Wallet } from "lucide-react"

import { getCurrentUser } from "@/lib/supabase/server"
import { getDesignerEarnings, getMyModels } from "@/lib/data/designer"
import { deleteListing } from "@/lib/actions/models"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Thumb } from "@/components/marketplace/thumb"
import { UserText } from "@/components/user-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Designer dashboard" }

const money = (cents: number) =>
  cents === 0 ? "Free" : `$${(cents / 100).toLocaleString("en-US")}`

const STATUS_STYLE: Record<string, string> = {
  published: "bg-brand-muted text-brand-accent",
  processing: "bg-amber-100 text-amber-800",
  draft: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive",
  archived: "bg-muted text-muted-foreground",
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/[locale]/dashboard">) {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/dashboard")

  const { created } = await searchParams
  const [models, earnings] = await Promise.all([getMyModels(), getDesignerEarnings()])

  const published = models.filter((m) => m.status === "published").length
  const tiles = [
    { label: "Listings", value: String(models.length), Icon: Plus },
    { label: "Published", value: String(published), Icon: Star },
    { label: "Downloads", value: String(models.reduce((s, m) => s + m.downloads, 0)), Icon: Download },
    { label: "Earned (30 days)", value: money(earnings.last30Cents), Icon: Wallet },
  ]

  return (
    <>
      <SiteHeader solid />

      <main className="flex-1 pt-16">
        <div className="border-b bg-ink">
          <div className="shell flex flex-wrap items-center justify-between gap-4 py-10">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Designer dashboard
              </h1>
              <p className="mt-1.5 text-sm text-white/60">
                {money(earnings.grossCents)} earned across {earnings.salesCount}{" "}
                {earnings.salesCount === 1 ? "sale" : "sales"}
              </p>
            </div>
            <Button asChild className="h-10 bg-brand text-brand-foreground hover:bg-brand/85">
              <Link href="/dashboard/upload">
                <Plus className="size-4" aria-hidden />
                New listing
              </Link>
            </Button>
          </div>
        </div>

        <div className="shell flex flex-col gap-10 py-10">
          {created === "1" && (
            <p role="status" className="rounded-lg border border-brand bg-brand-muted/50 p-3 text-sm">
              Listing saved. It appears in the catalog once processing finishes.
            </p>
          )}

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

          <section>
            <h2 className="text-lg font-semibold tracking-tight">Your listings</h2>

            {models.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
                <h3 className="font-semibold">Nothing published yet</h3>
                <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                  Upload your first model to start selling. You can save it as a
                  draft and finish later.
                </p>
                <Button asChild className="mt-6 h-10 bg-brand text-brand-foreground hover:bg-brand/85">
                  <Link href="/dashboard/upload">Upload a model</Link>
                </Button>
              </div>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {models.map((model) => (
                  <li key={model.id} className="flex flex-wrap items-center gap-4 rounded-xl border p-3">
                    <Thumb
                      seed={model.slug}
                      grid={false}
                      sizes="120px"
                      className="aspect-4/3 w-28 shrink-0 rounded-lg"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {model.status === "published" ? (
                          <Link href={`/3d-model/${model.slug}`} className="font-medium hover:underline">
                            <UserText>{model.title}</UserText>
                          </Link>
                        ) : (
                          <UserText className="font-medium">{model.title}</UserText>
                        )}
                        <Badge className={`border-0 ${STATUS_STYLE[model.status] ?? ""}`}>
                          {model.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {model.formats.length > 0 ? model.formats.join(", ") : "No files yet"}
                        {" · "}
                        {model.downloads} downloads
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums">
                        {money(model.priceCents)}
                      </span>
                      <form action={deleteListing}>
                        <input type="hidden" name="id" value={model.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="lg"
                          className="h-9 text-muted-foreground hover:text-destructive"
                          aria-label={`Delete ${model.title}`}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </form>
                    </div>
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
