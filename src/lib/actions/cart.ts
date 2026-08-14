"use server"

import { revalidatePath } from "next/cache"
import { getLocale } from "next-intl/server"

import { redirect } from "@/i18n/navigation"

import { withFlash } from "@/lib/flash"

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
  const locale = await getLocale()
  const entry = await validate(formData.get("slug"), formData.get("license"))
  if (!entry) return

  const cart = await readCart()
  // Re-adding a model swaps its licence rather than duplicating the line —
  // you can't buy the same asset twice.
  const next = [...cart.filter((item) => item.slug !== entry.slug), entry]
  await writeCart(next)

  revalidatePath("/cart")
  redirect({ href: withFlash("/cart", "addedToCart"), locale })
}

export async function removeFromCart(formData: FormData) {
  const locale = await getLocale()
  const slug = formData.get("slug")
  if (typeof slug !== "string") return

  const cart = await readCart()
  await writeCart(cart.filter((item) => item.slug !== slug))
  revalidatePath("/cart")
  redirect({ href: withFlash("/cart", "removedFromCart"), locale })
}

export async function setLineLicense(formData: FormData) {
  const locale = await getLocale()
  const entry = await validate(formData.get("slug"), formData.get("license"))
  if (!entry) return

  const cart = await readCart()
  await writeCart(
    cart.map((item) => (item.slug === entry.slug ? entry : item)),
  )
  revalidatePath("/cart")
  redirect({ href: withFlash("/cart", "licenseUpdated"), locale })
}

export async function clearCart() {
  const locale = await getLocale()
  await writeCart([])
  revalidatePath("/cart")
  redirect({ href: withFlash("/cart", "cartCleared"), locale })
}
