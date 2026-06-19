-- ============================================================================
-- market-map: pre-aggregated stats table + fast market_map_aggregate.
--
-- WHY: market_map_aggregate computed median/p10/p90 over ~13-22M price_paid_data
-- rows live, per request. Through PostgREST (8s statement_timeout) the national
-- aggregate timed out and the service silently returned an empty FeatureCollection
-- (blank choropleth). At national scale the path runs the aggregate TWICE (colour
-- domain + features), ~60s total — untenable for production traffic.
--
-- FIX: precompute per (geography_level, area_id, property_type, window_months)
-- into market_map_area_stats. market_map_aggregate becomes an indexed lookup
-- (<100ms). market_map_features already calls market_map_aggregate internally,
-- so both get fast from this one change. Refresh periodically (cron / manual).
--
-- Windows match the UI: 12 / 24 / 36 / 60 months. Property types: all + the
-- four filterable types (detached/semi-detached/terraced/flat). 'other' (O) is
-- folded into 'all' and the type mix but is never queried on its own.
-- ============================================================================

create table if not exists public.market_map_area_stats (
  geography_level         text   not null,
  area_id                 text   not null,
  area_name               text,
  property_type           text   not null,   -- all|detached|semi-detached|terraced|flat
  window_months           int    not null,   -- 12|24|36|60
  median_price_pence      bigint,
  p10_price_pence         bigint,
  p90_price_pence         bigint,
  transaction_count       bigint not null default 0,
  latest_transaction_date date,
  property_type_mix       jsonb  not null default '{}'::jsonb,
  refreshed_at            timestamptz not null default now(),
  primary key (geography_level, area_id, property_type, window_months)
);

-- Lookup index for the aggregate query (filter by level+type+window, all areas).
create index if not exists idx_mmas_level_type_window
  on public.market_map_area_stats (geography_level, property_type, window_months);

grant select on public.market_map_area_stats to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Refresh function — repopulates the whole table. Long-running; run in the
-- background. One table-scan per (level × window) via GROUPING SETS produces
-- both per-type and the 'all' rollup in a single pass.
-- ---------------------------------------------------------------------------
create or replace function public.refresh_market_map_area_stats()
returns void
language plpgsql
security definer
set statement_timeout = 0
as $$
declare
  v_level   text;
  v_window  int;
  v_levels  text[] := array['local_authority','postcode_district','msoa','lsoa'];
  v_windows int[]  := array[12,24,36,60];
begin
  truncate public.market_map_area_stats;

  foreach v_level in array v_levels loop
    foreach v_window in array v_windows loop
      insert into public.market_map_area_stats (
        geography_level, area_id, area_name, property_type, window_months,
        median_price_pence, p10_price_pence, p90_price_pence,
        transaction_count, latest_transaction_date, property_type_mix
      )
      with keyed as (
        select
          g.price_pence,
          g.transfer_date,
          g.property_type,
          case v_level
            when 'local_authority'   then g.lad_cd
            when 'postcode_district' then g.postcode_district
            when 'msoa'              then g.msoa_cd
            when 'lsoa'              then g.lsoa_cd
          end as grp_id,
          case v_level
            when 'local_authority'   then g.lad_name
            when 'postcode_district' then g.postcode_district
            when 'msoa'              then g.msoa_cd
            when 'lsoa'              then g.lsoa_cd
          end as grp_name
        from public.ppd_with_geography g
        where g.transfer_date >= (current_date - make_interval(months => v_window))
      ),
      -- per-area type mix over ALL types (matches live aggregate semantics)
      mix as (
        select grp_id,
          jsonb_object_agg(
            case property_type
              when 'D' then 'detached' when 'S' then 'semi-detached'
              when 'T' then 'terraced' when 'F' then 'flat' else 'other'
            end, cnt) as m
        from (
          select grp_id, property_type, count(*) cnt
          from keyed where grp_id is not null and grp_id <> ''
          group by grp_id, property_type
        ) t
        group by grp_id
      ),
      stats as (
        select
          grp_id,
          (array_agg(grp_name) filter (where grp_name is not null))[1] as grp_name,
          property_type as ptype_code,
          percentile_cont(0.5) within group (order by price_pence)::bigint as median_p,
          percentile_cont(0.1) within group (order by price_pence)::bigint as p10_p,
          percentile_cont(0.9) within group (order by price_pence)::bigint as p90_p,
          count(*)::bigint as tx_count,
          max(transfer_date) as latest_date
        from keyed
        where grp_id is not null and grp_id <> ''
        group by grouping sets ((grp_id, property_type), (grp_id))
      )
      select
        v_level,
        s.grp_id,
        s.grp_name,
        case
          when s.ptype_code is null then 'all'
          when s.ptype_code = 'D' then 'detached'
          when s.ptype_code = 'S' then 'semi-detached'
          when s.ptype_code = 'T' then 'terraced'
          when s.ptype_code = 'F' then 'flat'
        end,
        v_window,
        s.median_p, s.p10_p, s.p90_p, s.tx_count, s.latest_date,
        coalesce(mix.m, '{}'::jsonb)
      from stats s
      left join mix on mix.grp_id = s.grp_id
      -- keep 'all' rollup (ptype_code is null) + the four filterable types; drop 'O'
      where s.ptype_code is null or s.ptype_code in ('D','S','T','F');
    end loop;
  end loop;
end;
$$;

comment on function public.refresh_market_map_area_stats() is
  'Repopulates market_map_area_stats for all geography levels and the 12/24/36/60 '
  'month windows from ppd_with_geography. Long-running; run in background or via cron.';

-- ---------------------------------------------------------------------------
-- Rewrite market_map_aggregate to read the precompute table (indexed lookup).
-- Window is derived from the requested date span and snapped to the nearest
-- supported window. Same return signature as the original.
-- ---------------------------------------------------------------------------
create or replace function public.market_map_aggregate(
  p_level         text,
  p_property_type text default 'all',
  p_from_date     date default null,
  p_to_date       date default null
)
returns table (
  area_id                 text,
  area_name               text,
  geography_level         text,
  median_price_pence      bigint,
  p10_price_pence         bigint,
  p90_price_pence         bigint,
  transaction_count       bigint,
  latest_transaction_date date,
  property_type_mix       jsonb
)
language sql
stable
security invoker
as $$
  with w as (
    select case
      -- snap the requested span (months) to the nearest precomputed window
      when p_from_date is null or p_to_date is null then 36
      else (array[12,24,36,60])[
        (select i from (
          select i, abs(v - round((p_to_date - p_from_date) / 30.44)) d
          from unnest(array[12,24,36,60]) with ordinality as a(v, i)
        ) z order by d, i limit 1)
      ]
    end as months
  )
  select
    s.area_id, s.area_name, s.geography_level,
    s.median_price_pence, s.p10_price_pence, s.p90_price_pence,
    s.transaction_count, s.latest_transaction_date, s.property_type_mix
  from public.market_map_area_stats s, w
  where s.geography_level = p_level
    and s.property_type   = coalesce(p_property_type, 'all')
    and s.window_months   = w.months
  order by s.area_id;
$$;
