import { defineRouting } from "next-intl/routing"

/**
 * English is the default and lives at the root — `/3d-models`, not
 * `/en/3d-models`. Hebrew is prefixed: `/he/3d-models`.
 *
 * The root carries the most inbound links and domain authority, and essentially
 * all buying-intent search volume for 3D assets is in English. Hebrew visitors
 * still get a fully RTL experience, one path segment down.
 */
export const routing = defineRouting({
  locales: ["en", "he"],
  defaultLocale: "en",
  // Only non-default locales get a prefix.
  localePrefix: "as-needed",
})

export type Locale = (typeof routing.locales)[number]

/** Hebrew is the only RTL locale here; keep the mapping explicit. */
export const LOCALE_DIR: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  he: "rtl",
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  he: "עברית",
}
