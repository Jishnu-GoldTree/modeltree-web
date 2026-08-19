import { getLocale, getTranslations } from "next-intl/server"

import { initials } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { notFound } from "next/navigation"
import { Download, MapPin, Package, Star } from "lucide-react"

import { allDesignerHandles, getDesigner } from "@/lib/data/catalog"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ModelCard } from "@/components/marketplace/model-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/**
 * A designer's public storefront — the page the product page's "Created by"
 * card links to. Prerendered like the model pages: it reads only public,
 * anon-visible rows, so the same output serves a build-time render and a
 * signed-out browser.
 */

export async function generateStaticParams() {
  return (await allDesignerHandles()).map((handle) => ({ handle }))
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/designers/[handle]">) {
  const { handle } = await params
  const designer = await getDesigner(handle)
  if (!designer) return { title: "Designer not found" }
  const name = designer.fullName ?? designer.handle
  return {
    title: name,
    alternates: { canonical: `/designers/${designer.handle}` },
  }
}

const number = (value: number) => value.toLocaleString("en-US")

export default async function DesignerPage({
  params,
}: PageProps<"/[locale]/designers/[handle]">) {
  const { handle } = await params
  const designer = await getDesigner(handle)
  if (!designer) notFound()

  const t = await getTranslations("designer")
  const locale = await getLocale()
  const name = designer.fullName ?? designer.handle
  const memberSince = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(designer.memberSince))

  const tiles = [
    { label: t("published"), value: number(designer.stats.published), Icon: Package },
    { label: t("downloads"), value: number(designer.stats.downloads), Icon: Download },
    { label: t("reviews"), value: number(designer.stats.reviews), Icon: Star },
  ]

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="flex-1 pt-26">
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
                  {t("designer")}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-white/60">
                @{designer.handle} · {t("memberSince", { date: memberSince })}
              </p>
              {designer.stats.reviews > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-white/75">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  {t("ratingLine", {
                    rating: designer.stats.rating.toFixed(1),
                    count: number(designer.stats.reviews),
                  })}
                </p>
              )}
              {designer.bio && (
                <p className="mt-3 max-w-2xl text-sm text-white/75">{designer.bio}</p>
              )}
              {designer.location && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
                  <MapPin className="size-3.5" aria-hidden />
                  {designer.location}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="shell flex flex-col gap-14 py-10">
          <section>
            <ul className="grid grid-cols-3 gap-4">
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

          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                {t("modelsHeading", { name })}
              </h2>
              <Link
                href="/3d-models"
                className="text-sm text-brand-accent hover:underline"
              >
                {t("browseModels")}
              </Link>
            </div>

            {designer.models.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {t("empty")}
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {designer.models.map((model) => (
                  <li key={model.slug}>
                    <ModelCard model={model} />
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
