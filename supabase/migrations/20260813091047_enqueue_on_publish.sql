-- Enqueue asset processing from the database, not the app.
--
-- The first attempt inserted into `jobs` from the server action. That was wrong
-- twice over: `jobs` is service-role only (RLS enabled, no policies), so the
-- insert silently failed and every publish produced no job; and even had it
-- worked, a second PostgREST call is a separate transaction — the whole point
-- of a Postgres-backed queue is that the job and the row that caused it commit
-- together or not at all.
--
-- As a trigger, enqueueing is genuinely atomic with the status change and needs
-- no client permissions at all.

create or replace function enqueue_asset_processing() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  -- Only on the transition into `processing`, so re-saving a listing that is
  -- already processing does not queue the work twice.
  if new.status = 'processing'
     and (tg_op = 'INSERT' or old.status is distinct from 'processing') then
    insert into jobs (kind, payload)
    values ('process_asset', jsonb_build_object('model_id', new.id));
  end if;
  return null;
end;
$fn$;

drop trigger if exists models_enqueue_processing on models;
create trigger models_enqueue_processing
  after insert or update of status on models
  for each row execute function enqueue_asset_processing();

-- Anything already sitting in `processing` never got a job; give it one.
insert into jobs (kind, payload)
select 'process_asset', jsonb_build_object('model_id', m.id)
  from models m
 where m.status = 'processing'
   and not exists (
     select 1 from jobs j
      where j.kind = 'process_asset'
        and j.payload ->> 'model_id' = m.id::text
   );
