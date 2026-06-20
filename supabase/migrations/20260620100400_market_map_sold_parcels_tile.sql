-- ============================================================================
-- sold-parcels: vector-tile RPC — public.market_map_sold_parcels_tile(z,x,y)
--
-- WHAT: a Mapbox Vector Tile (bytea, layer `sold_parcels`) of individual sold
-- parcels for one z/x/y tile. HIGH ZOOM ONLY (z >= 14): the sold layer sits on
-- top of the area choropleth and only appears at street zoom, so below z14 this
-- returns NULL (the route serves 204 and the choropleth carries the map).
--
-- Sold parcels are sparse, so high-zoom tiles are tiny → instant. The full sale
-- detail (`sales` jsonb) is baked into each feature as a JSON string, so the
-- client popup needs NO extra fetch. Mirrors market_map_tile.sql.
--
-- ROLLBACK: drop function public.market_map_sold_parcels_tile(int,int,int);
-- ============================================================================

create or replace function public.market_map_sold_parcels_tile(
  p_z int, p_x int, p_y int)
returns bytea language sql stable security invoker as $$
  with mvt as (
    select
      s.inspire_id,
      s.bucket,
      s.sale_count,
      s.median_price_pence,
      s.median_price_per_sqm_pence,
      s.dominant_property_type,
      to_char(s.latest_transfer_date, 'YYYY-MM-DD') as latest_transfer_date,
      s.sales::text as sales,
      ST_AsMVTGeom(
        ST_Transform(s.geometry, 3857),
        ST_TileEnvelope(p_z, p_x, p_y),
        4096, 64, true) as geom
    from public.market_map_sold_parcels s
    where p_z >= 14
      and ST_Transform(s.geometry, 3857) && ST_TileEnvelope(p_z, p_x, p_y))
  select ST_AsMVT(mvt.*, 'sold_parcels')
  from mvt
  where geom is not null;
$$;

grant execute on function public.market_map_sold_parcels_tile(int,int,int)
  to anon, authenticated, service_role;
