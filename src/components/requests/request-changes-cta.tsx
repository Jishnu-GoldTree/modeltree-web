import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { getCurrentUser } from "@/lib/supabase/server"
import { CHAT_PATH, WHATSAPP_NUMBER } from "@/lib/whatsapp"
import { Button } from "@/components/ui/button"
import { WhatsAppIcon } from "@/components/whatsapp-icon"

/**
 * "Request changes to this model" on the public product page.
 *
 * Same gate as the modelling-team chat: a signed-out tap routes through sign-up
 * and returns to the terms page, and the wa.me number only ever renders behind
 * the account — never on this prerendered, public page. The slug rides along so
 * the eventual WhatsApp message names the exact piece.
 */
export async function RequestChangesButton({
  modelSlug,
  className,
}: {
  modelSlug: string
  className?: string
}) {
  if (!WHATSAPP_NUMBER) return null

  const t = await getTranslations("custom")
  const user = await getCurrentUser()
  const target = `${CHAT_PATH}?model=${encodeURIComponent(modelSlug)}`
  const href = user ? target : `/signup?next=${encodeURIComponent(target)}`

  return (
    <Button asChild variant="outline" className={className}>
      <Link href={href}>
        <WhatsAppIcon className="size-4" />
        {t("requestChangesCta")}
      </Link>
    </Button>
  )
}
