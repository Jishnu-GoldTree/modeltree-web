-- models.rating and models.review_count are derived from reviews, not written.
--
-- Both columns are read on every catalog card, by the "Top rated" sort, in the
-- product page header and on the designer dashboard, but nothing has ever
-- maintained them. The seed scripts wrote plausible-looking numbers straight
-- onto `models` and never inserted a single `reviews` row, so a listing could
-- advertise 23 reviews and then display none of them.
--
-- Keeping them as columns rather than computing on read is deliberate: the
-- catalog sorts and filters on rating across the whole table, and a correlated
-- aggregate there would cost a scan of reviews per page.

create or replace function refresh_model_rating() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare
  -- OLD is null on insert, NEW is null on delete. Nothing exposes a way to move
  -- a review between models, so a single target always covers the change.
  target uuid := coalesce(new.model_id, old.model_id);
begin
  update models m
     set rating = agg.average,
         review_count = agg.total
    from (
      select round(avg(rating), 1) as average,
             count(*)::int         as total
        from reviews
       where model_id = target
    ) agg
   where m.id = target;
  return null;
end;
$fn$;

-- security definer because the author of a review is a buyer, and models_update_own
-- only lets a designer write their own listing. Without it, every insert would
-- fail the moment the trigger touched `models`.

drop trigger if exists reviews_refresh_rating on reviews;
create trigger reviews_refresh_rating
  after insert or delete or update of rating on reviews
  for each row execute function refresh_model_rating();

-- Replace the seeded fiction with what the reviews table actually says. Models
-- with no reviews go to null/0, which is the honest answer and what the UI
-- already renders as "no rating yet".
--
-- Guarded by `is distinct from` so this only writes rows that actually change:
-- models carries an updated_at trigger, and touching every row would reorder
-- the designer dashboard for no reason.
update models m
   set rating = agg.average,
       review_count = agg.total
  from (
    select mm.id,
           round(avg(r.rating), 1) as average,
           count(r.id)::int        as total
      from models mm
      left join reviews r on r.model_id = mm.id
     group by mm.id
  ) agg
 where m.id = agg.id
   and (m.rating is distinct from agg.average
        or m.review_count is distinct from agg.total);
