-- ============================================================================
-- market_map_search — Free-text area search function for the market-map
-- search bar. Resolves a query string to candidate geographic areas with
-- centroid, bbox, and default zoom level.
--
-- Depends on:
--   • public.postcode_geography   (20260616000001_postcode_geography.sql)
--   • public.geography_boundaries (20260616000002_geography_boundaries.sql)
--   • public.market_map_area_bounds (20260616000003_market_map_aggregation.sql)
--
-- HOW TO RUN (once Task 5 ingest has populated the source tables):
--
--   supabase db push
--
-- Behaviour:
--   1. If p_q matches a full UK postcode (normalised) → look it up in
--      postcode_geography and return its containing postcode_district,
--      postcode_sector, and local_authority (lad) rows, with centroid/bbox
--      pulled from geography_boundaries via market_map_area_bounds when
--      available; otherwise falls back to the postcode's own lat/lng with a
--      small bbox around it.
--
--   2. Otherwise → ILIKE-match against geography_boundaries.area_name across
--      all levels, preferring local_authority > msoa > postcode_district
--      ordering. Returns centroid and bbox computed from the boundary geometry.
--
-- Tolerates empty tables — returns 0 rows without error.
-- STABLE — treats only committed data, no side effects.
-- SECURITY INVOKER — called with the caller's privileges (anon / authenticated).
-- ============================================================================

-- Timestamp: 20260616000005

create or replace function public.market_map_search(
  p_q     text,
  p_limit int default 10
)
returns table (
  id               text,
  name             text,
  type             text,
  geography_level  text,
  center           jsonb,
  bbox             jsonb,
  default_zoom     int
)
language plpgsql
stable
security invoker
as $$
declare
  -- Normalised (uppercase, no spaces) form of p_q used for postcode lookup.
  v_normalised text;

  -- Extracted district / sector from a full-postcode match.
  v_district text;
  v_sector   text;
  v_lad_cd   text;
  v_lat      double precision;
  v_lng      double precision;

  -- Bounding-box half-width in degrees (~0.5 km) for postcode point fallback.
  v_delta constant double precision := 0.005;
begin
  -- Trim whitespace; return empty if blank.
  p_q := btrim(p_q);
  if p_q is null or p_q = '' then
    return;
  end if;

  -- Normalise for postcode comparison: uppercase, strip all spaces.
  v_normalised := upper(replace(p_q, ' ', ''));

  -- -------------------------------------------------------------------------
  -- Branch 1: p_q looks like a full UK postcode
  --   UK postcode pattern (normalised, no space):
  --   [A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}
  -- -------------------------------------------------------------------------
  if v_normalised ~ '^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$' then

    -- Look up the postcode in postcode_geography.
    select
      pg.postcode_district,
      pg.postcode_sector,
      pg.lad_cd,
      pg.latitude,
      pg.longitude
    into
      v_district, v_sector, v_lad_cd, v_lat, v_lng
    from public.postcode_geography pg
    where pg.postcode_normalised = v_normalised
    limit 1;

    -- If the postcode was found, return its containing areas and finish.
    -- Otherwise fall through to the name search below.
    if found then

    -- Return postcode_district row
    if v_district is not null then
      return query
        select
          v_district as id,
          v_district as name,
          'postcode_district'::text as type,
          'postcode_district'::text as geography_level,
          -- Try boundary centroid first; fall back to postcode lat/lng.
          coalesce(
            (public.market_map_area_bounds('postcode_district', v_district) -> 'centroid'),
            jsonb_build_array(round(v_lng::numeric, 6), round(v_lat::numeric, 6))
          ) as center,
          coalesce(
            (public.market_map_area_bounds('postcode_district', v_district) -> 'bbox'),
            jsonb_build_array(
              round((v_lng - v_delta)::numeric, 6),
              round((v_lat - v_delta)::numeric, 6),
              round((v_lng + v_delta)::numeric, 6),
              round((v_lat + v_delta)::numeric, 6)
            )
          ) as bbox,
          13 as default_zoom;
    end if;

    -- Return postcode_sector row
    if v_sector is not null then
      return query
        select
          v_sector as id,
          v_sector as name,
          'postcode_sector'::text as type,
          'postcode_sector'::text as geography_level,
          coalesce(
            (public.market_map_area_bounds('postcode_sector', v_sector) -> 'centroid'),
            jsonb_build_array(round(v_lng::numeric, 6), round(v_lat::numeric, 6))
          ) as center,
          coalesce(
            (public.market_map_area_bounds('postcode_sector', v_sector) -> 'bbox'),
            jsonb_build_array(
              round((v_lng - v_delta)::numeric, 6),
              round((v_lat - v_delta)::numeric, 6),
              round((v_lng + v_delta)::numeric, 6),
              round((v_lat + v_delta)::numeric, 6)
            )
          ) as bbox,
          14 as default_zoom;
    end if;

    -- Return local_authority (LAD) row
    if v_lad_cd is not null then
      return query
        select
          v_lad_cd as id,
          coalesce(
            (public.market_map_area_bounds('local_authority', v_lad_cd) ->> 'area_name'),
            v_lad_cd
          ) as name,
          'local_authority'::text as type,
          'local_authority'::text as geography_level,
          coalesce(
            (public.market_map_area_bounds('local_authority', v_lad_cd) -> 'centroid'),
            jsonb_build_array(round(v_lng::numeric, 6), round(v_lat::numeric, 6))
          ) as center,
          coalesce(
            (public.market_map_area_bounds('local_authority', v_lad_cd) -> 'bbox'),
            jsonb_build_array(
              round((v_lng - v_delta)::numeric, 6),
              round((v_lat - v_delta)::numeric, 6),
              round((v_lng + v_delta)::numeric, 6),
              round((v_lat + v_delta)::numeric, 6)
            )
          ) as bbox,
          11 as default_zoom;
    end if;

    return;  -- done with postcode branch
    end if;
  end if;

  -- -------------------------------------------------------------------------
  -- Branch 2: name search against geography_boundaries.area_name
  --   Prefer: exact match, then prefix match, then substring match.
  --   Level priority: local_authority, msoa, postcode_district, others.
  -- -------------------------------------------------------------------------
  return query
    select
      b.area_id::text as id,
      b.area_name::text as name,
      b.level::text as type,
      b.level::text as geography_level,
      jsonb_build_array(
        round(st_x(st_centroid(b.geometry::geometry))::numeric, 6),
        round(st_y(st_centroid(b.geometry::geometry))::numeric, 6)
      ) as center,
      jsonb_build_array(
        round(st_xmin(st_envelope(b.geometry::geometry))::numeric, 6),
        round(st_ymin(st_envelope(b.geometry::geometry))::numeric, 6),
        round(st_xmax(st_envelope(b.geometry::geometry))::numeric, 6),
        round(st_ymax(st_envelope(b.geometry::geometry))::numeric, 6)
      ) as bbox,
      case b.level
        when 'local_authority'   then 11
        when 'postcode_district' then 13
        when 'msoa'              then 13
        when 'lsoa'              then 14
        when 'postcode_sector'   then 14
        when 'street'            then 16
        else                          11
      end as default_zoom
    from public.geography_boundaries b
    where
      b.area_name ilike (p_q || '%')
      or b.area_name ilike ('%' || p_q || '%')
    order by
      -- Exact match first
      case when lower(b.area_name) = lower(p_q) then 0 else 1 end,
      -- Prefix match before substring
      case when lower(b.area_name) like lower(p_q) || '%' then 0 else 1 end,
      -- Level priority: local_authority > msoa > postcode_district > others
      case b.level
        when 'local_authority'   then 0
        when 'msoa'              then 1
        when 'postcode_district' then 2
        when 'lsoa'              then 3
        when 'postcode_sector'   then 4
        when 'street'            then 5
        else                          6
      end,
      b.area_name
    limit p_limit;

end;
$$;

comment on function public.market_map_search(text, int) is
  'Resolves a free-text query to candidate geographic areas for the market-map '
  'search bar. If p_q is a full UK postcode, returns the containing '
  'postcode_district, postcode_sector, and local_authority. Otherwise, '
  'ILIKE-matches against geography_boundaries.area_name, ordered by match '
  'quality and level priority. Returns 0 rows on empty tables.';

grant execute on function public.market_map_search(text, int)
  to anon, authenticated;
