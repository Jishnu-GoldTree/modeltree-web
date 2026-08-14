import { getLocale, getTranslations } from "next-intl/server"

import { formatPrice } from "@/lib/money"
import type { Locale } from "@/i18n/routing"
import { initials } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { notFound } from "next/navigation"
import {
  Check,
  ChevronRight,
  Download,
  FileBox,
  Gem,
  Ruler,
  Heart,
  ShieldCheck,
  Star,
} from "lucide-react"

import { ASSET_CATEGORIES } from "@/lib/data/landing"
import {
  allModelSlugs,
  getFiles,
  getLicenseOptions,
  getModel,
  getRelated,
  getReviews,
} from "@/lib/data/catalog"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ModelCard } from "@/components/marketplace/model-card"
import { ProductGallery } from "@/components/marketplace/product-gallery"
import { tempGallery } from "@/lib/temp-previews"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { addToCart } from "@/lib/actions/cart"
import { addFavorite } from "@/lib/actions/favorites"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { UserText } from "@/components/user-text"

/**
 * Model detail — the page that turns a browser into a buyer.
 *
 * Singular `/3d-model/` on purpose: `/3d-models/[segment]` already serves
 * categories and collections, and one segment can't disambiguate a model
 * slugged "car" from the Car category.
 */

export async function generateStaticParams() {
  return (await allModelSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<"/[locale]/3d-model/[slug]">) {
  const { slug } = await params
  const model = await getModel(slug)
  if (!model) return { title: "Model not found" }
  return {
    title: model.title,
    description: model.description,
    alternates: { canonical: `/3d-model/${model.slug}` },
  }
}

const number = (value: number) => value.toLocaleString("en-US")

export default async function ModelPage({ params }: PageProps<"/[locale]/3d-model/[slug]">) {
  const { slug } = await params
  const model = await getModel(slug)
  if (!model) notFound()

  const t = await getTranslations("product")
  const cat = await getTranslations("landing")
  const lic = await getTranslations("license")
  const common = await getTranslations("common")
  const facet = await getTranslations("facet")
  const member = await getTranslations("membership")
  const category = ASSET_CATEGORIES.find((c) => c.slug === model.category)
  const related = await getRelated(model)
  const locale = await getLocale()
  const price = formatPrice(model.priceAgorot, locale as Locale, {
    freeLabel: t("free"),
  })
  const reviews = await getReviews(model)
  const files = await getFiles(model)
  const licenses = await getLicenseOptions(model)

  const specs = [
    { label: t("formats"), value: model.formats.join(", ") },
    { label: t("license"), value: lic(model.license) },
    { label: t("metal"), value: facet(`metal.${model.metal}`) },
    { label: t("stone"), value: facet(`stone.${model.stone}`) },
    { label: t("production"), value: facet(`production.${model.production}`) },
    // Physical dimensions are what a jeweler checks before casting; polygon
    // counts describe the mesh and stay, but below the things that matter.
    ...(model.weightGrams
      ? [{ label: t("weight"), value: t("grams", { value: model.weightGrams }) }]
      : []),
    ...(model.sizeMm
      ? [{ label: t("size"), value: t("mm", { value: model.sizeMm }) }]
      : []),
    { label: t("polygons"), value: number(model.polygons) },
    { label: t("downloads"), value: number(model.downloads) },
  ]

  return (
    <>
      <SiteHeader solid />

      <main id="main-content" className="flex-1 pt-16">
        <div className="shell py-6">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li>
                <Link href="/3d-models" className="hover:text-foreground">
                  {cat("footer.models")}
                </Link>
              </li>
              {category && (
                <>
                  <ChevronRight className="size-3 rtl:-scale-x-100" aria-hidden />
                  <li>
                    <Link
                      href={`/3d-models/${category.slug}`}
                      className="hover:text-foreground"
                    >
                      {cat(`categories.${category.key}`)}
                    </Link>
                  </li>
                </>
              )}
              <ChevronRight className="size-3 rtl:-scale-x-100" aria-hidden />
              <li aria-current="page" title={model.title} className="truncate text-foreground">
                {model.title}
              </li>
            </ol>
          </nav>

          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0">
              {/* A real viewer comes with the asset pipeline; until then these
                  are the stand-in renders from public/images/temp-prod. */}
              <ProductGallery images={tempGallery(model.slug)} title={model.title} />

              <UserText
                as="h1"
                className="mt-8 block text-2xl font-semibold tracking-tight text-balance"
              >
                {model.title}
              </UserText>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span>
                  {t("by")}{" "}
                  <Link
                    href={`/designers/${model.author}`}
                    className="font-medium text-brand-accent hover:underline"
                  >
                    {model.author}
                  </Link>
                </span>
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  {model.rating}
                  <span className="sr-only">{common("outOf5From")}</span>
                  <span>{t("reviewsCount", { count: number(model.reviews) })}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Download className="size-4" aria-hidden />
                  {t("downloadsCount", { count: number(model.downloads) })}
                </span>
              </div>

              <UserText
                as="p"
                className="mt-5 block max-w-2xl text-sm leading-relaxed text-muted-foreground"
              >
                {model.description}
              </UserText>

              <h2 className="mt-10 text-lg font-semibold tracking-tight">
                {t("specifications")}
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-baseline justify-between gap-4 border-b py-2.5 text-sm"
                  >
                    <dt className="text-muted-foreground">{spec.label}</dt>
                    <dd className="text-end font-medium tabular-nums">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <h2 className="mt-10 text-lg font-semibold tracking-tight">
                {t("whatYouGet")}
              </h2>
              <ul className="mt-4 flex flex-col gap-2">
                {files.map((file) => (
                  <li
                    key={file.format}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <FileBox className="size-4 text-muted-foreground" aria-hidden />
                      <span className="font-medium">{file.format}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {file.size}
                    </span>
                  </li>
                ))}
              </ul>

              <Separator className="mt-10" />

              <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight">{t("reviewsTitle")}</h2>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  <span className="font-medium text-foreground">{model.rating}</span>
                  {t("ratingLine", { count: number(model.reviews) })}
                </p>
              </div>

              <ul className="mt-5 flex flex-col gap-5">
                {reviews.map((review) => (
                  <li key={review.id} className="flex gap-3 border-b pb-5 last:border-b-0">
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="bg-muted text-[11px] font-semibold">
                        {initials(review.author.replace(/[._]/g, " "))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-medium">{review.author}</span>
                        <span
                          className="flex items-center gap-px"
                          aria-label={`${review.rating} out of 5`}
                        >
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={
                                i < review.rating
                                  ? "size-3 fill-amber-400 text-amber-400"
                                  : "size-3 text-muted-foreground/30"
                              }
                              aria-hidden
                            />
                          ))}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {review.daysAgo} days ago
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {review.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Buy box. Sticky on desktop so the price stays reachable while
                the specs scroll. */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={`text-3xl font-semibold tracking-tight ${
                      model.price === "free" ? "text-brand-accent" : ""
                    }`}
                  >
                    {price.primary}
                  </span>
                  {price.secondary && (
                    <span className="text-sm text-muted-foreground">
                      ≈{price.secondary}
                    </span>
                  )}
                  {model.badge && <Badge variant="secondary">{model.badge}</Badge>}
                </div>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t("commercial", { license: lic(model.license) })}
                </p>

                {/* Priced next to the price, which is the only place the
                    comparison lands: a buyer deciding on this model is exactly
                    who the membership is for. */}
                <Link
                  href={`/requests/new?kind=adjustment&model=${model.id}`}
                  className="mt-3 flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-brand/50"
                >
                  <Ruler className="size-3.5 text-brand-accent" aria-hidden />
                  {member("adjustCta")}
                </Link>

                <Link
                  href="/pricing"
                  className="mt-4 flex items-start gap-2.5 rounded-lg border border-brand bg-brand-muted p-3 outline-none transition-colors hover:bg-brand-muted/70 focus-visible:ring-3 focus-visible:ring-brand/50"
                >
                  <Gem className="mt-0.5 size-4 shrink-0 text-brand-accent" aria-hidden />
                  <span className="text-xs">
                    <span className="block font-medium text-brand-accent">
                      {member("included")}
                    </span>
                    <span className="mt-0.5 block text-muted-foreground">
                      {member("includedBody")}
                    </span>
                  </span>
                </Link>

                {/* The licence picker and the add button are one form, so
                    the chosen tier posts with it. Radios + submit means it
                    works with JS disabled and there's no client state to keep
                    in sync with the cart cookie. */}
                <form action={addToCart} className="mt-5">
                  <input type="hidden" name="slug" value={model.slug} />

                  <fieldset>
                    <legend className="sr-only">{t("chooseLicense")}</legend>
                    <ul className="flex flex-col gap-2">
                      {licenses.map((option, index) => (
                        <li key={option.id}>
                          <label
                            className="flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 transition-colors hover:bg-accent has-checked:border-brand has-checked:bg-brand-muted/60 has-focus-visible:ring-3 has-focus-visible:ring-brand/50"
                          >
                            <input
                              type="radio"
                              name="license"
                              value={option.id}
                              defaultChecked={index === 0}
                              className="sr-only"
                            />
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="text-sm font-medium">{lic(option.id)}</span>
                              <span className="text-sm font-semibold tabular-nums">
                                {formatPrice(option.price * 100, locale as Locale, { freeLabel: t("free") }).primary}
                              </span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {lic(`blurb${option.id === "editorial" ? "Editorial" : option.id === "extended" ? "Extended" : "Royalty"}`)}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>

                  <div className="mt-4 flex flex-col gap-2">
                    <Button
                      type="submit"
                      className="h-10 bg-brand text-brand-foreground hover:bg-brand/85"
                    >
                      {model.price === "free" ? t("getModel") : t("addToCart")}
                    </Button>
                  </div>
                </form>

                {/* Its own form: nesting it inside the add-to-cart form would
                    make one submit carry the other's fields. */}
                <form action={addFavorite} className="mt-2">
                  <input type="hidden" name="slug" value={model.slug} />
                  <Button type="submit" variant="outline" className="h-10 w-full">
                    <Heart className="size-4" aria-hidden />
                    {t("save")}
                  </Button>
                </form>

                <ul className="mt-5 flex flex-col gap-2 border-t pt-4">
                  {[
                    t("formatsIncluded", { count: model.formats.length }),
                    t("updates"),
                    t("invoice"),
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <Check className="mt-px size-3.5 shrink-0 text-brand-accent" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Designer card — the trust signal that decides a lot of
                  marketplace purchases. */}
              <div className="mt-4 rounded-xl border p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-ink text-xs font-semibold text-ink-foreground">
                      {initials(model.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Link
                      href={`/designers/${model.author}`}
                      title={model.author}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {model.author}
                    </Link>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                      {t("ratingDownloads", { rating: model.rating, count: number(model.downloads) })}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-4 h-9 w-full">
                  <Link href={`/designers/${model.author}`}>{t("viewStorefront")}</Link>
                </Button>
              </div>

              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-px size-4 shrink-0 text-brand-accent" aria-hidden />
                {t("checked")}
              </p>
            </aside>
          </div>

          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-lg font-semibold tracking-tight">
                {category
                  ? t("moreIn", { category: cat(`categories.${category.key}`) })
                  : t("moreInGeneric")}
              </h2>
              <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {related.map((item) => (
                  <li key={item.slug}>
                    <ModelCard model={item} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
