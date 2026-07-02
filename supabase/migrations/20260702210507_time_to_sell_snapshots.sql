-- ============================================================================
-- time_to_sell_snapshots — Influence Strategy Phase 2, Campaign 3.
--
-- Median days from listing to completion, computed ONLY from confirmed
-- PPD↔listing matched pairs (ppd_match_candidates.status = 'confirmed'):
-- completion date = ppd_transactions.transfer_date, start = listings.listed_date.
-- Districts ship only where the matched sample clears the disclosed threshold;
-- everything else stays suppressed (coverage is shown honestly on the page).
--
-- PERIOD FORMAT: '<YYYY>-Q<n>' (e.g. '2026-Q2'), same as reality_gap_snapshots.
-- All source tables are repo migrations (20260612000003_truedeed_ppd.sql), so
-- no to_regclass guard is needed. Currently 0 confirmed matches exist on prod:
-- the function then writes a single suppressed zero-sample national row, never
-- errors.
-- ============================================================================

create table if not exists public.time_to_sell_snapshots (
  period              text        not null,   -- '2026-Q2'
  area_level          text        not null check (area_level in ('national', 'district')),
  area_id             text        not null,   -- 'uk' for national; district otherwise
  area_name           text,
  median_days         int,
  sample_n            int         not null default 0,
  suppressed          boolean     not null default true,
  methodology_version int         not null default 1,
  refreshed_at        timestamptz not null default now(),
  primary key (period, area_level, area_id)
);

comment on table public.time_to_sell_snapshots is
  'Quarterly median listing-to-completion days from confirmed PPD-matched '
  'pairs (Time-to-Sell tracker). Rows with suppressed = true fail the '
  'disclosed sample threshold and must not be displayed as figures.';

alter table public.time_to_sell_snapshots enable row level security;

drop policy if exists time_to_sell_snapshots_public_read on public.time_to_sell_snapshots;
create policy time_to_sell_snapshots_public_read
  on public.time_to_sell_snapshots
  for select
  to anon, authenticated
  using (true);

grant select on public.time_to_sell_snapshots to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Refresh — one period at a time (delete-then-insert for that period only).
-- SUPPRESSION THRESHOLD (disclosed on the methodology page): sample_n < 15.
-- ---------------------------------------------------------------------------

create or replace function public.refresh_time_to_sell_snapshots(p_period text default null)
returns void
language plpgsql
security definer
set search_path = public
set statement_timeout = 0
as $$
declare
  c_min_pairs constant int := 15;  -- disclosed suppression threshold

  v_period text := coalesce(p_period, to_char(current_date, 'YYYY') || '-Q' || to_char(current_date, 'Q'));
  v_from   date := current_date - interval '12 months';
begin
  delete from public.time_to_sell_snapshots where period = v_period;

  insert into public.time_to_sell_snapshots (
    period, area_level, area_id, area_name, median_days, sample_n, suppressed
  )
  with pairs as (
    select
      t.district,
      (t.transfer_date - l.listed_date) as days_to_sell
    from public.ppd_match_candidates m
    join public.listings l on l.id = m.listing_id
    join public.ppd_transactions t on t.ppd_tuid = m.ppd_tuid
    where m.status = 'confirmed'
      and t.transfer_date >= v_from
      and l.listed_date is not null
      and t.transfer_date >= l.listed_date   -- guard bad matches / data entry
  ),
  national as (
    select
      percentile_cont(0.5) within group (order by days_to_sell)::int as median_days,
      count(*)::int as n
    from pairs
  ),
  districts as (
    select
      district,
      percentile_cont(0.5) within group (order by days_to_sell)::int as median_days,
      count(*)::int as n
    from pairs
    where district is not null
    group by district
  )
  select v_period, 'national', 'uk', 'United Kingdom',
         case when n > 0 then median_days end, coalesce(n, 0), (coalesce(n, 0) < c_min_pairs)
  from national
  union all
  select v_period, 'district', lower(replace(district, ' ', '-')), initcap(district),
         median_days, n, (n < c_min_pairs)
  from districts;
end;
$$;

comment on function public.refresh_time_to_sell_snapshots(text) is
  'Recomputes time_to_sell_snapshots for one quarter (default: current). '
  'Confirmed PPD-matched pairs only; districts below the disclosed sample '
  'threshold stay suppressed. Service-role only.';

revoke execute on function public.refresh_time_to_sell_snapshots(text)
from public, anon, authenticated;
grant execute on function public.refresh_time_to_sell_snapshots(text)
to service_role;
