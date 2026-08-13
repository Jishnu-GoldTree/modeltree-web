"use client"

import { Suspense, useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { isFlashKey } from "@/lib/flash"

/**
 * Reads `?flash=` and shows the matching toast, then strips the param so a
 * refresh or a shared link does not replay it.
 */
function FlashToastReader() {
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

/**
 * Mounted once in the locale layout so every route is covered.
 *
 * It used to be mounted page by page, on the theory that `useSearchParams`
 * would opt a route out of static rendering. The Suspense boundary is what
 * makes the layout mount safe: on a prerendered route only the tree below the
 * boundary is client-rendered, and this component renders nothing, so the 192
 * prerendered model pages stay prerendered.
 *
 * Per-page mounting also quietly lost toasts. `toggleFavorite` redirects back
 * to wherever the heart was clicked and sign-out redirects home — neither the
 * landing page nor the model pages had a reader, so those actions left a
 * `?flash=` in the URL and showed nothing.
 */
export function FlashToast() {
  return (
    <Suspense fallback={null}>
      <FlashToastReader />
    </Suspense>
  )
}
