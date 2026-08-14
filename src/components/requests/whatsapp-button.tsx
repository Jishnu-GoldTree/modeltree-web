import { MessageCircle } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { whatsappHandoffUrl, type HandoffContext } from "@/lib/whatsapp"
import { Button } from "@/components/ui/button"

/**
 * Opens the conversation on WhatsApp with the request already described.
 *
 * Renders nothing when no number is configured — a link to `wa.me/` with no
 * recipient is worse than no button, because it looks like the feature is
 * broken rather than unconfigured.
 */
export async function WhatsAppButton({
  context,
  variant = "solid",
}: {
  context: HandoffContext
  variant?: "solid" | "outline"
}) {
  const t = await getTranslations("requests")
  const url = whatsappHandoffUrl(context, t("waGreeting"))
  if (!url) return null

  return (
    <Button
      asChild
      variant={variant === "solid" ? "default" : "outline"}
      className={
        variant === "solid"
          ? "h-10 w-full bg-brand text-brand-foreground hover:bg-brand/85"
          : "h-10 w-full"
      }
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="size-4" aria-hidden />
        {t("waOpen")}
      </a>
    </Button>
  )
}
