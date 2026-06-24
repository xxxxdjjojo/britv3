-- ============================================================================
-- market-map: human-facing display names for neighbourhood-level areas.
--
-- WHAT: adds geography_boundaries.display_name and backfills it for MSOA and
-- LSOA rows with "<modal postcode district> · <borough>" (e.g. "UB6 · Ealing").
-- Updates public.market_map_features to surface display_name as area_name.
--
-- WHY: the map's hover tooltip, instant price card and area-detail panel all
-- render a single field (area_name) returned by market_map_features. For MSOA
-- ("Neighbourhood") and LSOA ("Local area") that field came back as the raw ONS
-- code (e.g. "E02000787"); humanizeAreaName then dropped it for the generic
-- level label "Neighbourhood"/"Local area". Users asked to see the postcode and
-- borough instead. MSOA/LSOA nest cleanly within one Local Authority, so the
-- borough is deterministic; the postcode district is the modal district of the
-- postcodes that fall in the area (an MSOA/LSOA usually spans 1–2 districts).
--
-- Levels that are already human (postcode_district -> "W5", local_authority ->
-- "Ealing") keep display_name = null and fall through to area_name unchanged.
--
-- ROLLBACK:
--   alter table public.geography_boundaries drop column if exists display_name;
--   -- then re-apply the previous market_map_features definition
--   -- (20260616000004_market_map_features.sql).
-- ============================================================================

-- 1. Additive column — nullable, no default. Safe on a populated table.
alter table public.geography_boundaries
  add column if not exists display_name text;

comment on column public.geography_boundaries.display_name is
  'Optional human-facing label that overrides area_name for display. '
  'Backfilled for MSOA/LSOA as "<modal postcode district> · <borough>" '
  '(e.g. "UB6 · Ealing"); null for levels whose area_name is already human '
  '(postcode_district, local_authority) and for street.';

-- 2. Backfill MSOA + LSOA from postcode_geography. Idempotent: re-running
--    recomputes the same label. MSOA joins on msoa_cd, LSOA on lsoa_cd; both
--    nest within a single Local Authority so the borough is unambiguous.
update public.geography_boundaries gb
set display_name = lbl.display_name
from (
  select
    b.level,
    b.area_id,
    case
      when d.modal_district is not null and v.borough is not null
        then d.modal_district || ' · ' || v.borough
      else coalesce(d.modal_district, v.borough)
    end as display_name
  from public.geography_boundaries b
  cross join lateral (
    select mode() within group (order by pg.postcode_district) as modal_district
    from public.postcode_geography pg
    where (b.level = 'msoa' and pg.msoa_cd = b.area_id)
       or (b.level = 'lsoa' and pg.lsoa_cd = b.area_id)
  ) d
  cross join lateral (
    select pg.lad_name as borough
    from public.postcode_geography pg
    where (
            (b.level = 'msoa' and pg.msoa_cd = b.area_id)
         or (b.level = 'lsoa' and pg.lsoa_cd = b.area_id)
          )
      and pg.lad_name is not null
    limit 1
  ) v
  where b.level in ('msoa', 'lsoa')
) lbl
where gb.level = lbl.level
  and gb.area_id = lbl.area_id
  and lbl.display_name is not null;

-- 3. Surface display_name as area_name from market_map_features. Resolution
--    order: human override (display_name) -> human boundary name (area_name) ->
--    aggregate label (which is the ONS code, only reached at street level where
--    no boundary row exists). One-line change to the SELECT vs.
--    20260616000004_market_map_features.sql; signature and grants unchanged.
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
    coalesce(b.display_name, b.area_name, a.area_name)     as area_name,
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
  'area_name resolves to geography_boundaries.display_name (human "<district> · <borough>" '
  'label for MSOA/LSOA) when present, then geography_boundaries.area_name, then the aggregate label. '
  'All rows are returned regardless of transaction count — confidence grading is the service layer''s responsibility. '
  'Prices in pence.';

grant execute on function public.market_map_features(text, text, date, date, double precision, double precision, double precision, double precision)
  to anon, authenticated;
