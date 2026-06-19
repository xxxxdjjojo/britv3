-- ============================================================================
-- market-map: 'house' rollup + baked national price buckets + data_version.
--
-- WHY: the instant area card needs (a) a single combined "house" price band
-- (detached/semi-detached/terraced) that is its OWN percentile over D/S/T — not
-- an average of the per-type rows and never contaminated by flats — and (b) a
-- precomputed national decile bucket per (level, property_type, window) so the
-- map/card can colour an area instantly without a ranking query at request time.
-- A 1-row meta table exposes a data_version string so the vector-tile cache can
-- bust itself whenever the precompute is refreshed.
--
-- CHANGES:
--   1. market_map_area_stats gains a nullable `bucket smallint` (1..9 ntile).
--   2. New singleton table market_map_meta(data_version) (public-read).
--   3. refresh_market_map_area_stats() reproduces the prior body, then ALSO
--      emits a 'house' rollup row per (level, window), and after both loops
--      bakes the national ntile(9) buckets and stamps market_map_meta.
--
-- ROLLBACK: drop column market_map_area_stats.bucket, drop table
-- market_map_meta, and re-apply 20260619000001_market_map_precompute.sql to
-- restore the prior refresh_market_map_area_stats() body.
-- ============================================================================

-- 1. national-bucket column on the precompute table.
alter table public.market_map_area_stats add column if not exists bucket smallint;

-- 2. singleton meta table for the tile-cache data version.
create table if not exists public.market_map_meta (
  id boolean primary key default true,
  data_version text not null,
  constraint market_map_meta_singleton check (id)
);
insert into public.market_map_meta (id, data_version)
  values (true, 'init') on conflict (id) do nothing;
grant select on public.market_map_meta to anon, authenticated, service_role;

-- 3. refresh function: prior body + 'house' rollup + bucket pass + version stamp.
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
  -- DELETE (not TRUNCATE): the table now serves live card/tile reads. TRUNCATE
  -- takes ACCESS EXCLUSIVE and would block every reader for the full ~17-min
  -- rebuild. DELETE takes only ROW EXCLUSIVE, so concurrent SELECTs keep seeing
  -- the prior rows via MVCC and flip atomically to the new set at commit — reads
  -- never block and there is no empty window.
  delete from public.market_map_area_stats;

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

      -- 'house' rollup: own percentile over D/S/T, never derived from all/flat.
      insert into public.market_map_area_stats (
        geography_level, area_id, area_name, property_type, window_months,
        median_price_pence, p10_price_pence, p90_price_pence,
        transaction_count, latest_transaction_date, property_type_mix)
      with keyed as (
        select g.price_pence, g.transfer_date,
          case v_level
            when 'local_authority' then g.lad_cd
            when 'postcode_district' then g.postcode_district
            when 'msoa' then g.msoa_cd when 'lsoa' then g.lsoa_cd end as grp_id,
          case v_level
            when 'local_authority' then g.lad_name
            when 'postcode_district' then g.postcode_district
            when 'msoa' then g.msoa_cd when 'lsoa' then g.lsoa_cd end as grp_name
        from public.ppd_with_geography g
        where g.transfer_date >= (current_date - make_interval(months => v_window))
          and g.property_type in ('D','S','T'))
      select v_level, grp_id,
        (array_agg(grp_name) filter (where grp_name is not null))[1],
        'house', v_window,
        percentile_cont(0.5) within group (order by price_pence)::bigint,
        percentile_cont(0.1) within group (order by price_pence)::bigint,
        percentile_cont(0.9) within group (order by price_pence)::bigint,
        count(*)::bigint, max(transfer_date), '{}'::jsonb
      from keyed where grp_id is not null and grp_id <> '' group by grp_id;
    end loop;
  end loop;

  update public.market_map_area_stats s set bucket = b.nt
  from (select geography_level, area_id, property_type, window_months,
          ntile(9) over (partition by geography_level, property_type, window_months
                         order by median_price_pence) as nt
        from public.market_map_area_stats where transaction_count >= 5) b
  where s.geography_level = b.geography_level and s.area_id = b.area_id
    and s.property_type = b.property_type and s.window_months = b.window_months;

  update public.market_map_meta set data_version =
    to_char(clock_timestamp(), 'YYYYMMDD"T"HH24MISS') where id;
end;
$$;

comment on function public.refresh_market_map_area_stats() is
  'Repopulates market_map_area_stats for all geography levels and the 12/24/36/60 '
  'month windows from ppd_with_geography. Long-running; run in background or via cron.';
