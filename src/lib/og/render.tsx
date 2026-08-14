import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

import { BrandFrame, ogSize } from "@/lib/og/brand-frame"
import { routing, type Locale } from "@/i18n/routing"

/**
 * Builds a share card for one locale.
 *
 * The font has to be embedded: satori has no access to system fonts, and
 * without Hebrew glyphs the Hebrew card renders a row of tofu boxes. Heebo is
 * the same family the site uses for Hebrew, and it covers Latin too, so one
 * file serves both cards.
 *
 * Read from disk, not fetched. `fetch(new URL("./x.ttf", import.meta.url))`
 * is a common recipe but throws "not implemented" in Node — file: URLs are not
 * fetchable. readFile from process.cwd() is what the Next docs prescribe, and
 * it is what the build traces into the deployed function.
 */
const FONT_DIR = join(process.cwd(), "assets")

const fonts = Promise.all([
  readFile(join(FONT_DIR, "Heebo-Regular.ttf")),
  readFile(join(FONT_DIR, "Heebo-Bold.ttf")),
])

export function toLocale(value: string): Locale {
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale
}

export async function renderShareCard(locale: Locale) {
  const [regular, bold] = await fonts

  return new ImageResponse(<BrandFrame locale={locale} />, {
    ...ogSize,
    fonts: [
      { name: "Heebo", data: regular, weight: 400, style: "normal" },
      { name: "Heebo", data: bold, weight: 700, style: "normal" },
    ],
  })
}
