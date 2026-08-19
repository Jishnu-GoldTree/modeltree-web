-- Rework licensing for the jewellery domain. The original tiers were lifted
-- from generic 3D-asset stores (royalty-free / editorial / extended) and their
-- copy spoke about games, film and merchandising. Buyers here cast or print
-- and sell finished pieces, so the split that matters is scale of production,
-- not media usage. This collapses the base tiers into one "Standard
-- commercial" and keeps an "Extended commercial" upgrade; the non-commercial
-- "editorial" tier is retired.
--
-- Idempotent and non-destructive: retired rows stay in `licenses` because
-- order_items.license_code references them, so historical invoices must keep
-- resolving. An `active` flag hides them from new listings instead.

alter table licenses
  add column if not exists active boolean not null default true;

insert into licenses (code, label, blurb, price_multiplier, position, active) values
  ('standard', 'Standard commercial', 'For one workshop. Cast or print and sell the finished pieces you make.', 1.00, 0, true),
  ('extended', 'Extended commercial', 'For multiple benches or production at scale, with resale of the finished pieces.', 2.50, 1, true)
on conflict (code) do update
  set label            = excluded.label,
      blurb            = excluded.blurb,
      price_multiplier = excluded.price_multiplier,
      position         = excluded.position,
      active           = excluded.active;

-- Repoint every live listing off the retired tiers before hiding them, so no
-- published model points at an inactive licence.
update models
  set license_code = 'standard'
  where license_code in ('royalty-free', 'editorial');

alter table models
  alter column license_code set default 'standard';

-- Kept for referential integrity with historical order_items, but no longer
-- offered on new listings.
update licenses set active = false where code in ('royalty-free', 'editorial');
