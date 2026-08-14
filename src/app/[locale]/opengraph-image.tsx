import { ogAlt, ogContentType, ogSize } from "@/lib/og/brand-frame"
import { renderShareCard, toLocale } from "@/lib/og/render"
import { routing } from "@/i18n/routing"

export const size = ogSize
export const contentType = ogContentType

/** One card per locale, prerendered alongside the pages. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return [{ id: "default", size: ogSize, contentType: ogContentType, alt: ogAlt(toLocale(locale)) }]
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return renderShareCard(toLocale(locale))
}
