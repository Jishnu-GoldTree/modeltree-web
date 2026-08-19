"use client"

import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { Heart, ShoppingCart } from "lucide-react"

import { useCounts } from "@/lib/queries/counts"
import { Button } from "@/components/ui/button"

/**
 * Saved and cart links with live counts.
 *
 * Counts are fetched rather than server-rendered: the header sits on the
 * statically prerendered model pages, and reading the cookies during render
 * would make all of them dynamic. Both badges read one shared query, so this
 * costs a single request no matter how many badges exist.
 */

function Badge({ value }: { value: number }) {
  if (value <= 0) return null
  return (
    <span className="absolute -top-0.5 -end-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground tabular-nums">
      {value}
    </span>
  )
}

export function HeaderBadges() {
  const t = useTranslations("nav")
  const counts = useCounts()

  const savedLabel = counts.favorites
    ? `${t("saved")}, ${counts.favorites}`
    : t("saved")
  const cartLabel = counts.cart
    ? `${t("cart")}, ${counts.cart}`
    : t("cart")

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={savedLabel}
        title={savedLabel}
        className="relative hidden sm:inline-flex"
        asChild
      >
        <Link href="/favorites">
          <Heart className="size-5" aria-hidden />
          <Badge value={counts.favorites} />
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={cartLabel}
        title={cartLabel}
        className="relative hidden sm:inline-flex"
        asChild
      >
        <Link href="/cart">
          <ShoppingCart className="size-5" aria-hidden />
          <Badge value={counts.cart} />
        </Link>
      </Button>
    </>
  )
}
