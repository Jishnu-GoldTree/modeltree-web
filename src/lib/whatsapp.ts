/**
 * WhatsApp handoff.
 *
 * The conversation for a custom-work request happens on WhatsApp rather than in
 * an inbox we built: Israeli jewelers already live there, and GoldTree's four
 * modelers can answer from a phone they already carry. What stays in our
 * database is the part that becomes an order — the request, the brief, the
 * quote and the status.
 *
 * The link carries the request reference so a message arriving on a phone can
 * be matched back to a row without anyone asking "which ring?".
 */

/** Digits only, no `+` — wa.me rejects punctuation. */
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""

export type HandoffContext = {
  /** Short, human-quotable reference — the uuid is not something to read out. */
  reference: string
  title: string
  modelTitle?: string | null
}

/**
 * Builds a click-to-chat URL with the request already described.
 *
 * Returns null when no number is configured, so the caller renders nothing
 * rather than a link to `wa.me/` that opens WhatsApp with no recipient.
 */
export function whatsappHandoffUrl(context: HandoffContext, greeting: string) {
  if (!WHATSAPP_NUMBER) return null

  const lines = [
    greeting,
    "",
    `#${context.reference} — ${context.title}`,
    context.modelTitle ? `Model: ${context.modelTitle}` : null,
  ].filter(Boolean)

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`
}

/** First eight characters of the uuid, which is short enough to read aloud. */
export function requestReference(id: string) {
  return id.slice(0, 8).toUpperCase()
}
