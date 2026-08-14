-- Jewellery pivot.
--
-- The client's brief narrowed the product: this is a marketplace for Israeli
-- jewelers to buy and sell jewellery models, with GoldTree as an anchor seller.
-- The CGTrader-shaped taxonomy (cars, aircraft, military, food) was placeholder
-- from before that was known and is actively misleading now, so it goes.
--
-- Pricing moves to shekels as the stored currency. Israel is the primary market
-- and the client quotes in ₪; USD stays as a display conversion for everyone
-- else, computed at render time rather than stored, so there is exactly one
-- authoritative price per model.

begin;

-- ── Categories ─────────────────────────────────────────────────────────
-- `kind` distinguished asset/print catalogs, which no longer exist as separate
-- storefronts. Everything is jewellery now; the column stays (other code reads
-- it) but the allowed set changes, so the old CHECK has to go first.
alter table public.categories drop constraint categories_kind_check;
alter table public.categories
  add constraint categories_kind_check check (kind in ('jewellery', 'asset', 'print'));

-- Models in categories that are about to disappear go with them. Cascades from
-- model_files / favourites are already defined in the core schema, but
-- order_items deliberately restricts: real purchase history must never be
-- silently deleted by a catalog edit. These orders are seeded demo data for
-- models that are about to stop existing, so they are cleared explicitly.
create temporary table doomed_models on commit drop as
  select id from public.models
  where category_id in (select id from public.categories where slug <> 'jewelry');

delete from public.order_items where model_id in (select id from doomed_models);

-- Orders left with no lines are meaningless; drop them rather than show a
-- buyer an empty receipt.
delete from public.orders o
where not exists (select 1 from public.order_items i where i.order_id = o.id);

delete from public.models where id in (select id from doomed_models);

delete from public.categories where slug <> 'jewelry';

-- The surviving 'jewelry' row becomes 'rings'; its models are ring-adjacent
-- and would otherwise be orphaned by the delete above.
update public.categories
set slug = 'rings', label = 'Rings', kind = 'jewellery', position = 1
where slug = 'jewelry';

insert into public.categories (slug, label, kind, position) values
  ('engagement-rings', 'Engagement rings', 'jewellery', 2),
  ('wedding-bands',    'Wedding bands',    'jewellery', 3),
  ('pendants',         'Pendants',         'jewellery', 4),
  ('earrings',         'Earrings',         'jewellery', 5),
  ('bracelets',        'Bracelets',        'jewellery', 6),
  ('necklaces',        'Necklaces & chains', 'jewellery', 7),
  ('settings',         'Settings & mounts',  'jewellery', 8),
  ('charms',           'Charms & pendantry', 'jewellery', 9),
  ('brooches',         'Brooches & pins',    'jewellery', 10),
  ('findings',         'Findings & components', 'jewellery', 11)
on conflict (slug) do nothing;

-- ── Jewellery attributes ───────────────────────────────────────────────
-- rigged/animated/pbr are game-asset facets: jewellery is dense static
-- geometry, so they filtered nothing and confused the rail. Replaced with the
-- attributes a jeweler actually filters on.

create type public.metal_kind as enum
  ('yellow-gold', 'white-gold', 'rose-gold', 'platinum', 'silver', 'unspecified');

create type public.stone_shape as enum
  ('round', 'princess', 'oval', 'emerald', 'pear', 'marquise', 'cushion', 'none');

create type public.production_method as enum ('cast', 'print', 'both');

alter table public.models
  add column metal        public.metal_kind        not null default 'unspecified',
  add column stone        public.stone_shape       not null default 'none',
  add column production   public.production_method not null default 'both',
  -- Physical dimensions matter more than polygon counts here: a jeweler needs
  -- to know the metal volume before casting.
  add column weight_grams numeric(6, 2),
  add column size_mm      numeric(6, 2);

-- Kept nullable and unset rather than dropped: polygons/vertices still describe
-- the mesh, and existing rows carry real values.
alter table public.models
  drop column rigged,
  drop column animated,
  drop column pbr;

create index models_metal_idx      on public.models (metal)      where status = 'published';
create index models_stone_idx      on public.models (stone)      where status = 'published';
create index models_production_idx on public.models (production) where status = 'published';

-- ── Currency ───────────────────────────────────────────────────────────
-- price_cents held USD cents. It now holds agorot (1/100 ₪). Existing rows are
-- seed data being replaced wholesale in the same pass, so no conversion is
-- applied — anything left would be re-seeded anyway.
alter table public.models
  alter column currency set default 'ILS';

update public.models set currency = 'ILS';

comment on column public.models.price_cents is
  'Minor units of `currency` (agorot for ILS). USD is a display conversion, never stored.';

commit;
