"use client"

import { useLocale } from "next-intl"
import { Toaster as Sonner } from "sonner"

import { LOCALE_DIR, type Locale } from "@/i18n/routing"

/**
 * Toast host.
 *
 * Anchored to the trailing edge so it follows the writing direction — bottom
 * right in English, bottom left in Hebrew. A fixed "bottom-right" would sit
 * over the RTL layout's primary actions.
 */
export function Toaster() {
  const locale = useLocale() as Locale
  const dir = LOCALE_DIR[locale]

  return (
    <Sonner
      dir={dir}
      position={dir === "rtl" ? "bottom-left" : "bottom-right"}
      // Inherit the app's tokens rather than sonner's own palette, so toasts
      // match in both themes without a second colour system.
      toastOptions={{
        classNames: {
          toast:
            "group rounded-lg border bg-popover text-popover-foreground shadow-lg",
          description: "text-muted-foreground",
          actionButton: "bg-brand text-brand-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          error: "border-destructive/30",
        },
      }}
    />
  )
}
