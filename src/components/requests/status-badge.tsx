import { getTranslations } from "next-intl/server"

import { cn } from "@/lib/utils"
import type { RequestStatus } from "@/lib/data/requests"

/**
 * Status as colour and word, not colour alone — the six states drive what each
 * side can do next, so they have to be legible without relying on hue.
 */
const STYLE: Record<RequestStatus, string> = {
  open: "bg-muted text-muted-foreground",
  quoted: "bg-brand-muted text-brand-accent",
  accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  delivered: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  closed: "bg-muted text-muted-foreground",
  declined: "bg-destructive/10 text-destructive",
}

const KEY: Record<RequestStatus, string> = {
  open: "statusOpen",
  quoted: "statusQuoted",
  accepted: "statusAccepted",
  delivered: "statusDelivered",
  closed: "statusClosed",
  declined: "statusDeclined",
}

export async function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const t = await getTranslations("requests")
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-md px-2.5 py-0.5 text-xs font-medium",
        STYLE[status],
      )}
    >
      {t(KEY[status])}
    </span>
  )
}
