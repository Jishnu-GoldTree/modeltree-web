-- Platform administration.
--
-- Until now there were two kinds of person in this system, buyer and designer,
-- and both are *customers*. Nobody could moderate a listing, price a payout or
-- retry a stuck job — those tables (`jobs`, and every write path on `orders`
-- and `payouts`) deliberately have no client policies at all, because money and
-- the queue were only ever meant to move under the service role.
--
-- This adds the third kind: GoldTree staff. It is a separate table rather than
-- a new value on `account_type` for two reasons. An admin is usually also a
-- buyer or a designer — the account_type enum answers "what do they do in the
-- marketplace", not "may they run it", and overloading it would force a staff
-- member to stop being a customer. And a role that grants power over other
-- people's money wants its own row, its own grant trail and its own revocation,
-- not a value edited in place on a profile the user themselves can update
-- (`profiles_update_own` would otherwise be a self-promotion vector).
--
-- Granting admin is service-role only: there is no insert policy here, so the
-- only way in is through the admin app, which checks that the *actor* is an
-- owner before it writes. RLS makes the table readable to staff and invisible
-- to everyone else.

begin;

-- ── Roles ──────────────────────────────────────────────────────────────
-- Coarse on purpose. Five roles that map to how a small team actually splits
-- up beats a permission matrix nobody maintains; the app expands each role
-- into capabilities (lib/auth/permissions.ts) so adding a capability is a
-- code change, not a migration.
--
--   owner      — everything, including granting and revoking other admins
--   admin      — everything except changing who is an admin
--   moderator  — catalog: publish, reject, archive, edit listings, taxonomy
--   finance    — orders, refunds, payouts; read-only on the catalog
--   support    — read-only everywhere, plus custom-work requests
create type public.admin_role as enum
  ('owner', 'admin', 'moderator', 'finance', 'support');

create table public.admin_users (
  -- Same id as the profile and the auth user: staff sign in through the same
  -- Supabase Auth pool as everyone else, so there is one identity per person
  -- and no second password to manage.
  id         uuid primary key references public.profiles (id) on delete cascade,
  role       public.admin_role not null default 'support',
  -- Who granted this, for the trail. Null for the bootstrap owner, who is
  -- created by scripts/grant-admin.mjs before any admin exists to do it.
  granted_by uuid references public.profiles (id) on delete set null,
  -- Revocation is a timestamp, not a delete: "Dana had admin until March" is
  -- something you want to be able to answer after the fact.
  revoked_at timestamptz,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index admin_users_active_idx on public.admin_users (role)
  where revoked_at is null;

create trigger admin_users_updated_at before update on public.admin_users
  for each row execute function public.set_updated_at();

-- ── Predicates ─────────────────────────────────────────────────────────
-- security definer because the caller cannot read admin_users until these say
-- they can — a policy that queries the table it protects deadlocks on itself.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where id = (select auth.uid()) and revoked_at is null
  );
$$;

/** The caller's role, or null if they are not staff. */
create or replace function public.platform_admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.admin_users
  where id = (select auth.uid()) and revoked_at is null;
$$;

alter table public.admin_users enable row level security;

-- Staff can see the roster; nobody else knows it exists. No insert, update or
-- delete policy anywhere — grants and revocations go through the service role
-- after the admin app has checked the actor is an owner.
create policy admin_users_read on public.admin_users
  for select to authenticated
  using (public.is_platform_admin());

-- ── Audit ──────────────────────────────────────────────────────────────
-- The moment more than one person can publish a listing or mark a payout paid,
-- "who did this" stops being answerable from the row itself. Every mutating
-- action in the admin app writes one line here.
create table public.admin_audit_log (
  id         bigserial primary key,
  -- set null, not cascade: removing a staff profile must not erase the record
  -- of what they did to other people's money.
  actor_id   uuid references public.profiles (id) on delete set null,
  -- Dotted verb, e.g. 'model.publish', 'payout.mark_paid', 'admin.grant'.
  action     text not null,
  entity     text not null,
  entity_id  text,
  -- Human-readable one-liner rendered straight into the activity feed, so the
  -- feed does not have to re-join half the schema to say what happened.
  summary    text,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_recent_idx on public.admin_audit_log (created_at desc);
create index admin_audit_entity_idx on public.admin_audit_log (entity, entity_id, created_at desc);

alter table public.admin_audit_log enable row level security;

create policy admin_audit_read on public.admin_audit_log
  for select to authenticated
  using (public.is_platform_admin());

-- Append-only by design: no update or delete policy, and writes come from the
-- service role. A log a compromised session can edit is not a log.

-- ── Dashboard aggregates ───────────────────────────────────────────────
-- PostgREST cannot express "eleven counts and three sums" in one call, and
-- issuing eleven head-count requests to paint one screen is a lot of round
-- trips to Frankfurt. These return the whole panel in one.
--
-- Execute is revoked from anon and authenticated and granted to service_role
-- alone: the admin app calls them through the guarded service-role client, so
-- the function does not need — and must not have — a caller check of its own.

create or replace function public.admin_overview()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'models', (
      select jsonb_object_agg(status, n) from (
        select status::text, count(*) as n from public.models group by status
      ) s
    ),
    'models_total',      (select count(*) from public.models),
    'requests', (
      select jsonb_object_agg(status, n) from (
        select status::text, count(*) as n from public.requests group by status
      ) s
    ),
    -- Gross is what buyers paid; fees are what the platform kept. Both come
    -- from paid orders only — pending and failed are not revenue.
    'gross_agorot', (
      select coalesce(sum(total_cents), 0) from public.orders where status = 'paid'
    ),
    'gross_agorot_30d', (
      select coalesce(sum(total_cents), 0) from public.orders
      where status = 'paid' and placed_at >= now() - interval '30 days'
    ),
    'platform_fee_agorot', (
      select coalesce(sum(i.platform_fee_cents), 0)
      from public.order_items i
      join public.orders o on o.id = i.order_id
      where o.status = 'paid'
    ),
    'orders_paid',     (select count(*) from public.orders where status = 'paid'),
    'orders_pending',  (select count(*) from public.orders where status = 'pending'),
    'orders_refunded', (select count(*) from public.orders where status = 'refunded'),
    -- What designers have earned but not been paid: everything they are owed
    -- on paid orders, less every payout not in a failed state.
    'owed_agorot', (
      select coalesce((
        select sum(i.designer_share_cents)
        from public.order_items i
        join public.orders o on o.id = i.order_id
        where o.status = 'paid'
      ), 0) - coalesce((
        select sum(amount_cents) from public.payouts where status <> 'failed'
      ), 0)
    ),
    'payouts_pending', (select count(*) from public.payouts where status = 'pending'),
    'profiles_total',  (select count(*) from public.profiles),
    'designers',       (select count(*) from public.profiles where account_type = 'designer'),
    'signups_30d',     (select count(*) from public.profiles where created_at >= now() - interval '30 days'),
    'jobs_queued',     (select count(*) from public.jobs where status = 'queued'),
    -- Failed means the queue gave up (attempts exhausted); a job still retrying
    -- is not something anyone needs to look at yet.
    'jobs_failed',     (select count(*) from public.jobs where status = 'failed')
  );
$$;

revoke all on function public.admin_overview() from public, anon, authenticated;
grant execute on function public.admin_overview() to service_role;

/**
 * Paid revenue per day, gap-filled.
 *
 * generate_series supplies the days so a quiet Tuesday is a zero rather than a
 * missing point — a chart that skips empty days silently compresses time and
 * makes a bad week look like a busy one.
 */
create or replace function public.admin_revenue_daily(days int default 30)
returns table (day date, gross_agorot bigint, orders bigint)
language sql
stable
security definer
set search_path = public
as $$
  select d::date as day,
         coalesce(sum(o.total_cents), 0)::bigint as gross_agorot,
         count(o.id)::bigint as orders
    from generate_series(
           (current_date - (greatest(days, 1) - 1)), current_date, interval '1 day'
         ) d
    left join public.orders o
      on o.status = 'paid' and o.placed_at >= d and o.placed_at < d + interval '1 day'
   group by d
   order by d;
$$;

revoke all on function public.admin_revenue_daily(int) from public, anon, authenticated;
grant execute on function public.admin_revenue_daily(int) to service_role;

/**
 * Per-designer earnings ledger.
 *
 * Owed is derived, never stored: a balance column would have to be kept in step
 * with every order and every payout, and the first missed update is a designer
 * paid twice.
 */
create or replace function public.admin_designer_balances()
returns table (
  designer_id  uuid,
  handle       citext,
  full_name    text,
  earned_agorot bigint,
  paid_agorot   bigint,
  owed_agorot   bigint,
  sales         bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with earned as (
    select i.designer_id,
           sum(i.designer_share_cents)::bigint as earned_agorot,
           count(*)::bigint as sales
      from public.order_items i
      join public.orders o on o.id = i.order_id
     where o.status = 'paid'
     group by i.designer_id
  ),
  paid as (
    select designer_id, sum(amount_cents)::bigint as paid_agorot
      from public.payouts
     where status <> 'failed'
     group by designer_id
  )
  select p.id,
         p.handle,
         p.full_name,
         coalesce(e.earned_agorot, 0),
         coalesce(pd.paid_agorot, 0),
         coalesce(e.earned_agorot, 0) - coalesce(pd.paid_agorot, 0),
         coalesce(e.sales, 0)
    from public.profiles p
    left join earned e  on e.designer_id = p.id
    left join paid   pd on pd.designer_id = p.id
   where e.designer_id is not null or pd.designer_id is not null
   order by (coalesce(e.earned_agorot, 0) - coalesce(pd.paid_agorot, 0)) desc;
$$;

revoke all on function public.admin_designer_balances() from public, anon, authenticated;
grant execute on function public.admin_designer_balances() to service_role;

commit;
