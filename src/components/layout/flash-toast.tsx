"use client"

import { Suspense, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { affectsCounts, isFlashKey } from "@/lib/flash"
import { viewerKey } from "@/lib/queries/viewer"
import { countsKey } from "@/lib/queries/counts"

/**
 * Reads `?flash=` and shows the matching toast, then strips the param so a
 * refresh or a shared link does not replay it.
 */
function FlashToastReader() {
  const t = useTranslations("toast")
  const params = useSearchParams()
  const queryClient = useQueryClient()
  const shown = useRef<string | null>(null)

  const flash = params.get("flash")

  useEffect(() => {
    if (!isFlashKey(flash) || shown.current === flash) return
    shown.current = flash
    toast.success(t(flash))

    // A cart/favourite action just changed a count the header shows. This is the
    // signal that lets useCounts poll at the normal staleTime instead of
    // refetching on every navigation — invalidate so the badge updates now.
    if (affectsCounts(flash)) {
      queryClient.invalidateQueries({ queryKey: countsKey })
    }

    if (flash === "profileSaved") {
      void queryClient.invalidateQueries({ queryKey: viewerKey })
    }

    // Removing a toast marker needs no new server render or database reads.
    const next = new URL(window.location.href)
    next.searchParams.delete("flash")
    window.history.replaceState(null, "", next.pathname + next.search + next.hash)
  }, [flash, t, queryClient])

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
