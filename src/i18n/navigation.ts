import { createElement, type ComponentProps } from "react"
import { createNavigation } from "next-intl/navigation"

import { routing } from "@/i18n/routing"

/**
 * Locale-aware replacements for next/link and the router hooks. Import these
 * instead of the next/navigation originals so links keep the visitor's locale
 * instead of silently dropping them back to English.
 */
const navigation = createNavigation(routing)
export const { redirect, usePathname, useRouter, getPathname } = navigation

// Catalog menus and grids contain dozens of destinations. Fetch on navigation
// instead of making every visible link render another database-backed page.
export function Link(props: ComponentProps<typeof navigation.Link>) {
  return createElement(navigation.Link, { prefetch: false, ...props })
}
