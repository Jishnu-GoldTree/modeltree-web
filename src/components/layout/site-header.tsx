"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Link } from "@/i18n/navigation"
import { Gem, Menu, Upload } from "lucide-react"

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
import { AccountMenu } from "@/components/layout/account-menu"
import { HeaderBadges } from "@/components/layout/header-badges"
import { LocaleSwitcher } from "@/components/layout/locale-switcher"
import { SearchForm } from "@/components/forms/search-form"

/**
 * The header floats over the hero at the top of the page and hardens into a
 * solid sticky bar (with its own compact search) once the hero scrolls away.
 *
 * `solid` starts it hardened. The floating state paints its logo, nav and
 * actions in white, which only works over a dark hero — on an interior page
 * with a light background the entire header renders invisible. Any page that
 * doesn't open on a dark band wants `solid`.
 */
/**
 * Top-level nav labels come from PRIMARY_NAV, which is data rather than copy.
 * Mapping by href keeps the translation next to the routing instead of
 * duplicating the menu structure into the message catalogs. Dropdown children
 * carry their own keys under `landing.navChildren`.
 */
const NAV_KEYS: Record<string, "models" | "production" | "custom" | "designers"> = {
  "/3d-models": "models",
  "/3d-models/cast-ready": "production",
  "/custom-work": "custom",
  "/designers": "designers",
}

export function SiteHeader({ solid = false }: { solid?: boolean }) {
  const t = useTranslations("nav")
  const nav = useTranslations("landing.navChildren")
  const member = useTranslations("membership")
  const [scrolled, setScrolled] = useState(false)
  const stuck = solid || scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 220)
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
                {/* The trigger sits on a dark bar, so every state has to be
                    overridden off the light default. Use `data-open:` (not
                    `data-[state=open]:`) to match the variant stacks the base
                    style uses — otherwise twMerge sees different modifiers,
                    keeps both, and the base's `data-open:hover:bg-muted` wins
                    the cascade, leaving white text on a near-white pill. */}
                <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white focus:bg-white/10 data-open:bg-white/10 data-open:text-white data-open:hover:bg-white/10 data-open:focus:bg-white/10 data-popup-open:bg-white/10 data-popup-open:hover:bg-white/10">
                  {NAV_KEYS[item.href] ? t(NAV_KEYS[item.href]) : item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  {/* gap-2, not gap-1: each row paints a full-width hover fill,
                      so a 4px gutter left neighbouring fills visually touching. */}
                  <ul className="grid w-[520px] gap-2 p-2 md:grid-cols-2">
                    {item.children?.map((child) => (
                      <li key={child.key}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={child.href}
                            className="block rounded-md p-3 leading-tight no-underline outline-none transition-colors hover:bg-accent focus:bg-accent"
                          >
                            <div className="text-sm font-medium">
                              {nav(`${child.key}.label`)}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {nav(`${child.key}.description`)}
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
            "ms-auto hidden max-w-xs flex-1 transition-all duration-300 md:block",
            stuck
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          )}
        >
          {/* No placeholder prop: SearchForm falls back to the translated
              nav.search, which a hardcoded English string was overriding. */}
          <SearchForm size="compact" />
        </div>

        {/* Pushed right by its own auto margin, except at md+ when stuck —
            there the compact search above carries the auto margin instead.
            Below md that search is display:none, so this must keep its own or
            the actions collapse against the logo. */}
        <div className={cn("flex items-center gap-1 ms-auto", stuck && "md:ms-0")}>
          {/* The membership is the thing the client most wants seen, so it sits
              in the header on every page rather than only on the landing page.
              Hidden below sm, where the row is already tight. */}
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="hidden text-white/85 hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            <Link href="/pricing">
              <Gem className="size-4" aria-hidden />
              {member("headerCta")}
            </Link>
          </Button>

          <HeaderBadges />
          <LocaleSwitcher />

          {/* data-vertical:self-center, not self-center: the base separator
              style sets data-vertical:self-stretch, which wins on specificity
              and makes the rule stretch to the line box before !h-5 caps it at
              20px — leaving it sitting 6px above the avatar's centre. */}
          <Separator
            orientation="vertical"
            className="mx-2 hidden !h-5 bg-white/20 data-vertical:self-center sm:block"
          />

          <AccountMenu />

          <MobileNav />
        </div>
      </div>
    </header>
  )
}

function MobileNav() {
  const t = useTranslations("nav")
  const nav = useTranslations("landing.navChildren")

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("openMenu")}
          title={t("openMenu")}
          className="text-white hover:bg-white/10 lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="end" className="w-[320px] overflow-y-auto p-0">
        <SheetHeader className="border-b">
          <SheetTitle>
            <Logo tone="dark" />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-6 p-4">
          {PRIMARY_NAV.map((item) => (
            <div key={item.label}>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {NAV_KEYS[item.href] ? t(NAV_KEYS[item.href]) : item.label}
              </p>
              <ul className="space-y-1">
                {item.children?.map((child) => (
                  <li key={child.key}>
                    <SheetClose asChild>
                      <Link
                        href={child.href}
                        className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        {nav(`${child.key}.label`)}
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
              <Upload className="size-4" aria-hidden />
              {t("sell")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">{t("logIn")}</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
