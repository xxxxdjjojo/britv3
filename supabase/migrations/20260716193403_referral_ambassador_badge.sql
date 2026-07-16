-- Referral Ambassador is derived from durable provider conversions. Providers
-- may read badges but cannot mint or mutate trust/directory signals.

drop policy if exists provider_badges_insert_own on public.provider_badges;
drop policy if exists "provider_badges_insert_own" on public.provider_badges;
drop policy if exists provider_badges_update_own on public.provider_badges;
drop policy if exists "provider_badges_update_own" on public.provider_badges;
drop policy if exists provider_badges_delete_own on public.provider_badges;
drop policy if exists "provider_badges_delete_own" on public.provider_badges;
revoke insert, update, delete on table public.provider_badges from anon, authenticated;
grant select on table public.provider_badges to authenticated;
grant select, insert, update, delete on table public.provider_badges to service_role;

create unique index if not exists provider_badges_one_referral_ambassador
  on public.provider_badges(provider_id, badge_type)
  where badge_type = 'referral_ambassador';

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
  ) and (
    select count(*)
    from public.referrals r
    where r.referrer_id = new.referrer_id
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

drop trigger if exists referrals_sync_ambassador_badge on public.referrals;
create trigger referrals_sync_ambassador_badge
after insert or update of provider_state on public.referrals
for each row execute function public.sync_referral_ambassador_badge();

-- Providers who already crossed the threshold receive the same derived badge.
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
group by r.referrer_id
having count(*) >= 3
on conflict (provider_id, badge_type)
  where badge_type = 'referral_ambassador'
do update set is_active = true;

-- Prefer Ambassadors inside otherwise-equivalent directory results. The guard
-- keeps this additive migration compatible with installations that do not yet
-- expose the legacy search RPC.
do $migration$
begin
  if exists (
    select 1
    from pg_catalog.pg_proc procedure
    join pg_catalog.pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public' and procedure.proname = 'search_providers'
  ) then
    execute $search$
      create or replace function public.search_providers(
        p_service_category public.service_category default null,
        p_postcode text default null,
        p_lat double precision default null,
        p_lng double precision default null,
        p_radius_miles integer default 25,
        p_min_rating numeric default null,
        p_search_query text default null,
        p_limit integer default 20,
        p_offset integer default 0
      )
      returns table (
        provider_id uuid,
        business_name text,
        business_description text,
        services public.service_category[],
        average_rating numeric,
        review_count bigint,
        distance_miles numeric,
        slug text,
        avatar_url text,
        years_in_business integer,
        completed_jobs_count integer
      )
      language plpgsql
      stable
      set search_path = ''
      as $body$
      declare
        search_location public.geography;
        radius_meters integer;
      begin
        radius_meters := p_radius_miles * 1609;
        if p_lat is not null and p_lng is not null then
          search_location := public.st_setsrid(public.st_makepoint(p_lng, p_lat), 4326)::public.geography;
        end if;

        return query
        select
          spd.user_id,
          spd.business_name,
          spd.business_description,
          spd.services,
          coalesce(prs.average_rating, 0::numeric),
          coalesce(prs.total_reviews, 0::bigint),
          case when search_location is not null and spd.base_location is not null
            then round((public.st_distance(spd.base_location, search_location) / 1609)::numeric, 1)
            else null end,
          spd.slug,
          p.avatar_url,
          spd.years_in_business,
          spd.completed_jobs_count
        from public.service_provider_details spd
        join public.profiles p on spd.user_id = p.id
        left join public.provider_rating_stats prs on spd.user_id = prs.provider_id
        where p.provider_verification_status = 'verified'::public.provider_verification_status
          and p.deleted_at is null
          and (p_service_category is null or p_service_category = any(spd.services))
          and (search_location is null or spd.base_location is null
            or public.st_dwithin(spd.base_location, search_location, radius_meters)
            or p_postcode = any(spd.service_postcodes))
          and (p_min_rating is null or coalesce(prs.average_rating, 0) >= p_min_rating)
          and (p_search_query is null or public.to_tsvector('english',
            coalesce(spd.business_name, '') || ' ' || coalesce(spd.business_description, '')
          ) @@ public.plainto_tsquery('english', p_search_query))
        order by
          case when p_postcode = any(spd.service_postcodes) then 0 else 1 end,
          case when exists (
            select 1 from public.provider_badges pb
            where pb.provider_id = spd.user_id
              and pb.badge_type = 'referral_ambassador'
              and pb.is_active
          ) then 0 else 1 end,
          case when search_location is not null and spd.base_location is not null
            then public.st_distance(spd.base_location, search_location) else 999999999 end,
          coalesce(prs.average_rating, 0) desc,
          coalesce(prs.total_reviews, 0) desc
        limit p_limit offset p_offset;
      end;
      $body$;
    $search$;
  end if;
end;
$migration$;
