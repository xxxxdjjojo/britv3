-- ============================================================================
-- market-map: vector-tile (MVT) RPC for the choropleth map.
--
-- WHAT: public.market_map_tile(z, x, y, property_type, window) returns the
-- Mapbox Vector Tile (bytea) for one z/x/y tile. The 'areas' layer carries
-- one feature per geography area with attributes area_id, bucket,
-- median_price_pence and transaction_count.
--
-- WHY: the map needs server-rendered vector tiles so the client never ships
-- raw polygons. Geography level is chosen by zoom (coarse LA at low zoom →
-- fine LSOA at high zoom) so tile payloads stay small, and the fill colour is
-- driven entirely by the baked national `bucket` (ntile 1..9) on
-- public.market_map_area_stats — no per-request stats computation. Geometry
-- comes from public.geography_boundaries (SRID 4326, generalised ONS BGC),
-- transformed to Web Mercator (3857) and clipped to the tile envelope.
--
-- ROLLBACK: drop function public.market_map_tile(int,int,int,text,int);
-- ============================================================================

create or replace function public.market_map_tile(
  p_z int, p_x int, p_y int, p_property_type text default 'all', p_window int default 12)
returns bytea language sql stable security invoker as $$
  with lvl as (
    select case
      when p_z < 7  then 'local_authority'
      when p_z < 10 then 'postcode_district'
      when p_z < 13 then 'msoa'
      else 'lsoa' end as level),
  mvt as (
    select s.area_id, s.bucket, s.median_price_pence, s.transaction_count,
      ST_AsMVTGeom(
        ST_Transform(b.geometry::geometry, 3857),
        ST_TileEnvelope(p_z, p_x, p_y),
        4096, 64, true) as geom
    from public.geography_boundaries b
    join lvl on b.level = lvl.level
    join public.market_map_area_stats s
      on s.geography_level = b.level
     and s.area_id = b.area_id
     and s.property_type = p_property_type
     and s.window_months = p_window
    where ST_Transform(b.geometry::geometry, 3857) && ST_TileEnvelope(p_z, p_x, p_y))
  select ST_AsMVT(mvt.*, 'areas')
  from mvt
  where geom is not null;
$$;

grant execute on function public.market_map_tile(int,int,int,text,int) to anon, authenticated, service_role;
