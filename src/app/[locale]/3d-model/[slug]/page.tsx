import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Check,
  ChevronRight,
  Download,
  FileBox,
  Heart,
  ShieldCheck,
  Star,
} from "lucide-react"

import { ASSET_CATEGORIES } from "@/lib/data/landing"
import {
  LICENSE_LABELS,
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
import { Thumb } from "@/components/marketplace/thumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { addToCart } from "@/lib/actions/cart"
import { addFavorite } from "@/lib/actions/favorites"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { initials } from "@/lib/data/account"
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

  const category = ASSET_CATEGORIES.find((c) => c.slug === model.category)
  const related = await getRelated(model)
  const price = model.price === "free" ? "Free" : `$${model.price}`
  const reviews = await getReviews(model)
  const files = await getFiles(model)
  const licenses = await getLicenseOptions(model)

  const specs = [
    { label: "Polygons", value: number(model.polygons) },
    { label: "Vertices", value: number(model.vertices) },
    { label: "Formats", value: model.formats.join(", ") },
    { label: "License", value: LICENSE_LABELS[model.license] },
    { label: "Rigged", value: model.rigged ? "Yes" : "No" },
    { label: "Animated", value: model.animated ? "Yes" : "No" },
    { label: "PBR materials", value: model.pbr ? "Yes" : "No" },
    { label: "Downloads", value: number(model.downloads) },
  ]

  return (
    <>
      <SiteHeader solid />

      <main className="flex-1 pt-16">
        <div className="shell py-6">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li>
                <Link href="/3d-models" className="hover:text-foreground">
                  3D models
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
                      {category.label}
                    </Link>
                  </li>
                </>
              )}
              <ChevronRight className="size-3 rtl:-scale-x-100" aria-hidden />
              <li aria-current="page" className="truncate text-foreground">
                {model.title}
              </li>
            </ol>
          </nav>

          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0">
              <Thumb
                seed={model.seed}
                className="aspect-16/10 w-full rounded-xl border"
              />

              {/* A real viewer comes with the asset pipeline; until then the
                  generated artwork stands in for the render set. */}
              <div className="mt-3 grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <Thumb
                    key={n}
                    seed={`${model.seed}-view-${n}`}
                    grid={false}
                    className="aspect-4/3 rounded-lg border"
                  />
                ))}
              </div>

              <UserText
                as="h1"
                className="mt-8 block text-2xl font-semibold tracking-tight text-balance"
              >
                {model.title}
              </UserText>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span>
                  by{" "}
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
                  <span className="sr-only">out of 5 from</span>
                  <span>({number(model.reviews)} reviews)</span>
                </span>
                <span className="flex items-center gap-1">
                  <Download className="size-4" aria-hidden />
                  {number(model.downloads)} downloads
                </span>
              </div>

              <UserText
                as="p"
                className="mt-5 block max-w-2xl text-sm leading-relaxed text-muted-foreground"
              >
                {model.description}
              </UserText>

              <h2 className="mt-10 text-lg font-semibold tracking-tight">
                Specifications
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
                What you get
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
                <h2 className="text-lg font-semibold tracking-tight">Reviews</h2>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  <span className="font-medium text-foreground">{model.rating}</span>
                  out of 5 · {number(model.reviews)} reviews
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
                    {price}
                  </span>
                  {model.badge && <Badge variant="secondary">{model.badge}</Badge>}
                </div>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  {LICENSE_LABELS[model.license]} license — commercial use
                  included.
                </p>

                {/* The licence picker and the add button are one form, so
                    the chosen tier posts with it. Radios + submit means it
                    works with JS disabled and there's no client state to keep
                    in sync with the cart cookie. */}
                <form action={addToCart} className="mt-5">
                  <input type="hidden" name="slug" value={model.slug} />

                  <fieldset>
                    <legend className="sr-only">Choose a license</legend>
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
                              <span className="text-sm font-medium">{option.name}</span>
                              <span className="text-sm font-semibold tabular-nums">
                                {option.price === 0 ? "Free" : `$${option.price}`}
                              </span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {option.blurb}
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
                      {model.price === "free" ? "Get this model" : "Add to cart"}
                    </Button>
                  </div>
                </form>

                {/* Its own form: nesting it inside the add-to-cart form would
                    make one submit carry the other's fields. */}
                <form action={addFavorite} className="mt-2">
                  <input type="hidden" name="slug" value={model.slug} />
                  <Button type="submit" variant="outline" className="h-10 w-full">
                    <Heart className="size-4" aria-hidden />
                    Save for later
                  </Button>
                </form>

                <ul className="mt-5 flex flex-col gap-2 border-t pt-4">
                  {[
                    `${model.formats.length} file formats included`,
                    "Free lifetime updates",
                    "Invoice issued on purchase",
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
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {model.author}
                    </Link>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                      {model.rating} · {number(model.downloads)} downloads
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-4 h-9 w-full">
                  <Link href={`/designers/${model.author}`}>View storefront</Link>
                </Button>
              </div>

              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-px size-4 shrink-0 text-brand-accent" aria-hidden />
                Every model is checked against our publishing guidelines before it
                goes on sale.
              </p>
            </aside>
          </div>

          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-lg font-semibold tracking-tight">
                More in {category?.label ?? "this category"}
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
