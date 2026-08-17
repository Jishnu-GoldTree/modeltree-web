-- Publishing no longer waits on an asset pipeline.
--
-- `processing` existed for a worker that would render preview images from the
-- uploaded CAD file. Direct-to-R2 uploads removed that job: designers now
-- upload their own previews and the catalog reads `model_images` straight off
-- the listing. What was left of `process_asset` was a handful of HEAD requests
-- to confirm the bytes arrived — cheap enough to do inline in the server
-- action, and better there, because a failed upload becomes an error the
-- designer can act on rather than a listing stuck in a status nothing clears.
--
-- The `jobs` table and `claim_jobs()` stay. They are still the right shape for
-- work that genuinely has to happen out of band (subscription renewals, mail),
-- and the trigger is the only thing being retired.

drop trigger if exists models_enqueue_processing on models;
drop function if exists enqueue_asset_processing();

-- Nothing will ever move these along now, and each one is a listing whose
-- designer pressed Publish and got silence: `processing` is excluded from every
-- catalog query. Resolve them by what they actually have.

-- Backed by at least one file, and carrying the fields the published check
-- constraint demands, so it can go live. Their bytes predate verification, so
-- this trusts the upload the same way the old code did.
update models m
   set status = 'published',
       published_at = coalesce(m.published_at, m.updated_at, m.created_at)
 where m.status = 'processing'
   and m.description is not null
   and m.category_id is not null
   and exists (select 1 from model_files f where f.model_id = m.id);

-- Everything else never had a deliverable, so it was never publishable. Back to
-- draft, where the designer can see and finish it.
update models
   set status = 'draft'
 where status = 'processing';

-- Queued work for a job kind that no longer has a consumer.
delete from jobs
 where kind = 'process_asset'
   and status in ('queued', 'running');
