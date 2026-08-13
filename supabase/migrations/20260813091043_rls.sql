-- Row Level Security.
--
-- This is the reason for choosing Supabase Auth over Auth.js: authorisation is
-- enforced by the database, so a forgotten `where buyer_id = ...` in app code
-- is a returned-nothing bug rather than a data leak.
--
-- Every table is enabled. A table with RLS on and no policy denies everything,
-- which is the correct default — the service-role key bypasses RLS entirely and
-- is what the seeding scripts and the worker use.

alter table profiles     enable row level security;
alter table categories   enable row level security;
alter table licenses     enable row level security;
alter table models       enable row level security;
alter table model_files  enable row level security;
alter table model_images enable row level security;
alter table orders       enable row level security;
alter table order_items  enable row level security;
alter table payouts      enable row level security;
alter table favorites    enable row level security;
alter table reviews      enable row level security;
alter table jobs         enable row level security;

-- ─────────────────────────────── reference data ─────────────────────────────
-- Taxonomy is public and only writable by the service role (no policy = no
-- client writes).
create policy categories_read on categories for select to anon, authenticated using (true);
create policy licenses_read   on licenses   for select to anon, authenticated using (true);

-- ──────────────────────────────── profiles ──────────────────────────────────
-- Public: designer storefronts have to be viewable by anonymous visitors.
create policy profiles_read on profiles
  for select to anon, authenticated using (true);

create policy profiles_update_own on profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ───────────────────────────────── catalog ──────────────────────────────────
-- Anyone may read published listings; a designer additionally sees their own
-- drafts. Both arms live in one policy so a draft is never visible twice.
create policy models_read on models
  for select to anon, authenticated
  using (status = 'published' or designer_id = (select auth.uid()));

create policy models_insert_own on models
  for insert to authenticated
  with check (designer_id = (select auth.uid()));

create policy models_update_own on models
  for update to authenticated
  using (designer_id = (select auth.uid()))
  with check (designer_id = (select auth.uid()));

create policy models_delete_own on models
  for delete to authenticated
  using (designer_id = (select auth.uid()));

-- Preview images follow the listing's visibility.
create policy model_images_read on model_images
  for select to anon, authenticated
  using (exists (
    select 1 from models m
     where m.id = model_images.model_id
       and (m.status = 'published' or m.designer_id = (select auth.uid()))
  ));

create policy model_images_write_own on model_images
  for all to authenticated
  using (exists (select 1 from models m where m.id = model_images.model_id and m.designer_id = (select auth.uid())))
  with check (exists (select 1 from models m where m.id = model_images.model_id and m.designer_id = (select auth.uid())));

-- Source files are the product. Readable only by the designer who owns them or
-- someone who has actually paid — this row is what stands between a paid asset
-- and a free download.
create policy model_files_read on model_files
  for select to authenticated
  using (
    exists (select 1 from models m
             where m.id = model_files.model_id
               and m.designer_id = (select auth.uid()))
    or exists (
      select 1
        from order_items oi
        join orders o on o.id = oi.order_id
       where oi.model_id = model_files.model_id
         and o.buyer_id = (select auth.uid())
         and o.status = 'paid'
    )
  );

create policy model_files_write_own on model_files
  for all to authenticated
  using (exists (select 1 from models m where m.id = model_files.model_id and m.designer_id = (select auth.uid())))
  with check (exists (select 1 from models m where m.id = model_files.model_id and m.designer_id = (select auth.uid())));

-- ────────────────────────────────── sales ───────────────────────────────────
-- Buyers see their own orders. Nobody writes orders from the client: money
-- moves through the service role after the payment provider confirms, so there
-- is deliberately no insert or update policy here.
create policy orders_read_own on orders
  for select to authenticated using (buyer_id = (select auth.uid()));

-- A line is visible to the buyer who paid for it and to the designer who earned
-- from it — the designer needs it for their sales dashboard.
create policy order_items_read on order_items
  for select to authenticated
  using (
    designer_id = (select auth.uid())
    or exists (select 1 from orders o where o.id = order_items.order_id and o.buyer_id = (select auth.uid()))
  );

create policy payouts_read_own on payouts
  for select to authenticated using (designer_id = (select auth.uid()));

-- ──────────────────────────────── engagement ────────────────────────────────
-- Saved models are private; no one else can read what you are considering.
create policy favorites_rw_own on favorites
  for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy reviews_read on reviews
  for select to anon, authenticated using (true);

-- You may only review a model you bought, and only as yourself.
create policy reviews_insert_purchased on reviews
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
        from order_items oi
        join orders o on o.id = oi.order_id
       where oi.model_id = reviews.model_id
         and o.buyer_id = (select auth.uid())
         and o.status = 'paid'
    )
  );

create policy reviews_update_own on reviews
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy reviews_delete_own on reviews
  for delete to authenticated
  using (author_id = (select auth.uid()));

-- ─────────────────────────────────── jobs ───────────────────────────────────
-- No policies at all: the queue belongs to the worker, which uses the service
-- role. RLS enabled with no policy denies every client, which is the intent.
