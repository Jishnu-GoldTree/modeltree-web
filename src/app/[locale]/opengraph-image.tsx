import { ogAlt, ogContentType, ogSize } from "@/lib/og/brand-frame"
import { renderShareCard, toLocale } from "@/lib/og/render"

export const size = ogSize
export const contentType = ogContentType

// The parent layout supplies locales; Next.js derives image params from this metadata.
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
