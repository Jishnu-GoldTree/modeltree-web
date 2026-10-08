"use client"

import { Suspense } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import {
  BookOpen,
  Building2,
  Circle,
  Crown,
  Diamond,
  Download,
  Flame,
  Gem,
  Gift,
  LayoutDashboard,
  LayoutGrid,
  Link2,
  Menu,
  PenTool,
  Printer,
  ReceiptText,
  ShieldCheck,
  Sliders,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react"

import { PRIMARY_NAV, type NavChildIcon } from "@/lib/data/landing"
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
 * Top-level nav labels come from PRIMARY_NAV, which is data rather than copy.
 * Mapping by href keeps the translation next to the routing instead of
 * duplicating the menu structure into the message catalogs. Dropdown children
 * carry their own keys under `landing.navChildren`.
 */
const NAV_KEYS: Record<string, "models" | "production" | "custom"> = {
  "/3d-models": "models",
  "/3d-models/cast-ready": "production",
  "/custom-work": "custom",
}

/** Maps the icon name on each nav child to its lucide component. */
const NAV_ICONS: Record<NavChildIcon, LucideIcon> = {
  grid: LayoutGrid,
  diamond: Diamond,
  circle: Circle,
  gem: Gem,
  sparkles: Sparkles,
  crown: Crown,
  flame: Flame,
  printer: Printer,
  link: Link2,
  gift: Gift,
  sliders: Sliders,
  pen: PenTool,
  building: Building2,
  store: Store,
  dashboard: LayoutDashboard,
  book: BookOpen,
}

/**
 * Row 1: the three promises a first-time buyer needs before they trust a
 * checkout, the way a jeweller's storefront runs its delivery and returns line.
 * Statements, not links: each is backed by a policy page in the footer.
 *
 * Dropped below sm, where a phone screen can't spare the height —
 * `.header-offset` accounts for it. Below lg only the first promise shows, so
 * the fixed h-9 row never wraps and pushes the page under the nav.
 */
const ANNOUNCEMENTS = [
  { key: "download", Icon: Download },
  { key: "shekels", Icon: ReceiptText },
  { key: "licence", Icon: ShieldCheck },
] as const

function AnnouncementBar() {
  const t = useTranslations("home.announce")

  return (
    <div className="hidden bg-ink text-xs text-white/75 sm:block">
      <ul className="shell flex h-9 items-center justify-center gap-8 overflow-hidden">
        {ANNOUNCEMENTS.map(({ key, Icon }, i) => (
          <li
            key={key}
            className={i === 0 ? "flex items-center gap-1.5 whitespace-nowrap" : "hidden items-center gap-1.5 whitespace-nowrap lg:flex"}
          >
            <Icon className="size-3.5 text-brand-on-ink" aria-hidden />
            {t(key)}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Two rows: the announcement strip, then the white nav bar with the logo, a
 * search that stays visible on every page (the store's primary action), the
 * category nav and the account actions. Nothing floats over the hero or
 * recolours on scroll; pages clear the stack with `.header-offset`.
 */
export function SiteHeader() {
  const t = useTranslations("nav")
  const nav = useTranslations("landing.navChildren")
  const member = useTranslations("membership")

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <AnnouncementBar />

      <div className="border-b bg-background">
        <div className="shell flex h-16 items-center gap-4">
          <Logo tone="dark" />

          {/* Search leads the bar and stays put on every page — it is the store's
              primary verb, not something that only appears once the hero scrolls
              away. Given a generous fixed width so it reads as the centrepiece
              while still leaving the trailing cluster room. */}
          <div className="hidden w-full max-w-sm md:block lg:max-w-md xl:max-w-lg">
            <SearchForm size="compact" commandKey />
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
                        {item.children?.map((child) => {
                          const Icon = NAV_ICONS[child.icon]
                          return (
                            <li key={child.key}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={child.href}
                                  className="flex items-start gap-3 rounded-md p-3 leading-tight no-underline outline-none transition-colors hover:bg-accent focus:bg-accent"
                                >
                                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand/15 text-brand-accent">
                                    <Icon className="size-4" aria-hidden />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-sm font-medium">
                                      {nav(`${child.key}.label`)}
                                    </span>
                                    <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">
                                      {nav(`${child.key}.description`)}
                                    </span>
                                  </span>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          )
                        })}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* The client's headline offer stays one click away on every page.
                Hidden below sm, where the row is already tight. */}
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
            {/* Reads the current path to build the other locale's URL — request
                data, so it needs its own boundary rather than blocking the
                header's shell. */}
            <Suspense fallback={null}>
              <LocaleSwitcher />
            </Suspense>

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
          <SheetClose asChild>
            <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/85">
              <Link href="/3d-models">{t("browseModels")}</Link>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button variant="outline" asChild>
              <Link href="/about">{t("about")}</Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
