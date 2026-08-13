-- Splits public file metadata from the protected artifact.
--
-- model_files holds storage keys and is deliberately unreadable until you own
-- or have bought the model — that row is the paywall. But format names and file
-- sizes are things a buyer must see *before* paying: they are the "OBJ, FBX,
-- Blender" chips on every card and the "What you get" panel on the listing.
--
-- Keeping both in one table meant locking the artifact also hid the metadata,
-- so anonymous visitors saw no formats at all and filtering by format returned
-- nothing. These columns carry the public half; model_files keeps the private
-- half and its policy is unchanged.

alter table models
  add column if not exists formats text[] not null default '{}',
  -- [{ "format": "OBJ", "size_bytes": 12345 }, ...]
  add column if not exists file_summary jsonb not null default '[]'::jsonb;

-- Format filtering is `formats @> '{Blender}'`, which a GIN index answers
-- directly instead of joining to a table the reader cannot see.
create index if not exists models_formats_idx on models using gin (formats);

-- Keeps the public columns in step with the private table, so a later upload
-- pipeline cannot forget to update them.
create or replace function sync_model_file_metadata() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare
  target uuid := coalesce(new.model_id, old.model_id);
begin
  update models m
     set formats = coalesce((
           select array_agg(f.format order by f.format)
             from model_files f where f.model_id = target
         ), '{}'),
         file_summary = coalesce((
           select jsonb_agg(jsonb_build_object('format', f.format, 'size_bytes', f.size_bytes)
                            order by f.format)
             from model_files f where f.model_id = target
         ), '[]'::jsonb)
   where m.id = target;
  return null;
end;
$fn$;

drop trigger if exists model_files_sync on model_files;
create trigger model_files_sync
  after insert or update or delete on model_files
  for each row execute function sync_model_file_metadata();

-- Backfill everything already loaded.
update models m
   set formats = coalesce((
         select array_agg(f.format order by f.format)
           from model_files f where f.model_id = m.id
       ), '{}'),
       file_summary = coalesce((
         select jsonb_agg(jsonb_build_object('format', f.format, 'size_bytes', f.size_bytes)
                          order by f.format)
           from model_files f where f.model_id = m.id
       ), '[]'::jsonb);
