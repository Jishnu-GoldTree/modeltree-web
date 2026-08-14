"use client"

import { useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Languages } from "lucide-react"

import { usePathname, useRouter } from "@/i18n/navigation"
import { LOCALE_LABELS, routing, type Locale } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
          size="icon"
          aria-label={`${t("label")}: ${currentLabel}`}
          title={`${t("label")}: ${currentLabel}`}
          disabled={pending}
          className="text-white/85 hover:bg-white/10 hover:text-white"
        >
          <Languages className="size-5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {routing.locales.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => select(code)}
            aria-current={code === locale ? "true" : undefined}
            className={code === locale ? "font-medium text-brand-accent" : ""}
          >
            {LOCALE_LABELS[code]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
