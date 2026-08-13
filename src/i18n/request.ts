import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"

import { routing } from "@/i18n/routing"

/**
 * Resolves the active locale per request and loads its messages.
 * An unknown or missing locale falls back to the default rather than throwing.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
