import "server-only"

import { createClient } from "@/lib/supabase/server"

/**
 * Custom-work requests.
 *
 * Reads go through the cookie-bound client so RLS scopes them: a buyer sees
 * their own threads, a designer sees the queue. A mistake here returns nothing
 * rather than someone else's conversation.
 */

export const REQUEST_KINDS = ["adjustment", "commission"] as const
export const REQUEST_STATUSES = [
  "open",
  "quoted",
  "accepted",
  "delivered",
  "closed",
  "declined",
] as const

export type RequestKind = (typeof REQUEST_KINDS)[number]
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export type RequestSummary = {
  id: string
  kind: RequestKind
  status: RequestStatus
  title: string
  quoteAgorot: number | null
  createdAt: string
  updatedAt: string
  buyer: { id: string; handle: string; name: string | null }
  model: { slug: string; title: string } | null
}

export type RequestDetail = RequestSummary & {
  brief: string
  assigneeId: string | null
}

type Row = {
  id: string
  kind: RequestKind
  status: RequestStatus
  title: string
  brief: string
  quote_agorot: number | null
  assignee_id: string | null
  created_at: string
  updated_at: string
  profiles: { id: string; handle: string; full_name: string | null } | null
  models: { slug: string; title: string } | null
}

const SELECT = `
  id, kind, status, title, brief, quote_agorot, assignee_id, created_at, updated_at,
  profiles!requests_buyer_id_fkey ( id, handle, full_name ),
  models ( slug, title )
`

function toSummary(row: Row): RequestSummary {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    title: row.title,
    quoteAgorot: row.quote_agorot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    buyer: {
      id: row.profiles?.id ?? "",
      handle: row.profiles?.handle ?? "unknown",
      name: row.profiles?.full_name ?? null,
    },
    model: row.models ? { slug: row.models.slug, title: row.models.title } : null,
  }
}

/**
 * Threads visible to the signed-in user.
 *
 * No explicit filter on buyer_id: RLS already decides, and adding one here
 * would quietly break the designer queue, where the point is to see other
 * people's requests.
 */
export async function listRequests(): Promise<RequestSummary[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("requests")
    .select(SELECT)
    .order("updated_at", { ascending: false })

  return ((data ?? []) as unknown as Row[]).map(toSummary)
}

export async function getRequest(id: string): Promise<RequestDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("requests").select(SELECT).eq("id", id).maybeSingle()
  if (!data) return null

  const row = data as unknown as Row
  return { ...toSummary(row), brief: row.brief, assigneeId: row.assignee_id }
}

/** Models this buyer has paid for — the only things an adjustment can target. */
export async function getAdjustableModels() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("order_items")
    .select("models ( id, slug, title ), orders!inner ( status )")
    .eq("orders.status", "paid")

  type Row = { models: { id: string; slug: string; title: string } | null }
  const seen = new Map<string, { id: string; slug: string; title: string }>()
  for (const row of (data ?? []) as unknown as Row[]) {
    if (row.models) seen.set(row.models.id, row.models)
  }
  return [...seen.values()]
}
