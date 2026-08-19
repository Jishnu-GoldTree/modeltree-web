"use client"

import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, useRouter } from "@/i18n/navigation"

/**
 * Back control for the model page. A model is reached from the catalog, a
 * category, a tag filter, favorites, a designer's storefront or a related
 * card, so there's no single parent to link to — history is where the visitor
 * actually came from.
 *
 * Rendered as a real link to the catalog so it works, and is crawlable, with
 * JavaScript off; when there's in-app history to return to, the click is
 * intercepted and turned into a `back()` instead.
 */
export function BackButton() {
  const t = useTranslations("product")
  const router = useRouter()

  return (
    <Link
      href="/3d-models"
      onClick={(e) => {
        if (window.history.length > 1) {
          e.preventDefault()
          router.back()
        }
      }}
      className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand/50"
    >
      <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
      {t("back")}
    </Link>
  )
}
