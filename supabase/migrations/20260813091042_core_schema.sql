-- ModelTree core schema.
--
-- Money is stored as integer cents, never floats: 0.1 + 0.2 has no exact binary
-- representation and marketplace revenue splits three ways.
--
-- Listings are English-only (see models.language). The client publishes in
-- English and Hebrew is an interface language only, so there is deliberately no
-- translations table until that changes.

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

create type account_type  as enum ('buyer', 'designer');
create type model_status  as enum ('draft', 'processing', 'published', 'rejected', 'archived');
create type order_status  as enum ('pending', 'paid', 'refunded', 'failed');
create type payout_status as enum ('pending', 'processing', 'paid', 'failed');
create type job_status    as enum ('queued', 'running', 'done', 'failed');

create or replace function set_updated_at() returns trigger
language plpgsql as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

-- ───────────────────────────────── identity ─────────────────────────────────
-- Mirrors auth.users. The app never reads the auth schema directly: it is
-- Supabase-owned, may change between releases, and is not exposed to RLS the
-- way a public table is.
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  handle       citext not null unique,
  full_name    text,
  account_type account_type not null default 'buyer',
  bio          text,
  location     text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Creates the profile row on signup. SECURITY DEFINER because the signing-up
-- user has no rights on public.profiles at the moment this runs.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare
  base_handle  text;
  final_handle text;
  suffix       int := 0;
begin
  base_handle := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9]+', '', 'g');
  if base_handle = '' then
    base_handle := 'user';
  end if;
  final_handle := base_handle;

  -- Handles derive from the email local-part, so collisions are expected
  -- (alex@a.com vs alex@b.com). Walk until one is free.
  while exists (select 1 from profiles where handle = final_handle) loop
    suffix := suffix + 1;
    final_handle := base_handle || suffix::text;
  end loop;

  insert into profiles (id, handle, full_name, account_type)
  values (
    new.id,
    final_handle,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'account_type')::account_type, 'buyer')
  );
  return new;
end;
$fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ───────────────────────────────── taxonomy ─────────────────────────────────
create table categories (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique,
  label    text not null,
  kind     text not null default 'asset' check (kind in ('asset', 'print')),
  position int  not null default 0
);

create table licenses (
  code             text primary key,
  label            text not null,
  blurb            text not null,
  -- Extended is priced as a multiple of the model's own price, so a $9 asset
  -- and a $240 asset both price sensibly with no per-model configuration.
  price_multiplier numeric(4,2) not null default 1.00,
  position         int not null default 0
);

-- ────────────────────────────────── catalog ─────────────────────────────────
create table models (
  id             uuid primary key default gen_random_uuid(),
  designer_id    uuid not null references profiles(id) on delete cascade,
  category_id    uuid references categories(id) on delete set null,
  slug           text not null unique,
  title          text not null,
  description    text,
  -- Language the listing was written in. English-only today; recorded so that
  -- adding a locale later is a migration rather than a guess.
  language       text not null default 'en',
  status         model_status not null default 'draft',
  price_cents    integer not null default 0 check (price_cents >= 0),
  currency       char(3) not null default 'USD',
  license_code   text not null default 'royalty-free' references licenses(code),
  rigged         boolean not null default false,
  animated       boolean not null default false,
  pbr            boolean not null default false,
  polygons       integer check (polygons is null or polygons >= 0),
  vertices       integer check (vertices is null or vertices >= 0),
  download_count integer not null default 0,
  rating         numeric(2,1) check (rating is null or rating between 0 and 5),
  review_count   integer not null default 0,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- A listing cannot go live without the fields buyers need to decide.
  constraint published_needs_content check (
    status <> 'published' or (description is not null and category_id is not null)
  )
);
create trigger models_updated_at before update on models
  for each row execute function set_updated_at();

create index models_browse_idx   on models (status, published_at desc) where status = 'published';
create index models_category_idx on models (category_id) where status = 'published';
create index models_designer_idx on models (designer_id);
create index models_title_trgm   on models using gin (title gin_trgm_ops);

-- Deliverables, kept apart from images because access differs: previews are
-- public, source files are reachable only by the designer or a buyer.
create table model_files (
  id          uuid primary key default gen_random_uuid(),
  model_id    uuid not null references models(id) on delete cascade,
  format      text not null,
  storage_key text not null unique,
  size_bytes  bigint not null default 0 check (size_bytes >= 0),
  checksum    text,
  created_at  timestamptz not null default now(),
  unique (model_id, format)
);

create table model_images (
  id          uuid primary key default gen_random_uuid(),
  model_id    uuid not null references models(id) on delete cascade,
  storage_key text not null unique,
  position    int not null default 0,
  alt         text,
  width       int,
  height      int,
  created_at  timestamptz not null default now()
);
create index model_images_model_idx on model_images (model_id, position);

-- ─────────────────────────────────── sales ──────────────────────────────────
create table orders (
  id             uuid primary key default gen_random_uuid(),
  buyer_id       uuid not null references profiles(id) on delete restrict,
  status         order_status not null default 'pending',
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  total_cents    integer not null default 0 check (total_cents >= 0),
  currency       char(3) not null default 'USD',
  payment_ref    text unique,
  placed_at      timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();
create index orders_buyer_idx on orders (buyer_id, placed_at desc);

create table order_items (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid not null references orders(id) on delete cascade,
  -- restrict, not cascade: a sold model must not be deletable out from under an
  -- invoice. Archive it instead.
  model_id             uuid not null references models(id) on delete restrict,
  designer_id          uuid not null references profiles(id) on delete restrict,
  license_code         text not null references licenses(code),
  -- Price snapshots. An invoice must never change because a price changed
  -- afterwards, so these are copied at purchase time and never joined for.
  unit_price_cents     integer not null check (unit_price_cents >= 0),
  designer_share_cents integer not null check (designer_share_cents >= 0),
  platform_fee_cents   integer not null check (platform_fee_cents >= 0),
  created_at           timestamptz not null default now(),
  unique (order_id, model_id),
  -- The split must reconcile, or payouts drift from revenue silently.
  constraint split_balances check (
    designer_share_cents + platform_fee_cents = unit_price_cents
  )
);
create index order_items_designer_idx on order_items (designer_id);
create index order_items_model_idx    on order_items (model_id);

create table payouts (
  id           uuid primary key default gen_random_uuid(),
  designer_id  uuid not null references profiles(id) on delete restrict,
  status       payout_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  currency     char(3) not null default 'USD',
  period_start date not null,
  period_end   date not null,
  paid_at      timestamptz,
  created_at   timestamptz not null default now(),
  check (period_end >= period_start)
);
create index payouts_designer_idx on payouts (designer_id, period_start desc);

-- ──────────────────────────────── engagement ────────────────────────────────
create table favorites (
  profile_id uuid not null references profiles(id) on delete cascade,
  model_id   uuid not null references models(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, model_id)
);

create table reviews (
  id         uuid primary key default gen_random_uuid(),
  model_id   uuid not null references models(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_id, author_id)
);
create trigger reviews_updated_at before update on reviews
  for each row execute function set_updated_at();
create index reviews_model_idx on reviews (model_id, created_at desc);

-- ─────────────────────────────────── jobs ───────────────────────────────────
-- Postgres is the queue. Enqueue happens in the same transaction as the write
-- that caused it, so a model row and its "generate previews" job either both
-- land or neither does — which a separate broker cannot guarantee.
create table jobs (
  id           bigserial primary key,
  kind         text not null,
  payload      jsonb not null default '{}'::jsonb,
  status       job_status not null default 'queued',
  attempts     int not null default 0,
  max_attempts int not null default 5,
  run_after    timestamptz not null default now(),
  locked_at    timestamptz,
  last_error   text,
  created_at   timestamptz not null default now()
);
create index jobs_claim_idx on jobs (run_after) where status = 'queued';

-- Claims work for one worker. SKIP LOCKED lets several workers pull from the
-- same table without blocking each other or being handed the same row twice.
create or replace function claim_jobs(batch_size int default 1)
returns setof jobs
language sql volatile as $fn$
  update jobs
     set status = 'running', locked_at = now(), attempts = attempts + 1
   where id in (
     select id from jobs
      where status = 'queued' and run_after <= now()
      order by run_after
      for update skip locked
      limit batch_size
   )
  returning *;
$fn$;
