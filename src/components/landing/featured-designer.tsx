import Link from "next/link"
import { Star } from "lucide-react"

import { FEATURED_DESIGNER } from "@/lib/data/landing"
import { Thumb } from "@/components/marketplace/thumb"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/landing/section-heading"

export function FeaturedDesigner() {
  const designer = FEATURED_DESIGNER

  return (
    <section className="shell py-16 sm:py-20">
      <SectionHeading
        title="Featured Designer"
        action={{ label: "Browse all designers", href: "/designers" }}
      />

      <div className="mt-6 grid gap-6 rounded-2xl border bg-card p-6 lg:grid-cols-[280px_1fr]">
        <div>
          <Avatar className="size-14">
            <AvatarFallback className="bg-ink text-base font-semibold text-ink-foreground">
              {designer.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <h3 className="mt-4 text-lg font-semibold tracking-tight">
            {designer.name}
          </h3>
          <p className="text-sm text-muted-foreground">{designer.handle}</p>

          <div className="mt-3 flex items-center gap-1.5">
            <div className="flex" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <span className="text-sm font-medium">{designer.rating}</span>
            <span className="text-sm text-muted-foreground">
              ({designer.reviews.toLocaleString()} reviews)
            </span>
          </div>

          <p className="mt-4 text-sm text-pretty text-muted-foreground">
            {designer.bio}
          </p>

          <dl className="mt-4 flex gap-6 text-sm">
            <div>
              <dt className="text-muted-foreground">Models</dt>
              <dd className="font-medium">{designer.models}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Selling since</dt>
              <dd className="font-medium">{designer.since}</dd>
            </div>
          </dl>

          <ul className="mt-4 flex flex-wrap gap-1.5">
            {designer.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              </li>
            ))}
          </ul>

          <Button variant="outline" asChild className="mt-5 w-full">
            <Link href={`/designers/${designer.handle.replace("@", "")}`}>
              View storefront
            </Link>
          </Button>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {designer.works.map((work) => (
            <li key={work.seed}>
              <Link
                href={`/3d-models/${work.seed}`}
                className="group block overflow-hidden rounded-xl border outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
              >
                <Thumb
                  seed={work.seed}
                  className="aspect-square transition-transform duration-300 group-hover:scale-[1.04]"
                />
                <div className="bg-background p-3">
                  <p className="line-clamp-1 text-sm font-medium">
                    {work.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    ${work.price}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
