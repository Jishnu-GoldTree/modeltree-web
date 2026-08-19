import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { getCurrentUser } from "@/lib/supabase/server"
import { CHAT_PATH, WHATSAPP_NUMBER } from "@/lib/whatsapp"
import { Button } from "@/components/ui/button"
import { WhatsAppIcon } from "@/components/whatsapp-icon"

/**
 * Public entry point to the modelling-team chat.
 *
 * A signed-out visitor sees the same button with the same label — hiding it
 * would hide the service from the people it is meant to sell — but it routes
 * through sign-up and returns to the terms page afterwards. The number itself
 * never reaches anonymous traffic: only the page behind the account renders a
 * wa.me link.
 */
export async function ChatWithDesignersButton({ className }: { className?: string }) {
  if (!WHATSAPP_NUMBER) return null

  const t = await getTranslations("custom")
  const user = await getCurrentUser()
  const href = user ? CHAT_PATH : `/signup?next=${encodeURIComponent(CHAT_PATH)}`

  return (
    <Button asChild className={className}>
      <Link href={href}>
        <WhatsAppIcon className="size-5" />
        {t("chatCta")}
      </Link>
    </Button>
  )
}
