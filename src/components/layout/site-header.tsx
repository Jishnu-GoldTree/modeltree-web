"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ArrowRight, Gem, Menu, Upload } from "lucide-react"

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
 * Solid white marketplace header — a 3D-asset store's chrome, not a boutique's.
 *
 * A slim promo strip sits on top; below it a white nav bar carries the logo, a
 * prominent search that stays visible on every page (the store's primary action),
 * then the category nav and account actions clustered on the trailing edge.
 *
 * The bar no longer floats over the hero or recolours on scroll. The fixed stack
 * is 104px tall (h-10 strip + h-16 bar); pages clear it with `pt-26`.
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

export function SiteHeader() {
  const t = useTranslations("nav")
  const nav = useTranslations("landing.navChildren")
  const member = useTranslations("membership")

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Promo strip — the subscription is the client's headline offer, so it
          rides above every page the way a marketplace runs its house banner. */}
      <Link
        href="/pricing"
        className="flex h-10 items-center justify-center gap-2 bg-ink px-4 text-center text-xs text-white/90 transition-colors hover:bg-ink/90 sm:text-sm"
      >
        <span className="truncate font-medium">{member("stripTitle")}</span>
        <span aria-hidden className="hidden text-white/40 sm:inline">·</span>
        <span className="hidden shrink-0 items-center gap-1 font-medium text-brand sm:inline-flex">
          {member("cta")}
          <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
        </span>
      </Link>

      <div className="border-b bg-background">
        <div className="shell flex h-16 items-center gap-4">
          <Logo tone="dark" />

          {/* Search leads the bar and stays put on every page — it is the store's
              primary verb, not something that only appears once the hero scrolls
              away. Given a generous fixed width so it reads as the centrepiece
              while still leaving the trailing cluster room. */}
          <div className="hidden w-full max-w-sm md:block lg:max-w-md xl:max-w-lg">
            <SearchForm size="compact" />
          </div>

          {/* Category nav and account actions form one trailing cluster, pushed
              to the far edge so the search owns the left. */}
          <div className="ms-auto flex items-center gap-1">
            <NavigationMenu className="hidden lg:flex" viewport={false}>
              <NavigationMenuList>
                {PRIMARY_NAV.map((item) => (
                  <NavigationMenuItem key={item.label}>
                    <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-foreground/80">
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

            {/* The membership is the thing the client most wants seen, so it
                sits in the header on every page. Hidden below sm, where the row
                is already tight. */}
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="hidden text-brand-accent hover:bg-brand-muted hover:text-brand-accent sm:inline-flex"
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
              className="mx-2 hidden !h-5 data-vertical:self-center sm:block"
            />

            <AccountMenu />

            <MobileNav />
          </div>
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
          className="lg:hidden"
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
