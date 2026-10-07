"use client"

import { useLocale, useTranslations } from "next-intl"

import { Link, usePathname } from "@/i18n/navigation"
import { LOCALE_DIR, type Locale } from "@/i18n/routing"
import { useViewer } from "@/lib/queries/viewer"
import { useHasHydrated } from "@/lib/use-has-hydrated"
import { cn } from "@/lib/utils"
import { CHAT_PATH, WHATSAPP_NUMBER } from "@/lib/whatsapp"
import { WhatsAppIcon } from "@/components/whatsapp-icon"

/**
 * Floating "talk to the modelling team" button, shown to everyone.
 *
 * Custom modelling is the service the client most wants buyers to reach, and on
 * WhatsApp — where Israeli jewelers already are — so it rides one tap away on
 * every page, signed in or not. The number never travels with it: a signed-in
 * tap goes to the terms/handoff page (the only place the wa.me link renders),
 * and everyone else is sent to sign-up first, returning to that page after.
 *
 * Gating on `hydrated && viewer` keeps the first render identical to the server
 * (the session is unknown there): without it, the viewer query resolving during
 * hydration would swap the href and mismatch. Until the session is known the
 * link points at sign-up, which is also the right default for public traffic.
 *
 * Pinned to the physical bottom-right (right-6, not a logical edge) so it lands
 * in the same corner in both directions. In the Hebrew-first RTL default that
 * corner is clear: the "new listing" FAB and the toasts live on the logical end,
 * which resolves to the physical left. Only in LTR does the seller's FAB resolve
 * to this same right corner, so there — and only there — we lift above it.
 *
 * At rest a size-14 circle; on hover it grows into a pill, the label sliding out
 * as its max-width and opacity animate (the circle stays a circle because the
 * label starts at zero width). Hidden where it would only point at the page you
 * are already on — the custom-work pages carry the same entry point inline — and
 * on the auth screens, which are deliberately stripped of exits.
 */
export function WhatsAppFab() {
  const t = useTranslations("custom")
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const hydrated = useHasHydrated()
  const { data: viewer } = useViewer()

  if (!WHATSAPP_NUMBER) return null
  if (
    pathname.startsWith("/custom-work") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return null
  }

  const href =
    hydrated && viewer
      ? CHAT_PATH
      : `/signup?next=${encodeURIComponent(CHAT_PATH)}`

  // Both flags gate on `hydrated` so the first client render matches the server
  // (viewer unknown there): the seller FAB it clears also only appears once the
  // viewer resolves, so they lift and land together.
  const clearsListingFab =
    hydrated &&
    viewer?.accountType === "designer" &&
    LOCALE_DIR[locale] === "ltr"

  return (
    <Link
      href={href}
      aria-label={t("fabLabel")}
      title={t("fabLabel")}
      className={cn(
        "group fixed right-6 z-40 flex h-14 items-center overflow-hidden rounded-full border border-black/5 bg-white shadow-lg outline-none focus-visible:ring-3 focus-visible:ring-brand/50",
        clearsListingFab ? "bottom-24" : "bottom-6",
      )}
    >
      <span className="flex size-14 shrink-0 items-center justify-center">
        <WhatsAppIcon className="size-7" />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-300 ease-out group-hover:max-w-xs group-hover:pe-5 group-hover:opacity-100 motion-reduce:transition-none">
        {t("fabCta")}
      </span>
    </Link>
  )
}
