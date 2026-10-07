-- Reference data: the taxonomy and licence tiers the app already assumes.
-- Idempotent so re-running a migration set against a live database is safe.

insert into licenses (code, label, blurb, price_multiplier, position) values
  ('royalty-free', 'Royalty-free', 'One seat. Commercial use in games, film and visualisation.', 1.00, 0),
  ('editorial',    'Editorial use', 'Editorial and non-commercial use. One seat.',                 1.00, 1),
  ('extended',     'Extended commercial', 'Unlimited seats, resale in end products, and merchandising.', 2.50, 2)
on conflict (code) do update
  set label = excluded.label,
      blurb = excluded.blurb,
      price_multiplier = excluded.price_multiplier,
      position = excluded.position;

-- Mirrors ASSET_CATEGORIES / PRINT_CATEGORIES in lib/data/landing.ts. Once the
-- app reads categories from here, that constant goes away.
insert into categories (slug, label, kind, position) values
  ('exterior',   'Exterior',           'asset', 0),
  ('car',        'Car',                'asset', 1),
  ('aircraft',   'Aircraft',           'asset', 2),
  ('furniture',  'Furniture',          'asset', 3),
  ('military',   'Military',           'asset', 4),
  ('character',  'Character',          'asset', 5),
  ('animal',     'Animal',             'asset', 6),
  ('plant',      'Plant',              'asset', 7),
  ('food',       'Food',               'asset', 8),
  ('art',        'Art',                'print', 0),
  ('games-toys', 'Games & Toys',       'print', 1),
  ('jewelry',    'Jewelry',            'print', 2),
  ('miniatures', 'Miniatures',         'print', 3),
  ('hobby-diy',  'Hobby & DIY',        'print', 4),
  ('fashion',    'Fashion',            'print', 5),
  ('buildings',  'Buildings',          'print', 6),
  ('house',      'House',              'print', 7),
  ('tools',      'Tools & Organizers', 'print', 8)
on conflict (slug) do update
  set label = excluded.label,
      kind = excluded.kind,
      position = excluded.position;
