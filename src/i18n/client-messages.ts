import type { AbstractIntlMessages } from "next-intl"

/**
 * The message namespaces components read through the `useTranslations` hook,
 * which is what can run in the browser. Server code reads the full catalog via
 * `getTranslations` and never needs it shipped.
 *
 * Without this list NextIntlClientProvider serialises both full catalogs —
 * legal pages, about copy, every landing string — into every page's HTML,
 * twice over in practice (the RSC payload too). Picking roughly halves it.
 *
 * When a client component starts using a new namespace, add it here; a missing
 * one fails loudly in development with MISSING_MESSAGE. Paths may be nested
 * ("home.announce") to send only part of a namespace.
 */
export const CLIENT_NAMESPACES = [
  "auth",
  "bulkUpload",
  "catalog",
  "checkout",
  "common",
  "cookies",
  "custom",
  "dashboard",
  "facet",
  "home.announce",
  "landing.navChildren",
  "languagePrompt",
  "listing",
  "locale",
  "membership",
  "nav",
  "profileForm",
  "requests",
  "review",
  "toast",
  "upload",
  "whyChoose",
] as const

export function pickClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {}
  for (const path of CLIENT_NAMESPACES) {
    const parts = path.split(".")
    let source: unknown = messages
    for (const part of parts) source = (source as Record<string, unknown> | undefined)?.[part]
    if (source === undefined) continue

    let target = picked
    for (const part of parts.slice(0, -1)) {
      target[part] ??= {}
      target = target[part] as AbstractIntlMessages
    }
    target[parts[parts.length - 1]] = source as AbstractIntlMessages
  }
  return picked
}
