"use client"

import { usePathname } from "@/i18n/navigation"
import { isIsraeliVisitor, useVisitorPrefs } from "@/lib/preferences"
import { CookieNotice } from "@/components/layout/cookie-notice"
import { LanguagePrompt } from "@/components/layout/language-prompt"
import { WhyChooseModal } from "@/components/layout/why-choose-modal"

/**
 * Sequences the first-visit prompts.
 *
 * The language prompt and cookie notice occupy the same corner and would
 * otherwise stack on a first visit, which reads as a wall of dismissals.
 * Language comes first because it decides whether the visitor can read the
 * cookie notice at all. The "Why choose us?" promo is a centred modal shown
 * last — homepage only, and only once the cookie notice is out of the way —
 * so a new visitor never faces a modal on top of a banner.
 */
export function VisitorPrompts() {
  const { ready, locale, cookieNoticeSeen, whyChooseSeen } = useVisitorPrefs()
  const pathname = usePathname()
  if (!ready) return null

  /**
   * Israel is the market, and the root is already Hebrew, so asking a visitor
   * there to pick a language is a dismissal in front of a site they can
   * read — imposed on the whole audience to serve the minority who cannot.
   * They keep the navbar switcher, and a stored English choice still wins:
   * LanguagePrompt honours it whether or not it is rendering anything.
   */
  const askingLanguage = locale === null && !isIsraeliVisitor()

  // Homepage only: the promo pitches the site to newcomers, and firing it on a
  // deep link (a shared product page) would talk over what they came for.
  const showWhyChoose =
    pathname === "/" && !askingLanguage && cookieNoticeSeen && !whyChooseSeen

  return (
    <>
      <LanguagePrompt asking={askingLanguage} />
      <CookieNotice visible={!askingLanguage && !cookieNoticeSeen} />
      <WhyChooseModal open={showWhyChoose} />
    </>
  )
}
