import Link from "next/link"
import { Heart, ShoppingCart } from "lucide-react"

import { getFavoriteModels } from "@/lib/favorites"
import { clearFavorites } from "@/lib/actions/favorites"
import { addToCart } from "@/lib/actions/cart"
import { getLicenseOptions } from "@/lib/data/catalog"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ModelCard } from "@/components/marketplace/model-card"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/favorites">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "favorites" })
  return { title: t("title") }
}

const money = (value: number) =>
  value === 0 ? "Free" : `$${value.toLocaleString("en-US")}`

export default async function FavoritesPage() {
  const t = await getTranslations("favorites")
  const models = await getFavoriteModels()
  // One licence lookup per card, resolved together rather than in sequence.
  const standardBySlug = new Map(
    await Promise.all(
      models.map(async (m) => [m.slug, (await getLicenseOptions(m))[0]] as const),
    ),
  )

  const free = models.filter((model) => model.price === "free").length
  const totalIfBought = models.reduce(
    (sum, model) => sum + (model.price === "free" ? 0 : model.price),
    0,
  )

  return (
    <>
      <SiteHeader solid />

      <main className="flex-1 pt-16">
        <div className="shell py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
              {models.length > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {models.length} saved · {free} free ·{" "}
                  {money(totalIfBought)} to buy the rest
                </p>
              )}
            </div>
            {models.length > 0 && (
              <form action={clearFavorites}>
                <button
                  type="submit"
                  className="rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
                >
                  {t("clear")}
                </button>
              </form>
            )}
          </div>

          {models.length === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-xl border py-20 text-center">
              <Heart className="size-8 text-muted-foreground" aria-hidden />
              <h2 className="mt-4 font-semibold">{t("empty")}</h2>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                {t("emptyBody")}
              </p>
              <Button
                asChild
                className="mt-6 h-10 bg-brand text-brand-foreground hover:bg-brand/85"
              >
                <Link href="/3d-models">{t("emptyAction")}</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {models.map((model) => {
                const standard = standardBySlug.get(model.slug)!
                return (
                  <li key={model.slug} className="flex flex-col gap-2">
                    {/* Every card here is saved by definition, so the heart
                        renders filled and acts as "remove". */}
                    <ModelCard model={model} favorited />
                    <form action={addToCart}>
                      <input type="hidden" name="slug" value={model.slug} />
                      <input type="hidden" name="license" value={standard.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-9 w-full"
                      >
                        <ShoppingCart className="size-4" aria-hidden />
                        {model.price === "free"
                          ? "Get for free"
                          : `Add for ${money(standard.price)}`}
                      </Button>
                    </form>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
