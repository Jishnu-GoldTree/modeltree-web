import "server-only"

import { createClient } from "@/lib/supabase/server"

/**
 * Profile and purchase-history reads.
 *
 * Uses the cookie-bound client so RLS scopes everything to the signed-in user:
 * `orders_read_own` means a mistake here returns nothing rather than someone
 * else's order history.
 */

export type Profile = {
  id: string
  handle: string
  fullName: string | null
  accountType: "buyer" | "designer"
  bio: string | null
  location: string | null
  avatarUrl: string | null
  memberSince: string
}

type ProfileRow = {
  id: string
  handle: string
  full_name: string | null
  account_type: "buyer" | "designer"
  bio: string | null
  location: string | null
  avatar_url: string | null
  created_at: string
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    handle: row.handle,
    fullName: row.full_name,
    accountType: row.account_type,
    bio: row.bio,
    location: row.location,
    avatarUrl: row.avatar_url,
    memberSince: new Date(row.created_at).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
  }
}

export async function getProfile(id: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, handle, full_name, account_type, bio, location, avatar_url, created_at")
    .eq("id", id)
    .maybeSingle()
  return data ? toProfile(data as ProfileRow) : null
}

export type PurchasedItem = {
  orderId: string
  reference: string
  placedOn: string
  licenseCode: string
  priceCents: number
  model: { slug: string; title: string; author: string; formats: string[] }
}

/**
 * What the signed-in buyer has actually paid for.
 *
 * Only `paid` orders: a pending or failed order must not appear as a purchase,
 * and it is `model_files`' RLS policy — keyed on the same condition — that
 * decides whether the download works.
 */
export async function getMyPurchases(): Promise<PurchasedItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("order_items")
    .select(
      `license_code, unit_price_cents, created_at,
       orders!inner ( id, status, placed_at, payment_ref ),
       models ( slug, title, formats, profiles!models_designer_id_fkey ( handle ) )`,
    )
    .eq("orders.status", "paid")
    .order("created_at", { ascending: false })

  return (data ?? []).map((r) => {
    const row = r as unknown as {
      license_code: string
      unit_price_cents: number
      orders: { id: string; placed_at: string; payment_ref: string | null }
      models: {
        slug: string
        title: string
        formats: string[]
        profiles: { handle: string } | null
      } | null
    }
    return {
      orderId: row.orders.id,
      // Short, human-quotable reference; the uuid is not something to read out.
      reference: row.orders.payment_ref ?? `MT-${row.orders.id.slice(0, 8).toUpperCase()}`,
      placedOn: new Date(row.orders.placed_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      licenseCode: row.license_code,
      priceCents: row.unit_price_cents,
      model: {
        slug: row.models?.slug ?? "",
        title: row.models?.title ?? "Removed model",
        author: row.models?.profiles?.handle ?? "unknown",
        formats: row.models?.formats ?? [],
      },
    }
  })
}

/** Public storefront figures for a designer. */
export async function getDesignerStats(profileId: string) {
  const supabase = await createClient()
  const [{ count: published }, { data: sales }] = await Promise.all([
    supabase
      .from("models")
      .select("id", { count: "exact", head: true })
      .eq("designer_id", profileId)
      .eq("status", "published"),
    supabase.from("order_items").select("designer_share_cents"),
  ])

  const rows = (sales ?? []) as { designer_share_cents: number }[]
  return {
    published: published ?? 0,
    sales: rows.length,
    earnedCents: rows.reduce((sum, r) => sum + r.designer_share_cents, 0),
  }
}
