/**
 * Phase 1: GoldTree is the only seller. Designer accounts are granted, not
 * self-selected.
 *
 * Until now `account_type` was the user's to choose: sign-up metadata set it
 * (handle_new_user copies `raw_user_meta_data ->> 'account_type'`) and
 * `profiles_update_own` let anyone flip their own row. With checkout taking
 * real money, that would let any visitor publish a listing whose revenue is
 * booked to GoldTree. Hiding the radio buttons isn't enough — both paths are
 * reachable straight through the Data API — so the rule lives here.
 *
 *   - insert: a designer row from anyone but the service role becomes a buyer.
 *     This covers sign-up, which reaches the trigger through GoTrue with no
 *     request role at all.
 *   - update: only the service role may change `account_type`. Everyone keeps
 *     editing the rest of their profile as before.
 *
 * Granting a designer: the admin app or `scripts/grant-designer.mjs`, both
 * service role. Existing designer rows are untouched.
 *
 * Phase 2 (outside designers) should replace this with an application and
 * approval flow, not drop it — onboarding a seller needs KYC and payout details
 * anyway.
 */

create or replace function public.guard_account_type()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if (select auth.role()) = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.account_type = 'designer' then
      new.account_type := 'buyer';
    end if;
  elsif new.account_type is distinct from old.account_type then
    raise exception 'account_type can only be changed by an administrator'
      using errcode = '42501';
  end if;

  return new;
end;
$fn$;

revoke execute on function public.guard_account_type() from public, anon, authenticated;

drop trigger if exists profiles_guard_account_type on public.profiles;
create trigger profiles_guard_account_type
  before insert or update of account_type on public.profiles
  for each row execute function public.guard_account_type();

-- ── Listings need a designer account ───────────────────────────────────────
-- models_insert_own only checked `designer_id = auth.uid()`, so any signed-in
-- buyer could create a listing in their own name. Publishing is direct (no
-- moderation pipeline), so that listing would go live and sell. The account
-- type is now trustworthy, so the policy can lean on it.

drop policy if exists models_insert_own on public.models;
create policy models_insert_own on public.models
  for insert to authenticated
  with check (designer_id = (select auth.uid()) and (select public.is_designer()));
