"use client"

import { isIsraeliVisitor, useVisitorPrefs } from "@/lib/preferences"
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

  /**
   * Israel is the market, and the root is already Hebrew, so asking a visitor
   * there to pick a language is a dismissal in front of a site they can
   * read — imposed on the whole audience to serve the minority who cannot.
   * They keep the navbar switcher, and a stored English choice still wins:
   * LanguagePrompt honours it whether or not it is rendering anything.
   */
  const askingLanguage = locale === null && !isIsraeliVisitor()

  return (
    <>
      <LanguagePrompt asking={askingLanguage} />
      <CookieNotice visible={!askingLanguage && !cookieNoticeSeen} />
    </>
  )
}
