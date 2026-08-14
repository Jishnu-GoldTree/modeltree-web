"use client"

import { useVisitorPrefs } from "@/lib/preferences"
import { CookieNotice } from "@/components/layout/cookie-notice"
import { LanguagePrompt } from "@/components/layout/language-prompt"

/**
 * Sequences the two first-visit prompts.
 *
 * They occupy the same corner and would otherwise stack on a first visit,
 * which reads as a wall of dismissals. Language comes first because it decides
 * whether the visitor can read the cookie notice at all.
 */
export function VisitorPrompts() {
  const { ready, locale, cookieNoticeSeen } = useVisitorPrefs()
  if (!ready) return null

  const askingLanguage = locale === null

  return (
    <>
      <LanguagePrompt asking={askingLanguage} />
      <CookieNotice visible={!askingLanguage && !cookieNoticeSeen} />
    </>
  )
}
