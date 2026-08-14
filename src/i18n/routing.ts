import { defineRouting } from "next-intl/routing"

/**
 * Hebrew is the default and lives at the root — `/3d-models`, not
 * `/he/3d-models`. English is prefixed: `/en/3d-models`.
 *
 * This was the other way round until the client described the audience: a
 * network of Israeli jewelers, many of whom are not comfortable enough in
 * English to use an English-only platform. The earlier English-default choice
 * was made for global buying-intent search volume, which is not the market this
 * is being built for. Both locales stay indexed and cross-linked with hreflang,
 * so the English catalog can still rank; it simply no longer owns the root.
 */
export const routing = defineRouting({
  locales: ["he", "en"],
  defaultLocale: "he",
  // Only non-default locales get a prefix.
  localePrefix: "as-needed",
  /**
   * No Accept-Language negotiation. It is on by default, and it quietly
   * defeated the point of this change: plenty of Israeli jewelers run an
   * English-language browser, so the header would have redirected exactly the
   * audience this is for to /en. The root is Hebrew for everyone; English is a
   * deliberate choice via the switcher, which persists in a cookie.
   */
  localeDetection: false,
})

export type Locale = (typeof routing.locales)[number]

/** Hebrew is the only RTL locale here; keep the mapping explicit. */
export const LOCALE_DIR: Record<Locale, "ltr" | "rtl"> = {
  he: "rtl",
  en: "ltr",
}

export const LOCALE_LABELS: Record<Locale, string> = {
  he: "עברית",
  en: "English",
}
