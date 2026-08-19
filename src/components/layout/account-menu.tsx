"use client"

import { useLocale, useTranslations } from "next-intl"
import { initials } from "@/lib/utils"
import { Link, getPathname } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { useState } from "react"
import { createPortal } from "react-dom"

import { createClient } from "@/lib/supabase/client"
import { useViewer } from "@/lib/queries/viewer"
import {
  Heart,
  Loader2,
  LogOut,
  MessagesSquare,
  Package,
  Store,
  User,
} from "lucide-react"

import { signOutAction } from "@/lib/actions/auth"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * `designerOnly` keeps the seller's home out of a buyer's menu. It sits first
 * because for a designer it is the primary destination; a buyer never sees it
 * and starts at their profile.
 */
const LINKS = [
  { href: "/dashboard", key: "dashboard", Icon: Store, designerOnly: true },
  { href: "/profile", key: "profile", Icon: User },
  { href: "/profile#purchases", key: "purchases", Icon: Package },
  { href: "/requests", key: "requests", Icon: MessagesSquare },
  { href: "/favorites", key: "saved", Icon: Heart },
] as const

/**
 * Signing out.
 *
 * Still a form posting to the server action, so it works with JavaScript off.
 * With JS the action is not what runs: the browser client signs out, which
 * revokes the token and clears the auth cookies itself, then we navigate.
 *
 * The overlay is the point. Measured, the dashboard stayed on screen for about
 * a second after clicking — not because sign-out was slow, but because a soft
 * navigation keeps the current page painted until the destination is ready,
 * and home has stats, trending and facet queries to run first. Nothing that
 * happens off-screen can fix that; the only way to stop showing account data
 * immediately is to stop showing it immediately.
 */
function SignOutForm({
  label,
  onLeaving,
}: {
  label: string
  onLeaving: () => void
}) {
  const locale = useLocale() as Locale

  return (
    <form
      action={signOutAction}
      onSubmit={(event) => {
        event.preventDefault()
        onLeaving()
        void (async () => {
          await createClient().auth.signOut()
          // getPathname, not "/": the default locale is unprefixed but English
          // lives at /en, so a hardcoded root dropped English users into the
          // Hebrew site. replace, not assign — Back must not return to an
          // account page.
          window.location.replace(getPathname({ href: "/", locale }))
        })()
      }}
    >
      <button type="submit" className="flex w-full items-center gap-2">
        <LogOut className="size-4" aria-hidden />
        {label}
      </button>
    </form>
  )
}

/**
 * Signed-out: the login/signup pair. Signed-in: an avatar menu.
 *
 * The session is fetched rather than rendered on the server, which keeps every
 * page static — so there's a brief unknown state on first load. It has to come
 * from the shared query cache and not component state: SiteHeader is rendered
 * per page rather than in the layout, so this remounts on every navigation, and
 * local state re-entered the loading branch each time. A skeleton that then
 * resolved to a differently sized avatar resized the whole actions block on
 * every route change, which dragged the compact search sideways with it.
 *
 * The skeleton is avatar-shaped for the same reason: it is the size the
 * signed-in state settles at, so nothing moves when the session lands.
 */
export function AccountMenu() {
  const t = useTranslations("nav")
  const { data: viewer, isPending } = useViewer()
  const [leaving, setLeaving] = useState(false)

  if (isPending) {
    return <Skeleton className="size-8 rounded-full" />
  }

  if (!viewer) {
    return (
      <>
        <Button
          variant="ghost"
          className="hidden sm:inline-flex"
          asChild
        >
          <Link href="/login">{t("logIn")}</Link>
        </Button>
        <Button
          className="hidden bg-brand text-brand-foreground hover:bg-brand/85 sm:inline-flex"
          asChild
        >
          <Link href="/signup">{t("signUp")}</Link>
        </Button>
      </>
    )
  }

  const name = viewer.name ?? viewer.email ?? t("account")

  return (
    <>
      {/* Portalled to <body> deliberately. The header sets backdrop-blur, and a
          backdrop-filter creates a containing block for fixed descendants — so
          rendered in place, `fixed inset-0` resolved to the header's 64px box
          and covered nothing. */}
      {/* Reaching this branch means the viewer query resolved on the client, so
          we are past hydration and document.body is safe to portal into. */}
      {leaving &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[60] flex items-center justify-center gap-3 bg-background text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("signingOut")}
          </div>,
          document.body,
        )}

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${t("account")}: ${name}`}
          title={name}
          className="inline-flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
        >
          <Avatar className="size-8 border border-border">
            <AvatarFallback className="bg-brand text-xs font-semibold text-brand-foreground">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{name}</span>
          <span
            title={viewer.email ?? undefined}
            className="truncate text-xs font-normal text-muted-foreground"
          >
            {viewer.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LINKS.filter(
          (link) => !("designerOnly" in link) || viewer.accountType === "designer",
        ).map(({ href, key, Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href}>
              <Icon className="size-4" aria-hidden />
              {t(key)}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <SignOutForm label={t("logOut")} onLeaving={() => setLeaving(true)} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}
