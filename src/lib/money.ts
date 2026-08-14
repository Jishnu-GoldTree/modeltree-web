import type { Locale } from "@/i18n/routing"

/**
 * Money formatting.
 *
 * Shekels are the stored, authoritative currency: Israel is the primary market
 * and the client prices in ₪. USD is a *display* conversion for everyone else
 * and is never stored, so there is exactly one price per model and no drift
 * between two columns that have to be kept in step.
 *
 * Amounts are integer minor units (agorot) end to end. Floating-point money is
 * how you end up charging ₪129.99999998.
 */

/**
 * Shekels per dollar.
 *
 * A constant, not a live rate: a rate that moves between the catalog page and
 * the cart would show two different prices for the same model in one session.
 * The ₪ figure is what is charged; the $ figure is guidance, which is why it is
 * rendered with an "approx" marker. Swap this for a daily-cached rate from a
 * provider when payments go in, and pin the rate onto the order at checkout so
 * a receipt always reproduces.
 */
export const ILS_PER_USD = 3.7

/** Minor units (agorot) → major units, rounded to the cent. */
function toMajor(minor: number) {
  return Math.round(minor) / 100
}

export type MoneyOptions = {
  /** Label used when the amount is zero. Pass the translated "Free". */
  freeLabel?: string
}

/**
 * The authoritative price, in the currency it is stored in.
 *
 * `he-IL` and `en-IL` both render ₪ with the symbol leading, which is what
 * Israeli sellers expect; Intl handles the RTL placement.
 */
export function formatILS(
  agorot: number,
  locale: Locale,
  { freeLabel }: MoneyOptions = {},
) {
  if (agorot === 0 && freeLabel) return freeLabel
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-IL", {
    style: "currency",
    currency: "ILS",
    // Whole shekels read better in a grid; agorot only appear when they exist.
    minimumFractionDigits: agorot % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(toMajor(agorot))
}

/** The secondary, indicative figure shown to buyers outside Israel. */
export function formatUSD(agorot: number, { freeLabel }: MoneyOptions = {}) {
  if (agorot === 0 && freeLabel) return freeLabel
  const dollars = toMajor(agorot) / ILS_PER_USD
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: dollars < 10 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(dollars)
}

/**
 * Both figures, for the price a buyer is deciding on.
 *
 * Hebrew readers see ₪ alone — they are paying in shekels and a dollar figure
 * is noise. English readers get ₪ with $ alongside, because the charge is in
 * shekels either way and showing only dollars would misstate what they pay.
 */
export function formatPrice(
  agorot: number,
  locale: Locale,
  options: MoneyOptions = {},
) {
  const primary = formatILS(agorot, locale, options)
  if (locale === "he" || agorot === 0) return { primary, secondary: null }
  return { primary, secondary: formatUSD(agorot, options) }
}
