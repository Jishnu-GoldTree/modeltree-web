"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { isFlashKey } from "@/lib/flash"

/**
 * Reads `?flash=` and shows the matching toast, then strips the param so a
 * refresh or a shared link does not replay it.
 *
 * Mounted per page rather than in the layout: it needs useSearchParams, which
 * opts a route out of static rendering, and the pages that redirect with a
 * flash are dynamic already.
 */
export function FlashToast() {
  const t = useTranslations("toast")
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const shown = useRef<string | null>(null)

  const flash = params.get("flash")

  useEffect(() => {
    if (!isFlashKey(flash) || shown.current === flash) return
    shown.current = flash
    toast.success(t(flash))

    // Drop the param without adding a history entry.
    const next = new URLSearchParams(params)
    next.delete("flash")
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [flash, params, pathname, router, t])

  return null
}
