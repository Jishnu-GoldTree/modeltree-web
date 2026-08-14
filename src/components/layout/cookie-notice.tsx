"use client"

import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { acknowledgeCookieNotice } from "@/lib/preferences"
import { Button } from "@/components/ui/button"

/**
 * Cookie notice.
 *
 * A notice, not a consent gate, because that is what is honest here: the only
 * cookies set are the Supabase session, the cart, saved models and the locale
 * choice. All are needed for the thing the visitor asked for, so there is
 * nothing to opt out of and a Reject button would be theatre.
 *
 * The moment analytics or ad pixels are added this has to become real consent
 * — non-essential cookies must not be set before an explicit opt-in — and the
 * copy below stops being true.
 */
export function CookieNotice({ visible }: { visible: boolean }) {
  const t = useTranslations("cookies")
  if (!visible) return null

  return (
    <div
      role="region"
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-60 border-t bg-popover/95 backdrop-blur"
    >
      <div className="shell flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("body")}{" "}
          <Link href="/cookies" className="text-brand-accent hover:underline">
            {t("learnMore")}
          </Link>
        </p>
        <Button
          onClick={acknowledgeCookieNotice}
          className="h-9 shrink-0 bg-brand px-5 text-brand-foreground hover:bg-brand/85"
        >
          {t("accept")}
        </Button>
      </div>
    </div>
  )
}
