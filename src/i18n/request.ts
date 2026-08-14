import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"

import { routing, type Locale } from "@/i18n/routing"
import en from "../../messages/en.json"
import he from "../../messages/he.json"

/**
 * Catalogs are imported statically, not with `import(\`…/${locale}.json\`)`.
 *
 * The dynamic form is next-intl's documented pattern and splits each locale
 * into its own chunk, but the path is computed at runtime, so the JSON never
 * enters the module graph the dev server watches. Editing a message file left
 * the running server holding the previous copy and rendering raw key paths
 * ("landing.heroFilters.engagement") until someone restarted it — and it hit
 * one locale at a time, which made it look like missing translations rather
 * than a stale cache.
 *
 * Static imports cost the server bundle both catalogs instead of one. At two
 * locales that is a few hundred KB server-side and nothing on the client,
 * which is a fair price for edits that show up when you save.
 */
const MESSAGES = { en, he } satisfies Record<Locale, unknown>

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return { locale, messages: MESSAGES[locale] }
})
