"use client"

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

export type Viewer = {
  id: string
  accountType: "buyer" | "designer"
  name: string | null
  email: string | null
} | null

export const viewerKey = ["viewer"] as const

/**
 * Who is signed in, and whether they sell.
 *
 * `account_type` is read from the profiles row rather than from
 * `user.user_metadata`, which only carries what was chosen at signup: changing
 * it later in profile settings writes the profiles row and leaves the metadata
 * stale, so a designer who switched over would never see seller UI.
 *
 * Shared through the query cache, so several components asking cost one round
 * trip.
 *
 * The auth subscription is not optional. Consumers live in the layout, so the
 * first fetch happens on whatever page loaded first — often /login, where
 * there is no session. Without invalidating on sign-in, that cached `null`
 * would be served for the whole staleTime and seller UI would stay hidden
 * until it expired. It also keeps things right when a session starts or ends
 * in another tab.
 */
export function useViewer() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()
    const { data } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: viewerKey })
    })
    return () => data.subscription.unsubscribe()
  }, [queryClient])

  return useQuery<Viewer>({
    queryKey: viewerKey,
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (!data.user) return null

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", data.user.id)
        .maybeSingle()

      return {
        id: data.user.id,
        accountType: (profile?.account_type as "buyer" | "designer") ?? "buyer",
        name: (data.user.user_metadata?.full_name as string | undefined) ?? null,
        email: data.user.email ?? null,
      }
    },
    staleTime: 60_000,
  })
}
