-- ============================================================================
-- market_map_area_detail — per-area sold-price breakdown split into flats vs
-- houses, for the selected-area detail panel (click target).
--
-- Depends on:
--   • public.ppd_with_geography (20260616000003_market_map_aggregation.sql)
--
-- Why a dedicated function rather than extending market_map_features:
--   The choropleth fetches every visible area; adding per-type percentiles to
--   every feature would bloat the payload and the query. This is called lazily
--   for the ONE clicked area only, so the heavier flat/house percentile work is
--   bounded to a single feature.
--
-- "House" = detached (D) + semi-detached (S) + terraced (T).
-- "Flat"  = flats / maisonettes (F).
--
-- Prices in PENCE (service layer divides by 100). Empty segments return
-- median_pence = null and count = 0 — the service grades these "Insufficient"
-- and the UI shows an explicit label, never £0.
-- ============================================================================

create or replace function public.market_map_area_detail(
  p_level     text,
  p_area_id   text,
  p_from_date date default null,
  p_to_date   date default null
)
returns jsonb
language plpgsql
stable
security invoker
as $$
declare
  v_from   date;
  v_to     date;
  v_result jsonb;
begin
  if p_level not in (
    'local_authority', 'postcode_district', 'msoa',
    'lsoa', 'postcode_sector', 'street'
  ) then
    raise exception
      'market_map_area_detail: unknown level ''%''. '
      'Must be one of: local_authority, postcode_district, msoa, lsoa, postcode_sector, street.',
      p_level;
  end if;

  v_to   := coalesce(p_to_date, current_date);
  v_from := coalesce(p_from_date, v_to - interval '36 months');

  with rows as (
    select g.price_pence, g.transfer_date, g.property_type
    from public.ppd_with_geography g
    where g.transfer_date between v_from and v_to
      and (case p_level
        when 'local_authority'   then g.lad_cd
        when 'postcode_district' then g.postcode_district
        when 'msoa'              then g.msoa_cd
        when 'lsoa'              then g.lsoa_cd
        when 'postcode_sector'   then g.postcode_sector
        when 'street'            then g.street_key
      end) = p_area_id
  )
  select jsonb_build_object(
    'area_id',         p_area_id,
    'geography_level', p_level,
    'date_from',       v_from,
    'date_to',         v_to,
    'overall', (
      select jsonb_build_object(
        'median_pence', percentile_cont(0.5) within group (order by price_pence)::bigint,
        'p10_pence',    percentile_cont(0.1) within group (order by price_pence)::bigint,
        'p90_pence',    percentile_cont(0.9) within group (order by price_pence)::bigint,
        'count',        count(*),
        'latest_date',  max(transfer_date)
      ) from rows
    ),
    'flat', (
      select jsonb_build_object(
        'median_pence', percentile_cont(0.5) within group (order by price_pence)::bigint,
        'count',        count(*),
        'latest_date',  max(transfer_date)
      ) from rows where property_type = 'F'
    ),
    'house', (
      select jsonb_build_object(
        'median_pence', percentile_cont(0.5) within group (order by price_pence)::bigint,
        'count',        count(*),
        'latest_date',  max(transfer_date)
      ) from rows where property_type in ('D', 'S', 'T')
    )
  ) into v_result;

  return v_result;
end;
$$;

comment on function public.market_map_area_detail(text, text, date, date) is
  'Per-area sold-price breakdown split into overall / flat (F) / house (D,S,T) for the '
  'selected-area detail panel. Reuses ppd_with_geography. Prices in pence; empty segments '
  'return null median + count 0. Date window defaults to last 36 months.';

grant execute on function public.market_map_area_detail(text, text, date, date)
  to anon, authenticated;
