-- ============================================================================
-- market_map_features — Joins market_map_aggregate output to boundary geometry
-- so the service layer gets stats + GeoJSON in a single SQL call.
--
-- Depends on:
--   • public.market_map_aggregate  (20260616000003_market_map_aggregation.sql)
--   • public.geography_boundaries  (20260616000002_geography_boundaries.sql)
--
-- HOW TO RUN:
--   supabase db push
--   -- or via psql:
--   psql "$DATABASE_URL" -f supabase/migrations/20260616000004_market_map_features.sql
--
-- NOTE: Run after Task 5 ingest has populated geography_boundaries and after
-- 20260616000003 has been applied. On an empty set the function returns 0 rows.
-- ============================================================================

create or replace function public.market_map_features(
  p_level         text,
  p_property_type text             default 'all',
  p_from_date     date             default null,
  p_to_date       date             default null,
  p_min_lng       double precision default null,
  p_min_lat       double precision default null,
  p_max_lng       double precision default null,
  p_max_lat       double precision default null
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
  property_type_mix       jsonb,
  geojson                 text
)
language sql
stable
security invoker
as $$
  select
    a.area_id,
    coalesce(a.area_name, b.area_name)                     as area_name,
    a.geography_level,
    a.median_price_pence,
    a.p10_price_pence,
    a.p90_price_pence,
    a.transaction_count,
    a.latest_transaction_date,
    a.property_type_mix,
    ST_AsGeoJSON(b.geometry)                               as geojson
  from market_map_aggregate(p_level, p_property_type, p_from_date, p_to_date) a
  left join public.geography_boundaries b
    on b.level    = p_level
   and b.area_id  = a.area_id
  where (
    p_min_lng is null
    or b.geometry && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
  );
$$;

comment on function public.market_map_features(text, text, date, date, double precision, double precision, double precision, double precision) is
  'Joins market_map_aggregate output to geography_boundaries geometry. '
  'Returns per-area price statistics and GeoJSON geometry string for choropleth rendering. '
  'Bbox filter (p_min_lng, p_min_lat, p_max_lng, p_max_lat) is optional: pass all four or none. '
  'area_name falls back to geography_boundaries.area_name when the aggregate row has null (e.g. street level). '
  'All rows are returned regardless of transaction count — confidence grading is the service layer''s responsibility. '
  'Prices in pence.';

grant execute on function public.market_map_features(text, text, date, date, double precision, double precision, double precision, double precision)
  to anon, authenticated;
