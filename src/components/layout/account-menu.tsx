"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Heart, LayoutDashboard, LogOut, Package, User } from "lucide-react"

import { signOutAction } from "@/lib/actions/auth"
import { initials } from "@/lib/data/account"
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
  { href: "/profile", label: "Your profile", Icon: User },
  { href: "/profile#purchases", label: "Purchases", Icon: Package },
  { href: "/favorites", label: "Saved models", Icon: Heart },
  { href: "/dashboard", label: "Designer dashboard", Icon: LayoutDashboard },
]

/**
 * Signed-out: the login/signup pair. Signed-in: an avatar menu.
 *
 * The session is fetched on mount rather than rendered on the server, which
 * keeps every page static — so there's a brief unknown state. It renders as a
 * skeleton the same size as the buttons, otherwise the header reflows once the
 * session lands.
 */
export function AccountMenu() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <Skeleton className="h-8 w-28 rounded-md bg-white/10" />
  }

  if (!session?.user) {
    return (
      <>
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
      </>
    )
  }

  const name = session.user.name ?? "Account"

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
            {session.user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LINKS.map(({ href, label, Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href}>
              <Icon className="size-4" aria-hidden />
              {label}
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
              Log out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
