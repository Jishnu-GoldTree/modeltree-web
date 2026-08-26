-- Compute-pressure fixes flagged by the Supabase advisor.
--
-- Two lints, both real:
--
--   1. Foreign keys with no covering index. When a parent row is deleted or
--      updated Postgres has to sequential-scan the child table to enforce the
--      constraint, and any join or filter on the FK column does the same. On the
--      hot paths that is wasted CPU.
--
--   2. More than one permissive policy for the same {role, command}. Permissive
--      policies OR together, so every one is evaluated on every matching row.
--      The `for all` write policies here each overlap the table's dedicated
--      read policy on SELECT, doubling per-row policy cost for authenticated
--      reads. Splitting the write policy into INSERT/UPDATE/DELETE leaves each
--      command with exactly one policy; access is unchanged because the read
--      policy already grants the owner SELECT.

begin;

-- ── 1. Covering indexes for foreign keys ────────────────────────────────
-- Only the FKs whose column is not already the leftmost column of some index.
-- license_code / *_id columns that already sit under a composite unique key or
-- a matching partial index are deliberately omitted.

create index if not exists models_license_code_idx
  on public.models (license_code);

create index if not exists order_items_license_code_idx
  on public.order_items (license_code);

create index if not exists favorites_model_id_idx
  on public.favorites (model_id);

create index if not exists reviews_author_id_idx
  on public.reviews (author_id);

create index if not exists admin_users_granted_by_idx
  on public.admin_users (granted_by);

create index if not exists admin_audit_log_actor_id_idx
  on public.admin_audit_log (actor_id);

create index if not exists requests_model_id_idx
  on public.requests (model_id);

-- ── 2. Collapse overlapping permissive policies ─────────────────────────

-- model_files: the `for all` policy overlapped model_files_read on SELECT.
-- Owner SELECT is still granted by model_files_read (owner OR paid buyer), so
-- dropping the SELECT arm changes nothing.
drop policy if exists model_files_write_own on public.model_files;

create policy model_files_insert_own on public.model_files
  for insert to authenticated
  with check (exists (
    select 1 from public.models m
    where m.id = model_files.model_id and m.designer_id = (select auth.uid())
  ));

create policy model_files_update_own on public.model_files
  for update to authenticated
  using (exists (
    select 1 from public.models m
    where m.id = model_files.model_id and m.designer_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.models m
    where m.id = model_files.model_id and m.designer_id = (select auth.uid())
  ));

create policy model_files_delete_own on public.model_files
  for delete to authenticated
  using (exists (
    select 1 from public.models m
    where m.id = model_files.model_id and m.designer_id = (select auth.uid())
  ));

-- model_images: same overlap with model_images_read on SELECT.
drop policy if exists model_images_write_own on public.model_images;

create policy model_images_insert_own on public.model_images
  for insert to authenticated
  with check (exists (
    select 1 from public.models m
    where m.id = model_images.model_id and m.designer_id = (select auth.uid())
  ));

create policy model_images_update_own on public.model_images
  for update to authenticated
  using (exists (
    select 1 from public.models m
    where m.id = model_images.model_id and m.designer_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.models m
    where m.id = model_images.model_id and m.designer_id = (select auth.uid())
  ));

create policy model_images_delete_own on public.model_images
  for delete to authenticated
  using (exists (
    select 1 from public.models m
    where m.id = model_images.model_id and m.designer_id = (select auth.uid())
  ));

-- requests: two permissive UPDATE policies become one. The combined predicate
-- is the OR of the originals, which is exactly how permissive policies already
-- evaluated together, so buyer and designer update rights are unchanged.
drop policy if exists requests_update_buyer   on public.requests;
drop policy if exists requests_update_designer on public.requests;

create policy requests_update on public.requests
  for update to authenticated
  using (
    (buyer_id = (select auth.uid()) and status in ('open', 'quoted'))
    or public.is_designer()
  )
  with check (
    buyer_id = (select auth.uid())
    or public.is_designer()
  );

commit;
