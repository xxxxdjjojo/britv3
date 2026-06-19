-- ============================================================================
-- market_map_aggregation — Price-paid aggregation layer for the market-map
-- choropleth feature.
--
-- Depends on:
--   • public.ppd_transactions   (20260612000003_truedeed_ppd.sql)
--   • public.postcode_geography (20260616000001_postcode_geography.sql)
--   • public.geography_boundaries (20260616000002_geography_boundaries.sql)
--
-- HOW TO RUN LATER (once Task 5 ingest has populated postcode_geography and
-- geography_boundaries):
--
--   supabase db push
--   -- or via psql:
--   psql "$DATABASE_URL" -f supabase/migrations/20260616000003_market_map_aggregation.sql
--
-- NOTE: ppd_with_geography will be empty until Task 5 has ingested ONSPD data.
-- The functions are safe to call on an empty set — they return 0 rows.
--
-- Prices are kept in PENCE throughout the SQL layer. The service layer
-- (Task 6, src/lib/market-map/) divides by 100 for display.
--
-- Confidence thresholds (applied in the TypeScript service, NOT here):
--   High         >= 30 transactions
--   Medium       >= 10
--   Low          >=  5
--   Insufficient  < 5  (greyed-out on map; still returned by aggregate fn)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Support indexes on ppd_transactions
--    ppd_transactions.postcode is un-normalised; we join via expression.
--    transfer_date index supports the date-window filter.
-- ---------------------------------------------------------------------------

create index if not exists idx_ppd_transactions_postcode_normalised
  on public.ppd_transactions
  using btree (upper(replace(postcode, ' ', '')));

create index if not exists idx_ppd_transactions_transfer_date
  on public.ppd_transactions using btree (transfer_date);

-- ---------------------------------------------------------------------------
-- 2. View: ppd_with_geography
--    Joins PPD transactions to postcode_geography via normalised postcode.
--    Filters: postcode not null/empty, price > 0, not deleted (status != 'D').
--    The inner join implicitly excludes postcodes that failed to geo-join.
-- ---------------------------------------------------------------------------

create or replace view public.ppd_with_geography as
select
  t.price_pence,
  t.transfer_date,
  t.property_type,
  t.new_build,
  t.street,
  t.town,
  -- normalised street key for street-level grouping
  lower(trim(coalesce(t.street, ''))) || '|' || lower(trim(coalesce(t.town, ''))) as street_key,
  g.lad_cd,
  g.lad_name,
  g.postcode_district,
  g.msoa_cd,
  g.lsoa_cd,
  g.postcode_sector,
  g.latitude,
  g.longitude
from public.ppd_transactions t
join public.postcode_geography g
  on upper(replace(t.postcode, ' ', '')) = g.postcode_normalised
where
  t.postcode is not null
  and trim(t.postcode) <> ''
  and t.price_pence > 0
  and coalesce(t.last_record_status, 'A') <> 'D';

comment on view public.ppd_with_geography is
  'HMLR PPD transactions joined to ONS postcode geography. '
  'Excludes null/empty postcodes, zero/negative prices, and deleted records (last_record_status=D). '
  'Failed geo-joins are excluded by the inner join. Prices in pence.';

-- ---------------------------------------------------------------------------
-- 3. Function: market_map_aggregate
--    Returns per-area price statistics for the market-map choropleth.
--
--    p_level           — aggregation level (see geography_boundaries.level)
--    p_property_type   — 'all' | 'detached' | 'semi-detached' | 'terraced' | 'flat'
--    p_from_date       — start of date window (inclusive); NULL = derived from p_to_date
--    p_to_date         — end of date window (inclusive); NULL = today
--    Default window when both NULL: last 36 months.
--
--    Returns ALL groups including count < 5; confidence grading is done in
--    the TypeScript service layer.
-- ---------------------------------------------------------------------------

create or replace function public.market_map_aggregate(
  p_level         text,
  p_property_type text    default 'all',
  p_from_date     date    default null,
  p_to_date       date    default null
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
language plpgsql
stable
security invoker
as $$
declare
  v_ppd_type  text;
  v_from_date date;
  v_to_date   date;
begin
  -- Validate level early so the caller gets a clear error
  if p_level not in (
    'local_authority', 'postcode_district', 'msoa',
    'lsoa', 'postcode_sector', 'street'
  ) then
    raise exception
      'market_map_aggregate: unknown level ''%''. '
      'Must be one of: local_authority, postcode_district, msoa, lsoa, postcode_sector, street.',
      p_level;
  end if;

  -- Resolve date window
  v_to_date   := coalesce(p_to_date, current_date);
  v_from_date := coalesce(p_from_date, v_to_date - interval '36 months');

  -- Map friendly property-type label to PPD single-character code
  v_ppd_type := case p_property_type
    when 'detached'      then 'D'
    when 'semi-detached' then 'S'
    when 'terraced'      then 'T'
    when 'flat'          then 'F'
    else null   -- null = no filter (covers 'all' and any unrecognised value)
  end;

  return query
  with

  -- Annotate each transaction with its grouping key and display name
  keyed as (
    select
      g.price_pence,
      g.transfer_date,
      g.property_type,
      case p_level
        when 'local_authority'   then g.lad_cd
        when 'postcode_district' then g.postcode_district
        when 'msoa'              then g.msoa_cd
        when 'lsoa'              then g.lsoa_cd
        when 'postcode_sector'   then g.postcode_sector
        when 'street'            then g.street_key
      end as grp_id,
      case p_level
        when 'local_authority'   then g.lad_name
        when 'postcode_district' then g.postcode_district
        when 'msoa'              then g.msoa_cd
        when 'lsoa'              then g.lsoa_cd
        when 'postcode_sector'   then g.postcode_sector
        when 'street'            then g.street
      end as grp_name
    from public.ppd_with_geography g
    where
      g.transfer_date between v_from_date and v_to_date
      and (v_ppd_type is null or g.property_type = v_ppd_type)
  ),

  -- Property-type mix: always computed over ALL types (ignores p_property_type
  -- filter so the mix reflects the true composition of the area)
  all_types as (
    select
      g.price_pence,
      g.transfer_date,
      g.property_type,
      case p_level
        when 'local_authority'   then g.lad_cd
        when 'postcode_district' then g.postcode_district
        when 'msoa'              then g.msoa_cd
        when 'lsoa'              then g.lsoa_cd
        when 'postcode_sector'   then g.postcode_sector
        when 'street'            then g.street_key
      end as grp_id
    from public.ppd_with_geography g
    where g.transfer_date between v_from_date and v_to_date
  ),

  -- Aggregate price stats (using filtered keyed CTE)
  price_stats as (
    select
      k.grp_id,
      -- Take grp_name from any row in the group (all rows share the same name)
      (array_agg(k.grp_name))[1]                              as grp_name,
      percentile_cont(0.5) within group (order by k.price_pence)::bigint
                                                               as median_price,
      percentile_cont(0.1) within group (order by k.price_pence)::bigint
                                                               as p10_price,
      percentile_cont(0.9) within group (order by k.price_pence)::bigint
                                                               as p90_price,
      count(*)::bigint                                         as tx_count,
      max(k.transfer_date)                                     as latest_date
    from keyed k
    where k.grp_id is not null and k.grp_id <> ''
    group by k.grp_id
  ),

  -- Aggregate property-type mix (using unfiltered all_types CTE)
  type_mix as (
    select
      a.grp_id,
      jsonb_object_agg(
        case a.property_type
          when 'D' then 'detached'
          when 'S' then 'semi-detached'
          when 'T' then 'terraced'
          when 'F' then 'flat'
          else 'other'
        end,
        cnt
      ) as mix
    from (
      select grp_id, property_type, count(*) as cnt
      from all_types
      where grp_id is not null and grp_id <> ''
      group by grp_id, property_type
    ) a
    group by a.grp_id
  )

  select
    ps.grp_id::text                 as area_id,
    ps.grp_name::text               as area_name,
    p_level::text                   as geography_level,
    ps.median_price                 as median_price_pence,
    ps.p10_price                    as p10_price_pence,
    ps.p90_price                    as p90_price_pence,
    ps.tx_count                     as transaction_count,
    ps.latest_date                  as latest_transaction_date,
    coalesce(tm.mix, '{}'::jsonb)   as property_type_mix
  from price_stats ps
  left join type_mix tm on tm.grp_id = ps.grp_id
  order by ps.grp_id;

end;
$$;

comment on function public.market_map_aggregate(text, text, date, date) is
  'Aggregate PPD price-paid data by geography level for the market-map choropleth. '
  'Returns median, P10, P90, count, latest date, and property-type mix per area. '
  'All groups are returned regardless of transaction count — confidence grading is done '
  'in the TypeScript service layer (High>=30, Medium>=10, Low>=5, Insufficient<5). '
  'Prices in pence. Date window defaults to last 36 months when both p_from_date and p_to_date are null.';

grant execute on function public.market_map_aggregate(text, text, date, date)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Function: market_map_area_bounds
--    Returns the centroid and bounding box for a given (level, area_id) pair,
--    sourced from geography_boundaries. Used by the service layer for
--    geocoding and map fitBounds.
--
--    Returns jsonb: {
--      "area_name": "...",
--      "centroid": [lng, lat],
--      "bbox": [west, south, east, north]
--    }
--    Returns NULL if the (level, area_id) is not found in geography_boundaries.
-- ---------------------------------------------------------------------------

create or replace function public.market_map_area_bounds(
  p_level   text,
  p_area_id text
)
returns jsonb
language sql
stable
security invoker
as $$
  select jsonb_build_object(
    'area_name', b.area_name,
    'centroid', jsonb_build_array(
      round(st_x(st_centroid(b.geometry::geometry))::numeric, 6),
      round(st_y(st_centroid(b.geometry::geometry))::numeric, 6)
    ),
    'bbox', jsonb_build_array(
      round(st_xmin(st_envelope(b.geometry::geometry))::numeric, 6),
      round(st_ymin(st_envelope(b.geometry::geometry))::numeric, 6),
      round(st_xmax(st_envelope(b.geometry::geometry))::numeric, 6),
      round(st_ymax(st_envelope(b.geometry::geometry))::numeric, 6)
    )
  )
  from public.geography_boundaries b
  where b.level = p_level
    and b.area_id = p_area_id
  limit 1;
$$;

comment on function public.market_map_area_bounds(text, text) is
  'Returns centroid [lng, lat] and bbox [west, south, east, north] for a geography_boundaries entry. '
  'Used by the market-map service layer for geocoding and map fitBounds. '
  'Returns NULL jsonb if the (level, area_id) combination is not found.';

grant execute on function public.market_map_area_bounds(text, text)
  to anon, authenticated;
