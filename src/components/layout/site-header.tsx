"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, Menu, ShoppingCart, Upload } from "lucide-react"

import { cn } from "@/lib/utils"
import { PRIMARY_NAV } from "@/lib/data/landing"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Logo } from "@/components/layout/logo"
import { SearchForm } from "@/components/forms/search-form"

/**
 * The header floats over the hero at the top of the page and hardens into a
 * solid sticky bar (with its own compact search) once the hero scrolls away.
 */
export function SiteHeader() {
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 220)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        stuck
          ? "border-b border-white/10 bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/80"
          : "bg-transparent"
      )}
    >
      <div className="shell flex h-16 items-center gap-4">
        <Logo />

        <NavigationMenu className="hidden lg:flex" viewport={false}>
          <NavigationMenuList>
            {PRIMARY_NAV.map((item) => (
              <NavigationMenuItem key={item.label}>
                <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white">
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[520px] gap-1 p-2 md:grid-cols-2">
                    {item.children?.map((child) => (
                      <li key={child.label}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={child.href}
                            className="block rounded-md p-3 leading-tight no-underline outline-none transition-colors hover:bg-accent focus:bg-accent"
                          >
                            <div className="text-sm font-medium">
                              {child.label}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {child.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Compact search only earns its space once the hero search is gone. */}
        <div
          className={cn(
            "ml-auto hidden max-w-xs flex-1 transition-all duration-300 md:block",
            stuck
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          )}
        >
          <SearchForm size="compact" placeholder="Search 3D models" />
        </div>

        <div className={cn("flex items-center gap-1", !stuck && "ml-auto")}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Favorites"
            className="hidden text-white/85 hover:bg-white/10 hover:text-white sm:inline-flex"
            asChild
          >
            <Link href="/favorites">
              <Heart className="size-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cart"
            className="hidden text-white/85 hover:bg-white/10 hover:text-white sm:inline-flex"
            asChild
          >
            <Link href="/cart">
              <ShoppingCart className="size-5" />
            </Link>
          </Button>

          <Separator
            orientation="vertical"
            className="mx-2 hidden !h-5 bg-white/20 sm:block"
          />

          <Button
            variant="ghost"
            className="hidden text-white/85 hover:bg-white/10 hover:text-white sm:inline-flex"
            asChild
          >
            <Link href="/login">Log in</Link>
          </Button>
          <Button
            className="hidden bg-brand text-brand-foreground hover:bg-brand/85 sm:inline-flex"
            asChild
          >
            <Link href="/signup">Sign up</Link>
          </Button>

          <MobileNav />
        </div>
      </div>
    </header>
  )
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="text-white hover:bg-white/10 lg:hidden"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] overflow-y-auto p-0">
        <SheetHeader className="border-b">
          <SheetTitle>
            <Logo tone="dark" />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-6 p-4">
          {PRIMARY_NAV.map((item) => (
            <div key={item.label}>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {item.label}
              </p>
              <ul className="space-y-1">
                {item.children?.map((child) => (
                  <li key={child.label}>
                    <SheetClose asChild>
                      <Link
                        href={child.href}
                        className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        {child.label}
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-2 border-t p-4">
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/85">
            <Link href="/sell">
              <Upload className="size-4" />
              Start selling
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
