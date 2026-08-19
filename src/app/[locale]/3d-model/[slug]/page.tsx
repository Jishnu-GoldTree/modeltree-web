import { getLocale, getTranslations } from "next-intl/server"

import { formatPrice } from "@/lib/money"
import type { Locale } from "@/i18n/routing"
import { initials } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { notFound } from "next/navigation"
import {
  ChevronRight,
  Download,
  Gem,
  Ruler,
  Heart,
  ShieldCheck,
  ShoppingCart,
  Star,
} from "lucide-react"

import { ASSET_CATEGORIES } from "@/lib/data/landing"
import {
  allModelSlugs,
  getLicenseOptions,
  getModel,
  getModelImages,
  getRelated,
  getReviews,
} from "@/lib/data/catalog"
import { getViewerReview } from "@/lib/data/reviews"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ModelCard } from "@/components/marketplace/model-card"
import { ReviewForm } from "@/components/marketplace/review-form"
import { ProductGallery } from "@/components/marketplace/product-gallery"
import { BackButton } from "@/components/marketplace/back-button"
import { tempGallery } from "@/lib/temp-previews"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardFooter } from "@/components/ui/card"
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
  const rev = await getTranslations("review")
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
  const licenses = await getLicenseOptions(model)
  const images = await getModelImages(model.id)
  // Null when nobody is signed in, which renders no form rather than an empty one.
  const viewer = await getViewerReview(model.id)

  // "3 days ago" reads wrong for something posted this morning, and worse in
  // Hebrew, where the plural rule makes a literal "0 days" ungrammatical.
  const relativeDay = (days: number) =>
    days === 0 ? rev("today") : days === 1 ? rev("yesterday") : t("daysAgo", { days })

  // Formats are missing on purpose: they get their own chip row in the rail,
  // and repeating them here as a comma list said the same thing twice.
  const specs = [
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
    { label: t("downloads"), value: number(model.downloads) },
    ...(model.publishedAt
      ? [
          {
            label: t("published"),
            value: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
              new Date(model.publishedAt),
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <SiteHeader />

      <main id="main-content" className="flex-1 pt-26">
        <div className="shell py-6">
          <BackButton />

          {/* Gallery and buy rail share the top row; the description and the
              rest of the detail sit under the gallery in column one. The rail
              is last in the DOM but placed explicitly, so on desktop it lands
              beside the image while on mobile it stacks straight after it —
              title and price before the long-form detail either way. */}
          {/* grid-rows [auto_1fr]: the buy rail spans both rows and is taller
              than the gallery. With two auto rows, grid splits that excess
              across both, inflating the gallery row and opening a gap above the
              description. A spanning item that crosses a flexible track lets the
              fr row (row 2) absorb the slack instead, so row 1 hugs the gallery
              and any leftover height falls below the description column. */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-[auto_1fr] lg:gap-y-4">
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              {/* Uploaded previews when the designer supplied any; falls back
                  to the placeholder set for legacy models with no images. */}
              <ProductGallery
                images={images.length > 0 ? images : tempGallery(model.slug)}
                title={model.title}
              />
            </div>

            <div className="order-last min-w-0 lg:order-none lg:col-start-1 lg:row-start-2">
              <div className="rounded-xl border p-5">
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
                    <li
                      aria-current="page"
                      title={model.title}
                      className="truncate text-foreground"
                    >
                      {model.title}
                    </li>
                  </ol>
                </nav>

                <UserText
                  as="p"
                  className="mt-4 block text-sm leading-relaxed text-muted-foreground"
                >
                  {model.description}
                </UserText>
              </div>

              {/* Designer keywords, linked into the `?tag=` browse filter so
                  a tag doubles as a way to find more like this. Its own card
                  below the description rather than a section inside it. */}
              {model.tags.length > 0 && (
                <div className="mt-4 rounded-xl border p-5">
                  <h2 className="text-xs text-muted-foreground">{t("relatedTags")}</h2>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {model.tags.map((tag) => (
                      <li key={tag}>
                        <Link
                          href={`/3d-models?tag=${encodeURIComponent(tag.toLowerCase())}`}
                          className="inline-flex rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
                        >
                          {tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator className="mt-10" />

              <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight">{t("reviewsTitle")}</h2>
                {/* Ratings are derived from reviews now, so a model with none has
                    no average — printing "0 out of 5" would read as a bad score
                    rather than an absent one. */}
                {model.reviews > 0 && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                    <span className="font-medium text-foreground">{model.rating}</span>
                    {t("ratingLine", { count: number(model.reviews) })}
                  </p>
                )}
              </div>

              {reviews.length === 0 && (
                <p className="mt-5 text-sm text-muted-foreground">{rev("empty")}</p>
              )}

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
                          {relativeDay(review.daysAgo)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {review.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Keyed so deleting a review remounts the form: the star state is
                  seeded from props and would otherwise stay filled. */}
              {viewer && (
                <ReviewForm
                  key={viewer.existing ? "edit" : "new"}
                  slug={model.slug}
                  viewer={viewer}
                />
              )}
            </div>

            {/* Buy rail. Sticky on desktop so the price stays reachable while
                the detail scrolls. */}
            <aside className="lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
              <div className="overflow-hidden rounded-xl border p-5">
                {/* The h1 lives here rather than under the gallery: this is the
                    column a buyer reads top to bottom — name, who made it,
                    what it scores, what it costs. */}
                <UserText
                  as="h1"
                  className="block text-2xl font-semibold tracking-tight text-balance"
                >
                  {model.title}
                </UserText>

                <p className="mt-2 text-sm text-muted-foreground">
                  {t("by")}{" "}
                  <Link
                    href={`/designers/${model.author}`}
                    className="font-medium text-brand-accent hover:underline"
                  >
                    {model.author}
                  </Link>
                </p>

                {model.reviews > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                    <span className="font-medium text-foreground">{model.rating}</span>
                    <span className="sr-only">{common("outOf5From")}</span>
                    <span>{t("reviewsCount", { count: number(model.reviews) })}</span>
                  </p>
                )}

                <div className="mt-4 flex items-baseline justify-between gap-3">
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
                <Button asChild variant="outline" className="mt-3 h-10 w-full gap-2">
                  <Link href={`/requests/new?kind=adjustment&model=${model.id}`}>
                    <Ruler className="size-4 text-brand-accent" aria-hidden />
                    {member("adjustCta")}
                  </Link>
                </Button>

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
                <form id="buy-form" action={addToCart} className="mt-5">
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
                              {lic(option.id === "extended" ? "blurbExtended" : "blurbStandard")}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>

                </form>

                {/* Its own form: nesting it inside the add-to-cart form would
                    make one submit carry the other's fields. */}
                <form id="save-form" action={addFavorite}>
                  <input type="hidden" name="slug" value={model.slug} />
                </form>

                {/* Both buttons sit outside their forms and point back with
                    `form`, so two separate actions share one joined block and
                    still work with JavaScript off. Welded into a single unit at
                    the foot of the card — Save is the quieter half up top, buy
                    the loud primary below it as the card's bottom edge. */}
                <CardFooter className="-mx-5 -mb-5 mt-6 flex-col gap-0 border-t-0 bg-transparent p-0">
                  <Button
                    type="submit"
                    form="save-form"
                    variant="outline"
                    className="h-13 w-full gap-2 rounded-none border-x-0 text-base"
                  >
                    <Heart className="size-5" aria-hidden />
                    {t("save")}
                  </Button>
                  <Button
                    type="submit"
                    form="buy-form"
                    className="h-13 w-full gap-2 rounded-none border-0 text-base font-semibold bg-brand text-brand-foreground hover:bg-brand/85"
                  >
                    {model.price === "free" ? (
                      <Download className="size-5" aria-hidden />
                    ) : (
                      <ShoppingCart className="size-5" aria-hidden />
                    )}
                    {model.price === "free" ? t("getModel") : t("addToCart")}
                  </Button>
                </CardFooter>
              </div>

              <div className="mt-4 rounded-xl border p-5">
                <h2 className="text-xs text-muted-foreground">{t("fileFormats")}</h2>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {model.formats.map((format) => (
                    <li
                      key={format}
                      className="flex h-7 min-w-10 items-center justify-center rounded-md border bg-muted/40 px-2 font-mono text-[11px] font-semibold tracking-wide text-foreground uppercase"
                    >
                      {format}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Designer card — the trust signal that decides a lot of
                  marketplace purchases. */}
              <div className="mt-4 rounded-xl border p-5">
                <h2 className="text-xs text-muted-foreground">{t("createdBy")}</h2>
                <div className="mt-3 flex items-center gap-3">
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
                      {model.reviews > 0 ? (
                        <>
                          <Star
                            className="size-3 fill-amber-400 text-amber-400"
                            aria-hidden
                          />
                          {t("ratingDownloads", {
                            rating: model.rating,
                            count: number(model.downloads),
                          })}
                        </>
                      ) : (
                        t("downloadsCount", { count: number(model.downloads) })
                      )}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-4 h-9 w-full">
                  <Link href={`/designers/${model.author}`}>{t("viewStorefront")}</Link>
                </Button>
              </div>

              {/* Keyword tags double as discovery links: each points back at the
                  catalog filtered to that tag, turning one listing into an entry
                  into everything else sharing the keyword. */}
              {model.tags.length > 0 && (
                <div className="mt-4 rounded-xl border p-5">
                  <h2 className="text-xs text-muted-foreground">{t("tags")}</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {model.tags.map((tag) => (
                      <li key={tag}>
                        <Link
                          href={`/3d-models?tag=${encodeURIComponent(tag)}`}
                          dir="auto"
                          className="inline-flex items-center rounded-md border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          {tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* The spec table reads as a scannable sidebar rather than a
                  body section — a jeweler checking metal, stone and size wants
                  it next to the price, not below the fold. */}
              <div className="mt-4 rounded-xl border p-5">
                <h2 className="text-xs text-muted-foreground">{t("specifications")}</h2>
                <dl className="mt-1 divide-y">
                  {specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="flex items-baseline justify-between gap-4 py-2 text-xs"
                    >
                      <dt className="text-muted-foreground">{spec.label}</dt>
                      <dd className="text-end font-medium tabular-nums">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
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
