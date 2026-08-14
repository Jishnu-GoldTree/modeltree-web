"use server"

import { revalidatePath } from "next/cache"
import { getLocale } from "next-intl/server"

import { redirect } from "@/i18n/navigation"

import { withFlash } from "@/lib/flash"

import { getModel } from "@/lib/data/catalog"
import { readFavorites, writeFavorites } from "@/lib/favorites"

/**
 * Saved-model mutations. FormData in, so the heart buttons are plain form
 * posts and work without JS.
 */

/** Revalidate every route that renders a heart or a count. */
function refresh() {
  revalidatePath("/favorites")
  revalidatePath("/profile")
  revalidatePath("/3d-models")
}

/** Only same-site relative paths; anything else would be an open redirect. */
function safeReturnTo(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : ""
  return path.startsWith("/") && !path.startsWith("//") ? path : "/favorites"
}

export async function toggleFavorite(formData: FormData) {
  const locale = await getLocale()
  const slug = formData.get("slug")
  // Untrusted input: ignore anything that isn't a real model.
  if (typeof slug !== "string" || !(await getModel(slug))) return

  const saved = await readFavorites()
  const wasSaved = saved.includes(slug)
  await writeFavorites(
    wasSaved ? saved.filter((s) => s !== slug) : [...saved, slug],
  )
  refresh()

  // Redirect back to the page the heart was clicked on. Hearting does not
  // otherwise navigate, and the header count lives in a client cache that only
  // refreshes on navigation — without this the badge stays stale until the
  // visitor happens to move elsewhere. Same reason the cart actions redirect.
  redirect({
    href: withFlash(safeReturnTo(formData.get("returnTo")), wasSaved ? "unsaved" : "saved"),
    locale,
  })
}

/**
 * Add without removing. The model page is statically prerendered so it can't
 * know whether this model is already saved — a toggle there would silently
 * un-save on a second click, under a button that still reads "Save".
 */
export async function addFavorite(formData: FormData) {
  const slug = formData.get("slug")
  if (typeof slug !== "string" || !(await getModel(slug))) return

  const saved = await readFavorites()
  if (!saved.includes(slug)) await writeFavorites([...saved, slug])
  refresh()
}

export async function removeFavorite(formData: FormData) {
  const slug = formData.get("slug")
  if (typeof slug !== "string") return

  const saved = await readFavorites()
  await writeFavorites(saved.filter((s) => s !== slug))
  refresh()
}

export async function clearFavorites() {
  const locale = await getLocale()
  await writeFavorites([])
  refresh()
  redirect({ href: withFlash("/favorites", "savedCleared"), locale })
}
