import { supabasePublic } from "@/lib/supabase/public"

/**
 * The membership, as the client specified it: ₪55 a month for two models.
 *
 * One constant, in agorot, so the figure on the pricing page, the product page
 * and the landing banner cannot drift apart. Nothing else about the plan is
 * priced here — adjustments and custom work are quoted per job, and inventing
 * numbers for them is exactly the mistake this project has already had to undo.
 */
export const MEMBERSHIP = {
  priceAgorot: 55_00,
  modelsPerMonth: 2,
} as const

/**
 * What two typical models actually cost, so the "membership pays for itself"
 * claim is checkable rather than asserted.
 *
 * The median, not the mean: a ₪1,250 rivière necklace would drag an average
 * upwards and overstate the saving. If the catalog is ever priced such that two
 * median models cost less than the membership, this returns that lower number
 * and the comparison quietly stops flattering us — which is the point.
 */
export async function getTypicalTwoModelCost(): Promise<number | null> {
  const { data } = await supabasePublic
    .from("models")
    .select("price_cents")
    .eq("status", "published")
    .gt("price_cents", 0)
    .order("price_cents", { ascending: true })

  const prices = (data ?? []).map((r) => r.price_cents as number)
  if (prices.length === 0) return null

  const median = prices[Math.floor(prices.length / 2)]
  return median * MEMBERSHIP.modelsPerMonth
}
