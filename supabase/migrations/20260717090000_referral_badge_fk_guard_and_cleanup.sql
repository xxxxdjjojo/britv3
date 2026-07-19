-- Ambassador badge writes target provider_badges.provider_id, which FK-references
-- service_provider_details(user_id). Referral codes can be held by ANY user, so a
-- non-provider referrer reaching the third converted conversion made the badge
-- INSERT violate that FK and roll back the entire credit-issuance transaction.
-- Gate every badge write on the referrer actually owning a provider row, so a
-- non-provider conversion now succeeds (just without a badge).

create or replace function public.sync_referral_ambassador_badge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.provider_state in (
    'converted'::public.referral_status,
    'credited'::public.referral_status
  ) and exists (
    select 1
    from public.service_provider_details spd
    where spd.user_id = new.referrer_id
  ) and (
    select count(*)
    from public.referrals r
    where r.referrer_id = new.referrer_id
      and r.track = 'trade_to_trade'::public.referral_track
      and r.provider_state in (
        'converted'::public.referral_status,
        'credited'::public.referral_status
      )
  ) >= 3 then
    insert into public.provider_badges(
      provider_id, badge_type, badge_label, description, is_active
    ) values (
      new.referrer_id,
      'referral_ambassador',
      'Ambassador',
      'Three provider referrals converted after their first paid invoice.',
      true
    )
    on conflict (provider_id, badge_type)
      where badge_type = 'referral_ambassador'
    do update set is_active = true;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_referral_ambassador_badge() from public, anon, authenticated;

-- Re-run the one-shot backfill with the same provider-row guard, so any
-- qualifying referrer that lacks a service_provider_details row is skipped
-- instead of aborting the backfill on the FK violation.
insert into public.provider_badges(
  provider_id, badge_type, badge_label, description, is_active
)
select
  r.referrer_id,
  'referral_ambassador',
  'Ambassador',
  'Three provider referrals converted after their first paid invoice.',
  true
from public.referrals r
where r.provider_state in (
  'converted'::public.referral_status,
  'credited'::public.referral_status
)
  and r.track = 'trade_to_trade'::public.referral_track
  and exists (
    select 1
    from public.service_provider_details spd
    where spd.user_id = r.referrer_id
  )
group by r.referrer_id
having count(*) >= 3
on conflict (provider_id, badge_type)
  where badge_type = 'referral_ambassador'
do update set is_active = true;

-- Drop the now-inert insert policy on referrals. A later migration revoked
-- insert/update on referrals from authenticated, so this policy can never grant
-- access; removing it keeps the RLS surface honest.
drop policy if exists "Users can insert referrals for themselves" on public.referrals;
