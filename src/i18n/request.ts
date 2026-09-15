import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { locale as localeRootParam } from "next/root-params"

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

/**
 * The locale for the current route, without making the route dynamic.
 *
 * This is why nothing on this site used to prerender. next-intl resolves the
 * locale from `requestLocale`, which reads the `x-next-intl-locale` header the
 * proxy sets — and `headers()` opts the route into dynamic rendering. One
 * translated string anywhere in the tree (the skip link, the footer) therefore
 * forced every page to be server-rendered per request.
 *
 * `next/root-params` reads `[locale]` straight off the route instead. It is
 * known statically during prerendering, so it costs no dynamic access at all.
 *
 * Two details matter:
 *
 * `requestLocale` is a lazy getter on next-intl's params object, so it must not
 * be destructured in the signature below — destructuring invokes the getter and
 * calls `headers()` before this function has decided whether it needs to. That
 * alone made the root-params path pointless on the first attempt at this.
 *
 * Root params resolve to `undefined` outside the `[locale]` tree and throw in
 * Server Actions, Route Handlers and `unstable_cache`. All of those are dynamic
 * by nature and have a header to read, so they fall back to `requestLocale` —
 * which is what they were always using.
 */
async function readLocale(requestLocale: () => Promise<string | undefined>) {
  try {
    const fromRoute = await localeRootParam()
    if (fromRoute) return fromRoute
  } catch {
    // Not a context root params can serve; the header path below can.
  }
  return await requestLocale()
}

export default getRequestConfig(async (params) => {
  const requested =
    params.locale ?? (await readLocale(() => params.requestLocale))
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return { locale, messages: MESSAGES[locale] }
})
