"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Saved and cart links with live counts.
 *
 * Counts are fetched rather than server-rendered: the header sits on the
 * statically prerendered model pages, and reading the cookies during render
 * would make all 72 of them dynamic. One request covers both. Refetches on
 * navigation, which catches every mutation since they all redirect or
 * revalidate.
 */

type Counts = { cart: number; favorites: number }

function Badge({ value }: { value: number }) {
  if (value <= 0) return null
  return (
    <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground tabular-nums">
      {value}
    </span>
  )
}

export function HeaderBadges() {
  const pathname = usePathname()
  const [counts, setCounts] = useState<Counts>({ cart: 0, favorites: 0 })

  useEffect(() => {
    let active = true
    fetch("/api/counts")
      .then((res) => res.json())
      .then((data: Counts) => {
        if (active) setCounts({ cart: data.cart ?? 0, favorites: data.favorites ?? 0 })
      })
      .catch(() => {
        // A failed count must not blank the links themselves.
      })
    return () => {
      active = false
    }
  }, [pathname])

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
