"use client"

import { useEffect, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Languages } from "lucide-react"

import { usePathname, useRouter } from "@/i18n/navigation"
import { LOCALE_LABELS, routing, type Locale } from "@/i18n/routing"
import { readLocalePreference, writeLocalePreference } from "@/lib/preferences"
import { Button } from "@/components/ui/button"

/**
 * First-visit language choice.
 *
 * The root is Hebrew for everyone — Accept-Language detection is deliberately
 * off, because plenty of Israeli jewelers run an English-language browser and
 * would have been sent to the English site by a header that says nothing about
 * what they can read. That leaves one gap: a genuinely English-speaking
 * visitor lands on a site they cannot read. Asking once closes it without
 * handing the decision back to a browser setting.
 *
 * Once answered the choice is honoured on later visits: arriving at the root
 * with English stored moves you to /en. That is not the negotiation this
 * replaced — it acts on something the visitor said, not on a header.
 */
export function LanguagePrompt({ asking }: { asking: boolean }) {
  const locale = useLocale() as Locale
  const t = useTranslations("languagePrompt")
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const [, startTransition] = useTransition()

  useEffect(() => {
    // Only redirect FROM the default-locale root — that is the one case where
    // routing dropped the visitor into a language they may not read. If they
    // are already on an explicit /en URL (typically because they just used the
    // navbar switcher) respect that, even when the stored choice disagrees;
    // otherwise this effect fights every navbar switch back to the popup
    // answer.
    if (locale !== routing.defaultLocale) return
    const stored = readLocalePreference()
    if (stored && stored !== locale) {
      startTransition(() => {
        // @ts-expect-error — see LocaleSwitcher: params are typed per route.
        router.replace({ pathname, params }, { locale: stored })
      })
    }
  }, [locale, params, pathname, router])

  function choose(next: Locale) {
    // Writing notifies the preference store, which is what hides this.
    writeLocalePreference(next)
    if (next === locale) return
    startTransition(() => {
      // @ts-expect-error — see LocaleSwitcher: params are typed per route.
      router.replace({ pathname, params }, { locale: next })
    })
  }

  if (!asking) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("title")}
      // Anchored rather than modal: it is a preference, not a gate, and a
      // blocking overlay on first paint is the fastest way to lose a visitor.
      className="fixed inset-x-4 bottom-4 z-70 mx-auto max-w-md rounded-2xl border bg-popover p-5 shadow-lg sm:inset-x-auto sm:end-6 sm:bottom-6"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand-accent">
          <Languages className="size-4" aria-hidden />
        </span>
        <div>
          <p className="font-medium">{t("title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("body")}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {routing.locales.map((code) => (
          <Button
            key={code}
            onClick={() => choose(code)}
            variant={code === locale ? "default" : "outline"}
            className={
              code === locale
                ? "h-10 flex-1 bg-brand text-brand-foreground hover:bg-brand/85"
                : "h-10 flex-1"
            }
          >
            {LOCALE_LABELS[code]}
          </Button>
        ))}
      </div>
    </div>
  )
}
