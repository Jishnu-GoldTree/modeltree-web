import { cache } from "react"
import { publicCache } from "./public-cache"
import { supabasePublic } from "@/lib/supabase/public"

// One public taxonomy read for metadata, category routes and facet counts.
export const getCategories = cache(publicCache(async () => {
  const { data, error } = await supabasePublic.from("categories").select("id, slug, label")
  if (error) throw new Error(`categories query failed: ${error.message}`)
  return (data ?? []) as { id: string; slug: string; label: string }[]
}, ["catalog-categories"], { revalidate: 3600, tags: ["catalog"] }))
