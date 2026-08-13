"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getLicenseOptions, getModel } from "@/lib/data/catalog"
import { readCart, writeCart } from "@/lib/cart"

/**
 * Cart mutations.
 *
 * Every one takes FormData so the buttons work as plain form posts — no JS
 * required, and no client cart state to drift from the cookie.
 */

/** Form input is untrusted: a slug or licence that doesn't exist is ignored. */
async function validate(slug: unknown, license: unknown) {
  if (typeof slug !== "string") return null
  const model = await getModel(slug)
  if (!model) return null

  const options = await getLicenseOptions(model)
  const chosen =
    options.find((option) => option.id === license) ?? options[0]
  return { slug: model.slug, license: chosen.id }
}

export async function addToCart(formData: FormData) {
  const entry = await validate(formData.get("slug"), formData.get("license"))
  if (!entry) return

  const cart = await readCart()
  // Re-adding a model swaps its licence rather than duplicating the line —
  // you can't buy the same asset twice.
  const next = [...cart.filter((item) => item.slug !== entry.slug), entry]
  await writeCart(next)

  revalidatePath("/cart")
  redirect("/cart")
}

export async function removeFromCart(formData: FormData) {
  const slug = formData.get("slug")
  if (typeof slug !== "string") return

  const cart = await readCart()
  await writeCart(cart.filter((item) => item.slug !== slug))
  revalidatePath("/cart")
}

export async function setLineLicense(formData: FormData) {
  const entry = await validate(formData.get("slug"), formData.get("license"))
  if (!entry) return

  const cart = await readCart()
  await writeCart(
    cart.map((item) => (item.slug === entry.slug ? entry : item)),
  )
  revalidatePath("/cart")
}

export async function clearCart() {
  await writeCart([])
  revalidatePath("/cart")
}
