"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import {
  ArrowRight,
  BookOpen,
  Building2,
  Circle,
  Crown,
  Diamond,
  Flame,
  Gem,
  Gift,
  LayoutDashboard,
  LayoutGrid,
  Link2,
  Menu,
  MessagesSquare,
  PenTool,
  Printer,
  Sliders,
  Sparkles,
  Store,
  Upload,
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
const NAV_KEYS: Record<string, "models" | "production" | "custom" | "designers"> = {
  "/3d-models": "models",
  "/3d-models/cast-ready": "production",
  "/custom-work": "custom",
  "/designers": "designers",
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
 * The utility ribbon's standing links. Deliberately not PRIMARY_NAV: this row
 * is for what a returning buyer or a designer goes looking for, not the catalog
 * taxonomy the nav below already covers.
 */
const RIBBON_LINKS = [
  { key: "castReady", href: "/3d-models/cast-ready" },
  { key: "custom", href: "/custom-work" },
  { key: "sell", href: "/sell" },
] as const

/**
 * Row 1. Dropped below sm, where the bar and the membership ribbon already own
 * more of a phone screen than chrome should — `.header-offset` matches.
 *
 * Three grid columns rather than a flex row with `mx-auto`: the centre column
 * has to sit on the page's centre line, and under flex it would only sit
 * midway between two side clusters of unequal width.
 */
function UtilityRibbon() {
  const t = useTranslations("landing.ribbon")

  return (
    <div className="hidden bg-ink text-xs text-white/60 sm:block">
      {/* minmax(0,1fr) on the side tracks, not 1fr: a bare 1fr is
          minmax(auto,1fr) and grows past its share to fit its content, which
          drags the "centred" middle column off the page's centre line by half
          of whatever the links overrun by.

          overflow-hidden and a min-0 centre track are load-bearing, not tidying:
          the row is a fixed h-9 that `.header-offset` has measured, so a long
          translation has to be clipped rather than allowed to wrap the strip
          onto a second line and push the whole page down behind the nav. */}
      <div className="shell grid h-9 grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)] items-center gap-4 overflow-hidden">
        {/* Only from xl: at lg the strip is already carrying the tag, the
            studio line and the contact link. */}
        <nav className="hidden items-center gap-4 overflow-hidden xl:flex">
          {RIBBON_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="whitespace-nowrap transition-colors hover:text-white"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <p className="col-start-2 flex min-w-0 items-center justify-center gap-2">
          <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 font-medium text-white">
            {t("tag")}
          </span>
          <span className="hidden truncate md:inline">{t("studio")}</span>
        </p>

        <Link
          href="/custom-work"
          className="col-start-3 hidden items-center justify-self-end gap-1.5 whitespace-nowrap transition-colors hover:text-white lg:flex"
        >
          <MessagesSquare className="size-3.5 shrink-0" aria-hidden />
          {t("contact")}
        </Link>
      </div>
    </div>
  )
}

/**
 * Row 3. The subscription is the client's headline offer, so it rides under the
 * nav on every page the way a marketplace runs its house banner. The price chip
 * is the point of it: it turns "membership" from a word into an amount without
 * making the visitor open the pricing page to find out.
 */
function MembershipRibbon() {
  const member = useTranslations("membership")

  return (
    <Link
      href="/pricing"
      className="flex h-10 items-center justify-center gap-2 bg-brand px-4 text-center text-xs text-white/90 transition-colors hover:bg-brand/90 sm:text-sm"
    >
      <Sparkles className="hidden size-3.5 shrink-0 sm:block" aria-hidden />
      <span className="truncate font-medium">{member("stripTitle")}</span>
      <span className="hidden shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white tabular-nums sm:inline">
        {member("stripPrice")}
      </span>
      <span aria-hidden className="hidden text-white/40 sm:inline">·</span>
      <span className="hidden shrink-0 items-center gap-1 font-medium text-white sm:inline-flex">
        {member("cta")}
        <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
      </span>
    </Link>
  )
}

/**
 * Solid white marketplace header — a 3D-asset store's chrome, not a boutique's.
 *
 * Three stacked rows, the way a high-traffic marketplace layers its chrome:
 *
 *   1. a dark utility ribbon — standing links on the leading edge, the studio's
 *      one-line identity centred, a way to reach us on the trailing edge;
 *   2. the white nav bar — logo, a search that stays visible on every page (the
 *      store's primary action), category nav and account actions;
 *   3. the raspberry membership ribbon — the client's headline offer.
 *
 * The membership ribbon used to sit on top. It reads louder *under* the bar:
 * the eye lands on the logo and search first, then the offer, rather than
 * meeting a full-bleed sales strip before it knows what the site is.
 *
 * Nothing here floats over the hero or recolours on scroll. The stack is
 * 6.5rem tall on mobile (the utility ribbon is dropped) and 8.75rem from sm up;
 * pages clear it with `.header-offset` rather than counting the rows again.
 */
export function SiteHeader() {
  const t = useTranslations("nav")
  const nav = useTranslations("landing.navChildren")
  const member = useTranslations("membership")

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <UtilityRibbon />

      <div className="bg-background">
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

      <MembershipRibbon />
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
