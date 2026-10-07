-- Keyword tags for search discovery.
--
-- Free-text search only matched models.title, which misses the words buyers
-- actually type — "engagement", "solitaire", "cuban", "vintage" — that rarely
-- live in a title. Tags are the designer-supplied keyword set the catalog can
-- also match on, and each doubles as a browsable filter (?tag=…).
--
-- Stored as a text[] on models, mirroring the `formats` column: a GIN index
-- answers `tags @> '{engagement}'` directly, so both the exact-tag filter and
-- the search overlap read one index instead of joining a side table. Written
-- straight by the listing action (already lowercased and de-duplicated there),
-- unlike `formats`, which a trigger mirrors off model_files.

alter table models
  add column if not exists tags text[] not null default '{}';

-- Backstop the app-side cap (12) so a rogue insert can't store an unbounded
-- array. cardinality() is immutable, so it is allowed in a check constraint.
alter table models
  drop constraint if exists models_tags_bounded,
  add constraint models_tags_bounded check (cardinality(tags) <= 20);

create index if not exists models_tags_idx on models using gin (tags);
