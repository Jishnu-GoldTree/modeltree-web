"use server"

import { revalidatePath } from "next/cache"
import { getLocale } from "next-intl/server"
import { z } from "zod"

import { redirect } from "@/i18n/navigation"
import { withFlash } from "@/lib/flash"
import { getModel } from "@/lib/data/catalog"
import { createClient, getCurrentUser } from "@/lib/supabase/server"

/**
 * Review writes.
 *
 * Authorization is `reviews_insert_purchased`, not anything here: the policy
 * requires a paid order containing the model, so a request forged past this
 * action writes nothing. The checks below exist to turn a policy rejection into
 * a sentence the buyer can act on.
 */

export type ReviewState = { error?: string; fieldErrors?: Record<string, string> }

const reviewSchema = z.object({
  slug: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5),
  body: z.string().trim().max(2000, "Keep the review under 2000 characters"),
})

/** Postgres' "row violates row-level security policy". */
const RLS_VIOLATION = "42501"

function refresh(slug: string) {
  revalidatePath(`/3d-model/${slug}`)
  // The average and count are denormalized onto models, so anything rendering a
  // card is now stale too.
  revalidatePath("/3d-models")
  revalidatePath("/dashboard")
}

export async function submitReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const locale = await getLocale()
  const user = await getCurrentUser()

  const parsed = reviewSchema.safeParse({
    slug: formData.get("slug"),
    rating: formData.get("rating") ?? 0,
    body: formData.get("body") ?? "",
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form")
      fieldErrors[key] ??= issue.message
    }
    return { fieldErrors }
  }

  const v = parsed.data

  if (!user) {
    redirect({ href: `/login?next=/3d-model/${v.slug}`, locale })
    return {}
  }

  // Resolve through the catalog so an unpublished or non-existent slug cannot
  // collect reviews, and so the id never has to be trusted from the form.
  const model = await getModel(v.slug)
  if (!model) return { error: "That model is no longer available." }

  const supabase = await createClient()

  // Upsert rather than insert: a buyer gets one review per model
  // (unique (model_id, author_id)), and editing it should not be a different
  // code path from writing it.
  const { error } = await supabase.from("reviews").upsert(
    {
      model_id: model.id,
      author_id: user.id,
      rating: v.rating,
      body: v.body || null,
    },
    { onConflict: "model_id,author_id" },
  )

  if (error) {
    if (error.code === RLS_VIOLATION) {
      return { error: "You can review a model once you have bought it." }
    }
    return { error: "Could not save your review. Try again." }
  }

  refresh(v.slug)
  redirect({ href: withFlash(`/3d-model/${v.slug}`, "reviewSaved"), locale })
  // Unreachable: redirect() throws. Kept so the action still satisfies its
  // declared return type.
  return {}
}

export async function deleteReview(formData: FormData) {
  const locale = await getLocale()
  const slug = formData.get("slug")
  if (typeof slug !== "string") return

  const supabase = await createClient()
  // No ownership check: reviews_delete_own decides, so a forged model id
  // deletes nothing rather than somebody else's review.
  const model = await getModel(slug)
  if (!model) return

  await supabase.from("reviews").delete().eq("model_id", model.id)

  refresh(slug)
  redirect({ href: withFlash(`/3d-model/${slug}`, "reviewRemoved"), locale })
}
