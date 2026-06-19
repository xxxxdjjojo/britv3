-- providers_in_bounds — bounding-box geo search for the public provider map.
--
-- service_provider_details stores location in `base_location` (geography(Point,4326)),
-- NOT flat latitude/longitude columns, so a PostgREST `.gte("latitude")` filter can
-- never work — it errors with "column ... does not exist" and the /api/providers/nearby
-- route silently returns an empty list. This RPC does the bbox query in PostGIS and
-- returns the flat shape the route already expects.
--
-- SECURITY INVOKER: runs as the caller, so RLS on service_provider_details still
-- governs row visibility (the map is reachable by anon + authenticated users).

CREATE OR REPLACE FUNCTION public.providers_in_bounds(
  sw_lat double precision,
  sw_lng double precision,
  ne_lat double precision,
  ne_lng double precision
)
RETURNS TABLE (
  id uuid,
  slug text,
  business_name text,
  category text,
  average_rating numeric,
  lat double precision,
  lng double precision
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    spd.user_id AS id,
    spd.slug,
    spd.business_name,
    COALESCE(spd.services[1]::text, 'General') AS category,
    prs.average_rating,
    ST_Y(spd.base_location::geometry) AS lat,
    ST_X(spd.base_location::geometry) AS lng
  FROM public.service_provider_details spd
  LEFT JOIN public.provider_rating_stats prs ON prs.provider_id = spd.user_id
  WHERE spd.base_location IS NOT NULL
    AND ST_Y(spd.base_location::geometry) BETWEEN sw_lat AND ne_lat
    AND ST_X(spd.base_location::geometry) BETWEEN sw_lng AND ne_lng
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.providers_in_bounds(
  double precision, double precision, double precision, double precision
) TO anon, authenticated;
