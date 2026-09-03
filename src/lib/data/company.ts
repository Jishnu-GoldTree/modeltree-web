/**
 * Single source of truth for the business/legal identity of the site.
 *
 * Payment-processor compliance reviews expect the operating company's legal
 * name, contact channels and registration details to be shown consistently
 * across the footer, the About/Contact pages and the legal documents. Keeping
 * them here means the client fills each value once and every surface stays in
 * sync — no copy drifts out of date because it was typed into a page by hand.
 *
 * Values marked TODO are the ones only the client can supply (company
 * registration number, registered address). They are intentionally
 * empty rather than invented: the pages read `COMPANY.*` and simply omit any
 * block whose value is blank, so filling them in here makes them appear with
 * no further code change.
 */
export const COMPANY = {
  /** Brand shown in the UI. */
  brand: "MODELTREE",
  /** Registered legal entity that operates the marketplace and takes payment. */
  legalName: "GoldTree",
  /** ISO-ish country of establishment, shown in the business-info block. */
  country: "Israel",

  /** Public-facing email addresses. */
  email: {
    support: "support@goldtree.co.il",
    legal: "legal@goldtree.co.il",
    privacy: "privacy@goldtree.co.il",
  },

  /** Primary domain, without protocol. */
  domain: "goldtree.co.il",

  /**
   * Client-supplied registration details. Fill these in to have them rendered.
   * Leaving a field empty hides the corresponding line — nothing shows a blank.
   */
  registrationNumber: "", // TODO(client): company / VAT registration number
  address: "", // TODO(client): registered business address
} as const

/** `mailto:` helper so pages don't rebuild the string. */
export function mailto(address: string) {
  return `mailto:${address}`
}
