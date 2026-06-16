-- server-internal: run after Task 5 ingest (20260616000003_market_map_aggregation.sql)
-- Returns raw transaction points within a bounding box for H3 micro-area aggregation.
-- SECURITY: GRANT EXECUTE to authenticated ONLY (NOT anon). The service calls this via
-- the admin (service-role) client so RLS is bypassed, but anon access is blocked at the
-- function level as an additional layer. Individual transaction rows must never reach
-- the browser — only aggregated H3 cells are returned to callers.

CREATE OR REPLACE FUNCTION public.market_map_points(
  p_min_lng   double precision,
  p_min_lat   double precision,
  p_max_lng   double precision,
  p_max_lat   double precision,
  p_property_type text    DEFAULT 'all',
  p_from_date     date    DEFAULT NULL,
  p_to_date       date    DEFAULT NULL,
  -- Memory guard: hitting this cap means the viewport is too large; caller
  -- should prompt the user to zoom in further before fetching.
  p_limit         int     DEFAULT 50000
)
RETURNS TABLE (
  latitude        double precision,
  longitude       double precision,
  price_pence     bigint,
  transfer_date   date,
  street          text,
  town            text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    g.latitude,
    g.longitude,
    g.price_pence,
    g.transfer_date,
    g.street,
    g.town
  FROM public.ppd_with_geography g
  WHERE
    g.latitude  IS NOT NULL
    AND g.longitude IS NOT NULL
    AND g.latitude  BETWEEN p_min_lat AND p_max_lat
    AND g.longitude BETWEEN p_min_lng AND p_max_lng
    -- Date window: default last 36 months when both bounds are null.
    AND g.transfer_date >= COALESCE(
          p_from_date,
          (CURRENT_DATE - INTERVAL '36 months')::date
        )
    AND g.transfer_date <= COALESCE(p_to_date, CURRENT_DATE)
    -- Property-type filter: 'all' → no filter; else map display name → PPD code.
    AND (
      p_property_type = 'all'
      OR g.property_type = CASE p_property_type
        WHEN 'detached'      THEN 'D'
        WHEN 'semi-detached' THEN 'S'
        WHEN 'terraced'      THEN 'T'
        WHEN 'flat'          THEN 'F'
        ELSE p_property_type
      END
    )
  ORDER BY g.transfer_date DESC
  LIMIT p_limit;
$$;

-- Revoke from public first, then grant only to authenticated role.
-- anon callers never reach this function; the service uses the admin (service-role) client.
REVOKE ALL ON FUNCTION public.market_map_points(
  double precision, double precision, double precision, double precision,
  text, date, date, integer
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.market_map_points(
  double precision, double precision, double precision, double precision,
  text, date, date, integer
) TO authenticated;
