"use client"

import { useTranslations } from "next-intl"
import { initials } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { useEffect, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import {
  Heart,
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

const LINKS = [
  { href: "/dashboard", key: "dashboard", Icon: Store },
  { href: "/profile", key: "profile", Icon: User },
  { href: "/profile#purchases", key: "purchases", Icon: Package },
  { href: "/requests", key: "requests", Icon: MessagesSquare },
  { href: "/favorites", key: "saved", Icon: Heart },
] as const

/**
 * Signed-out: the login/signup pair. Signed-in: an avatar menu.
 *
 * The session is fetched on mount rather than rendered on the server, which
 * keeps every page static — so there's a brief unknown state. It renders as a
 * skeleton the same size as the buttons, otherwise the header reflows once the
 * session lands.
 */
export function AccountMenu() {
  const t = useTranslations("nav")
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    // Keeps the header in step with sign-in/out that happens in another tab or
    // on a page this component didn't navigate through.
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null),
    )
    return () => subscription.subscription.unsubscribe()
  }, [])

  if (loading) {
    return <Skeleton className="h-8 w-28 rounded-md bg-white/10" />
  }

  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          className="hidden text-white/85 hover:bg-white/10 hover:text-white sm:inline-flex"
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

  const name =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Account"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account menu for ${name}`}
          className="inline-flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
        >
          <Avatar className="size-8 border border-white/20">
            <AvatarFallback className="bg-brand text-xs font-semibold text-brand-foreground">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LINKS.map(({ href, key, Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href}>
              <Icon className="size-4" aria-hidden />
              {t(key)}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          {/* A form, not an onClick: signing out is a state change, so it goes
              through a POST that works even if the JS handler never runs. */}
          <form action={signOutAction}>
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut className="size-4" aria-hidden />
              {t("logOut")}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
