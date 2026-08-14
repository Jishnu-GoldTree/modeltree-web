"use client"

import { useTranslations } from "next-intl"
import { initials } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { useEffect, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import { useViewer } from "@/lib/queries/viewer"
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
 * Signed-out: the login/signup pair. Signed-in: an avatar menu.
 *
 * The session is fetched on mount rather than rendered on the server, which
 * keeps every page static — so there's a brief unknown state. It renders as a
 * skeleton the same size as the buttons, otherwise the header reflows once the
 * session lands.
 */
export function AccountMenu() {
  const t = useTranslations("nav")
  const { data: viewer } = useViewer()
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
          aria-label={`${t("account")}: ${name}`}
          title={name}
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
          <span
            title={user.email}
            className="truncate text-xs font-normal text-muted-foreground"
          >
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LINKS.filter(
          // Undefined while the account type is still loading, so the item
          // stays hidden rather than flashing in and out for a buyer.
          (link) => !("designerOnly" in link) || viewer?.accountType === "designer",
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
          {/* A form, not an onClick: signing out is a state change, so it goes
              through a POST that works even if the JS handler never runs.

              The onSubmit is what makes the header update without a refresh.
              signOutAction runs on the server and clears the httpOnly cookies
              there, which the browser's Supabase client has no way to observe
              — it never emits SIGNED_OUT, so this component's `user` state and
              the cached viewer query both kept believing someone was signed
              in. Clearing local state here fires that event; scope "local"
              skips the network revoke because the server action is already
              doing it. Fired without awaiting so the POST still goes through
              on the same click. */}
          <form
            action={signOutAction}
            onSubmit={() => {
              void createClient().auth.signOut({ scope: "local" })
            }}
          >
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
