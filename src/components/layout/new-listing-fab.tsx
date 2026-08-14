"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, usePathname } from "@/i18n/navigation"
import { useViewer } from "@/lib/queries/viewer"

/**
 * Floating "new listing" button, for sellers only.
 *
 * Publishing is the action a designer repeats; putting it one tap away on
 * every page beats making them find the dashboard first. Hidden for buyers,
 * and hidden on the upload form itself — a shortcut to the page you are
 * already on is noise.
 *
 * Sits on the trailing edge, which is also where toasts appear, so the Toaster
 * carries a matching bottom offset to stack above it.
 */
export function NewListingFab() {
  const t = useTranslations("dashboard")
  const pathname = usePathname()
  const { data: viewer } = useViewer()

  if (viewer?.accountType !== "designer") return null
  if (pathname.startsWith("/dashboard/upload")) return null

  return (
    <Link
      href="/dashboard/upload"
      aria-label={t("newListing")}
      className="fixed bottom-6 end-6 z-40 inline-flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg outline-none transition-transform hover:scale-105 focus-visible:ring-3 focus-visible:ring-brand/50 motion-reduce:transition-none"
    >
      <Plus className="size-6" aria-hidden />
    </Link>
  )
}
