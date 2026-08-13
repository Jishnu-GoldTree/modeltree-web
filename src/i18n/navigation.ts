import { createNavigation } from "next-intl/navigation"

import { routing } from "@/i18n/routing"

/**
 * Locale-aware replacements for next/link and the router hooks. Import these
 * instead of the next/navigation originals so links keep the visitor's locale
 * instead of silently dropping them back to English.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
