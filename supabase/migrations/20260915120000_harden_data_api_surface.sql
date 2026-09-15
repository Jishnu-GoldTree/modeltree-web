/**
 * Hardening pass on what the Data API exposes, from a Supabase advisor report
 * flagging six publicly executable SECURITY DEFINER functions and two functions
 * with a mutable search_path.
 *
 * None of this was exploitable as it stood — every predicate below is scoped to
 * `auth.uid()`, so the worst an anonymous caller learned by invoking one was a
 * fact about themselves, and `jobs` is RLS-enabled with no policies, which
 * denies by default. The point is that none of it should have been reachable in
 * the first place: a function that exists to be called from an RLS policy has
 * no business answering POST /rest/v1/rpc, and a queue the worker owns has no
 * business carrying table grants for anonymous browsers. Both are one careless
 * policy away from mattering.
 */

-- ── Predicates used by RLS policies ────────────────────────────────────────
-- `authenticated` must keep EXECUTE: policy expressions are evaluated as the
-- querying role, so revoking it would make `requests` and `admin_users`
-- unreadable to everyone. `anon` evaluates none of these policies — every one
-- of them is `to authenticated` — so it needs nothing.

revoke execute on function public.is_designer() from public, anon;
grant  execute on function public.is_designer() to authenticated;

revoke execute on function public.is_platform_admin() from public, anon;
grant  execute on function public.is_platform_admin() to authenticated;

-- Referenced by no policy at all: the admin app reads the caller's role through
-- the service-role client, which is unaffected by any of this.
revoke execute on function public.platform_admin_role() from public, anon, authenticated;
grant  execute on function public.platform_admin_role() to service_role;

-- ── Trigger functions ──────────────────────────────────────────────────────
-- PostgreSQL checks EXECUTE on a trigger function when the trigger is created,
-- not each time it fires, so these grants bought nothing and only widened the
-- RPC surface. PostgREST will not expose a function returning `trigger`, but
-- that is its politeness, not a privilege boundary.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.refresh_model_rating() from public, anon, authenticated;
revoke execute on function public.sync_model_file_metadata() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ── Mutable search paths ───────────────────────────────────────────────────
-- The two functions that never set one. The others set `search_path = public`,
-- which is safe here because no role but the owner holds CREATE on that schema
-- — there is nowhere for an attacker to put a shadowing function. These two get
-- the stricter empty path, with every reference qualified.

alter function public.set_updated_at() set search_path = '';

-- Recreated rather than altered: the body referenced `jobs` unqualified, which
-- an empty search_path would break at the first call.
create or replace function public.claim_jobs(batch_size int default 1)
returns setof public.jobs
language sql
set search_path = ''
as $$
  update public.jobs
     set status = 'running', locked_at = now(), attempts = attempts + 1
   where id in (
     select id from public.jobs
      where status = 'queued' and run_after <= now()
      order by run_after
      for update skip locked
      limit batch_size
   )
  returning *;
$$;

-- Claiming work is the worker's job and nobody else's. Not SECURITY DEFINER, so
-- an anonymous call was already emptied by RLS — but it should not be callable.
revoke execute on function public.claim_jobs(int) from public, anon, authenticated;
grant  execute on function public.claim_jobs(int) to service_role;

-- ── The queue table ────────────────────────────────────────────────────────
-- anon and authenticated held full DML grants on `jobs`, inert only because RLS
-- is on with zero policies. That makes "nobody ever adds a permissive policy
-- here" a security control, which is not a control. Every reader and writer of
-- this table in both apps goes through the service-role client.
revoke all on table public.jobs from anon, authenticated;
