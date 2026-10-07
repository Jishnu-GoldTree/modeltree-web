-- Custom-work requests: the chat with GoldTree's modelling team.
--
-- The client described two things that look like one product: adjusting a
-- model a customer already bought (resize a ring — cheap), and commissioning a
-- piece from scratch (quoted from a brief). They share a thread, a quote and a
-- status, so they are one table with a `kind`, not two subsystems.
--
-- Money stays in agorot like everywhere else, and quoting is a column on the
-- request rather than a separate table: there is one live quote at a time, and
-- a history of superseded prices is not something anyone has asked to keep.

begin;

create type public.request_kind as enum ('adjustment', 'commission');

create type public.request_status as enum (
  'open',       -- submitted, nobody has quoted yet
  'quoted',     -- a modeler has put a price on it
  'accepted',   -- the buyer took the quote; work can start
  'delivered',  -- files handed over
  'closed',     -- finished or abandoned
  'declined'    -- the team will not take it
);

create table public.requests (
  id          uuid primary key default gen_random_uuid(),
  buyer_id    uuid not null references public.profiles (id) on delete cascade,
  -- The modeler who picked it up. Null until someone does.
  assignee_id uuid references public.profiles (id) on delete set null,

  kind   public.request_kind   not null,
  status public.request_status not null default 'open',

  -- An adjustment points at the model being changed. Enforced below: a
  -- commission has no model yet, which is the whole point of it.
  model_id uuid references public.models (id) on delete set null,

  title   text not null check (char_length(btrim(title)) between 4 and 120),
  brief   text not null check (char_length(btrim(brief)) between 10 and 4000),

  -- The live quote. Null until a modeler prices it.
  quote_agorot integer check (quote_agorot is null or quote_agorot >= 0),
  quoted_at    timestamptz,
  accepted_at  timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- An adjustment without a model is meaningless; a commission with one is
  -- almost certainly a mis-filed adjustment.
  constraint requests_model_matches_kind check (
    (kind = 'adjustment' and model_id is not null)
    or (kind = 'commission' and model_id is null)
  ),
  -- Status and quote cannot disagree: nothing is 'quoted' without a price.
  constraint requests_quote_present check (
    status not in ('quoted', 'accepted', 'delivered') or quote_agorot is not null
  )
);

create index requests_buyer_idx    on public.requests (buyer_id, created_at desc);
create index requests_assignee_idx on public.requests (assignee_id, created_at desc)
  where assignee_id is not null;
create index requests_status_idx   on public.requests (status, created_at desc);

create table public.request_messages (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index request_messages_thread_idx
  on public.request_messages (request_id, created_at);

-- ── Row Level Security ──────────────────────────────────────────────────
-- Same reasoning as the rest of the schema: the database decides, so a missing
-- filter in a query is an empty result rather than someone else's conversation.

alter table public.requests         enable row level security;
alter table public.request_messages enable row level security;

/**
 * Who may see a request: the buyer who opened it, and designers.
 *
 * Designers as a class rather than the assignee alone, because an unassigned
 * request has to be visible to somebody before anyone can pick it up — an
 * assignee-only policy would make every new request invisible to the team it
 * was sent to.
 */
create or replace function public.is_designer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and account_type = 'designer'
  );
$$;

create policy requests_read on public.requests
  for select to authenticated
  using (buyer_id = (select auth.uid()) or public.is_designer());

create policy requests_insert_own on public.requests
  for insert to authenticated
  with check (buyer_id = (select auth.uid()) and status = 'open');

-- Buyers may edit their own request only while nobody has priced it; after
-- that the terms are part of a negotiation. Designers may move it along.
create policy requests_update_buyer on public.requests
  for update to authenticated
  using (buyer_id = (select auth.uid()) and status in ('open', 'quoted'))
  with check (buyer_id = (select auth.uid()));

create policy requests_update_designer on public.requests
  for update to authenticated
  using (public.is_designer())
  with check (public.is_designer());

create policy request_messages_read on public.request_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.requests r
      where r.id = request_id
        and (r.buyer_id = (select auth.uid()) or public.is_designer())
    )
  );

-- You may only post as yourself, and only into a thread you can see.
create policy request_messages_insert on public.request_messages
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.requests r
      where r.id = request_id
        and (r.buyer_id = (select auth.uid()) or public.is_designer())
    )
  );

-- Threads are a record of what was agreed; nobody edits history.

create trigger requests_updated_at before update on public.requests
  for each row execute function set_updated_at();

commit;
