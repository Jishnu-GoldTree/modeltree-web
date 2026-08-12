"use server"

import { revalidatePath } from "next/cache"

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

export async function toggleFavorite(formData: FormData) {
  const slug = formData.get("slug")
  // Untrusted input: ignore anything that isn't a real model.
  if (typeof slug !== "string" || !getModel(slug)) return

  const saved = await readFavorites()
  await writeFavorites(
    saved.includes(slug) ? saved.filter((s) => s !== slug) : [...saved, slug],
  )
  refresh()
}

/**
 * Add without removing. The model page is statically prerendered so it can't
 * know whether this model is already saved — a toggle there would silently
 * un-save on a second click, under a button that still reads "Save".
 */
export async function addFavorite(formData: FormData) {
  const slug = formData.get("slug")
  if (typeof slug !== "string" || !getModel(slug)) return

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
  await writeFavorites([])
  refresh()
}
