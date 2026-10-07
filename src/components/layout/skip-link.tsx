import { getTranslations } from "next-intl/server"

/**
 * The first focusable element on every page — Tab from a fresh load lands here,
 * letting keyboard and screen-reader users jump past the header nav straight
 * to the page's main content. Hidden visually until it receives focus.
 */
export async function SkipLink() {
  const t = await getTranslations("nav")
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
    >
      {t("skipToContent")}
    </a>
  )
}
