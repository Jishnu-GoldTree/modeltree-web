"use server"

import { revalidatePath } from "next/cache"
import { getLocale } from "next-intl/server"

import { redirect } from "@/i18n/navigation"
import { withFlash } from "@/lib/flash"
import { profileSchema } from "@/lib/validations/forms"
import { createClient, getCurrentUser } from "@/lib/supabase/server"

/**
 * Profile updates.
 *
 * The write goes through the cookie-bound client, so `profiles_update_own` is
 * what actually restricts it to the signed-in user — the id below is taken from
 * the session, never from the form, so there is nothing to spoof.
 */

export type ProfileState = {
  error?: string
  fieldErrors?: Record<string, string>
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You need to be signed in to edit your profile." }

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    handle: formData.get("handle") ?? "",
    accountType: formData.get("accountType") ?? "buyer",
    bio: formData.get("bio") ?? undefined,
    location: formData.get("location") ?? undefined,
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
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: v.fullName,
      handle: v.handle,
      account_type: v.accountType,
      bio: v.bio || null,
      location: v.location || null,
    })
    .eq("id", user.id)

  if (error) {
    // 23505 is unique_violation — the only one a user can realistically hit,
    // and the generic message would read as a server fault rather than
    // something they can fix.
    if (error.code === "23505") {
      return { fieldErrors: { handle: "That handle is already taken." } }
    }
    return { error: "Could not save your profile. Try again." }
  }

  // The header avatar and the public storefront both read this.
  revalidatePath("/profile")
  revalidatePath("/profile/settings")
  revalidatePath(`/designers/${v.handle}`)

  // Back to the profile itself, so the change is visible rather than reported.
  // The toast rides along in `?flash=` because the form unmounts on navigation.
  redirect({ href: withFlash("/profile", "profileSaved"), locale: await getLocale() })
  // Unreachable: redirect() throws. Present so the action still satisfies its
  // declared return type.
  return {}
}
