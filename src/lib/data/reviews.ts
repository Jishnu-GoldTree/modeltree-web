import "server-only"

import { createClient, getCurrentUser } from "@/lib/supabase/server"

/**
 * What the signed-in visitor may do with reviews on a given model.
 *
 * Read through the cookie-bound client, not the public one: both queries are
 * about this viewer, and RLS already scopes orders and order_items to the buyer
 * who paid. Null means nobody is signed in, which the page renders as no form
 * at all rather than as an empty one.
 */
export type ViewerReview = {
  /** A paid order containing this model — the condition reviews_insert_purchased checks. */
  purchased: boolean
  /** Their review, when they have already left one. One per model, per author. */
  existing: { rating: number; body: string } | null
}

export async function getViewerReview(modelId: string): Promise<ViewerReview | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  const [purchase, review] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, orders!inner ( status, buyer_id )")
      .eq("model_id", modelId)
      .eq("orders.buyer_id", user.id)
      .eq("orders.status", "paid")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select("rating, body")
      .eq("model_id", modelId)
      .eq("author_id", user.id)
      .maybeSingle(),
  ])

  return {
    purchased: Boolean(purchase.data),
    existing: review.data
      ? { rating: review.data.rating as number, body: (review.data.body as string | null) ?? "" }
      : null,
  }
}
