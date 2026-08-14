"use server"

import { revalidatePath } from "next/cache"
import { getLocale } from "next-intl/server"
import { z } from "zod"

import { redirect } from "@/i18n/navigation"
import { createClient, getCurrentUser } from "@/lib/supabase/server"
import { withFlash } from "@/lib/flash"

/**
 * Custom-work request mutations.
 *
 * Authorisation is RLS's job — `requests_insert_own` pins buyer_id to the
 * caller, and only a designer can move a thread's status. What these functions
 * own is the state machine: which transitions are legal, and keeping the quote
 * and the status from disagreeing.
 */

export type RequestState = { error?: string; fieldErrors?: Record<string, string> }

const openSchema = z.object({
  kind: z.enum(["adjustment", "commission"]),
  // Present for an adjustment, absent for a commission. The database enforces
  // the same rule; this produces a field error instead of a 500.
  modelId: z.uuid().optional(),
  title: z.string().trim().min(4, "Give the request a short title").max(120),
  brief: z
    .string()
    .trim()
    .min(10, "Describe what you need in at least 10 characters")
    .max(4000),
})

export async function openRequest(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const locale = await getLocale()
  const user = await getCurrentUser()
  if (!user) {
    redirect({ href: "/login?next=/requests", locale })
    return {}
  }

  const parsed = openSchema.safeParse({
    kind: formData.get("kind"),
    modelId: formData.get("modelId") || undefined,
    title: formData.get("title"),
    brief: formData.get("brief"),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      fieldErrors[key] ??= issue.message
    }
    return { fieldErrors }
  }

  const v = parsed.data
  if (v.kind === "adjustment" && !v.modelId) {
    return { fieldErrors: { modelId: "Pick the model you want adjusted" } }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("requests")
    .insert({
      buyer_id: user.id,
      kind: v.kind,
      // A commission has no model by definition; sending one would trip the
      // requests_model_matches_kind constraint.
      model_id: v.kind === "adjustment" ? v.modelId : null,
      title: v.title,
      brief: v.brief,
    })
    .select("id")
    .single()

  if (error || !data) {
    return { error: "Could not open the request. Try again." }
  }

  revalidatePath("/requests")
  redirect({ href: withFlash(`/requests/${data.id}`, "requestOpened"), locale })
  return {}
}

const quoteSchema = z.object({
  requestId: z.uuid(),
  // Shekels in the form, agorot in the database — same convention as listings.
  amount: z.coerce.number().min(0).max(100_000),
})

/** Designer-side: put a price on a request. */
export async function quoteRequest(_prev: RequestState, formData: FormData): Promise<RequestState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in first." }

  const parsed = quoteSchema.safeParse({
    requestId: formData.get("requestId"),
    amount: formData.get("amount"),
  })
  if (!parsed.success) return { fieldErrors: { amount: "Enter a price" } }

  const supabase = await createClient()
  const { error } = await supabase
    .from("requests")
    .update({
      quote_agorot: Math.round(parsed.data.amount * 100),
      quoted_at: new Date().toISOString(),
      status: "quoted",
      // Quoting is also how a modeler picks the job up.
      assignee_id: user.id,
    })
    .eq("id", parsed.data.requestId)

  if (error) return { error: "Could not save the quote." }

  revalidatePath(`/requests/${parsed.data.requestId}`)
  return {}
}

/** Buyer-side: take the quote. */
export async function acceptQuote(_prev: RequestState, formData: FormData): Promise<RequestState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in first." }

  const requestId = z.uuid().safeParse(formData.get("requestId"))
  if (!requestId.success) return { error: "Unknown request." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("requests")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", requestId.data)
    // Only from 'quoted': accepting an unpriced request would leave the row
    // violating requests_quote_present, and accepting twice is meaningless.
    .eq("status", "quoted")

  if (error) return { error: "Could not accept the quote." }

  revalidatePath(`/requests/${requestId.data}`)
  return {}
}
