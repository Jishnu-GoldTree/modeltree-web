"use client"

import Link from "next/link"
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
  const counts = useCounts()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={
          counts.favorites ? `Saved models, ${counts.favorites}` : "Saved models"
        }
        className="relative hidden text-white/85 hover:bg-white/10 hover:text-white sm:inline-flex"
        asChild
      >
        <Link href="/favorites">
          <Heart className="size-5" />
          <Badge value={counts.favorites} />
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={counts.cart ? `Cart, ${counts.cart} items` : "Cart"}
        className="relative hidden text-white/85 hover:bg-white/10 hover:text-white sm:inline-flex"
        asChild
      >
        <Link href="/cart">
          <ShoppingCart className="size-5" />
          <Badge value={counts.cart} />
        </Link>
      </Button>
    </>
  )
}
