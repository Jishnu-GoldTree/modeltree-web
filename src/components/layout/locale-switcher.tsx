"use client"

import { useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { ChevronDown } from "lucide-react"

import { usePathname, useRouter } from "@/i18n/navigation"
import { LOCALE_LABELS, routing, type Locale } from "@/i18n/routing"
import { writeLocalePreference } from "@/lib/preferences"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LocaleFlag } from "@/components/layout/locale-flag"

/**
 * Switches locale while staying on the current page.
 *
 * Uses next-intl's pathname/router rather than next/navigation: those return
 * the route without the locale segment, so pushing the same path under a new
 * locale lands on the translated equivalent instead of the home page. `params`
 * is passed through so dynamic routes (/3d-model/[slug]) keep their segment.
 */
export function LocaleSwitcher() {
  const locale = useLocale() as Locale
  const t = useTranslations("locale")
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const currentLabel = LOCALE_LABELS[locale]

  function select(next: Locale) {
    if (next === locale) return
    // Persist the deliberate choice. Without this the switcher only moves the
    // URL, leaving the stored preference stale — so switching to Hebrew from an
    // /en page triggered LanguagePrompt's "honour the stored language" effect,
    // which read the old "en" and bounced straight back to English.
    writeLocalePreference(next)
    startTransition(() => {
      router.replace(
        // @ts-expect-error — pathname is a known route, but params are only
        // typed per-route; next-intl documents this cast for a generic switcher.
        { pathname, params },
        { locale: next },
      )
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${t("label")}: ${currentLabel}`}
          title={`${t("label")}: ${currentLabel}`}
          disabled={pending}
          className="h-10 gap-1.5 px-2 sm:h-8"
        >
          <LocaleFlag locale={locale} />
          {/* Latin code in both locales ("HE", not "עב"): it's a label for the
              control, read the same way whichever language the page is in. */}
          <span className="text-xs font-semibold tracking-wide uppercase">{locale}</span>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {routing.locales.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => select(code)}
            aria-current={code === locale ? "true" : undefined}
            className={code === locale ? "gap-2.5 font-medium text-brand-accent" : "gap-2.5"}
          >
            <LocaleFlag locale={code} />
            <span className="flex-1">{LOCALE_LABELS[code]}</span>
            <span className="text-xs text-muted-foreground uppercase">{code}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
