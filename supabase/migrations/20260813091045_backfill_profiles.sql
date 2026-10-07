-- Backfill profiles for accounts created before the on_auth_user_created
-- trigger existed. The trigger only fires on insert, so every user who signed
-- up earlier has no profile row — and every query that joins profiles would
-- silently return nothing for them.
--
-- Idempotent: only touches users with no profile, so it is safe to re-run.

do $do$
declare
  u            record;
  base_handle  text;
  final_handle text;
  suffix       int;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data
      from auth.users au
      left join profiles p on p.id = au.id
     where p.id is null
     order by au.created_at
  loop
    base_handle := regexp_replace(lower(split_part(u.email, '@', 1)), '[^a-z0-9]+', '', 'g');
    if base_handle = '' then
      base_handle := 'user';
    end if;

    suffix := 0;
    final_handle := base_handle;
    while exists (select 1 from profiles where handle = final_handle) loop
      suffix := suffix + 1;
      final_handle := base_handle || suffix::text;
    end loop;

    insert into profiles (id, handle, full_name, account_type)
    values (
      u.id,
      final_handle,
      u.raw_user_meta_data ->> 'full_name',
      coalesce((u.raw_user_meta_data ->> 'account_type')::account_type, 'buyer')
    );
  end loop;
end;
$do$;
