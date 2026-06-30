-- ===========================================================================
-- Local Vetted Traders — organic, location-matched expert surfacing for the
-- property detail page ("Local experts who can help with this property").
--
-- The existing `featured_experts_for` RPC (migration 20260630120000) returns
-- ONLY paid sponsored placements, so on a property with no advertiser it
-- returns nothing. This RPC returns ORGANIC verified traders that genuinely
-- serve the property's location and match the relevant trade categories, so the
-- section is populated by trust even with zero paid placements. The application
-- layer blends a capped number of sponsored cards on top (see
-- src/services/placements/local-experts-service.ts).
--
-- Eligibility (the safety gate — a paid card can never bypass this):
--   * verified           profiles.provider_verification_status = 'verified'
--                        (the 'suspended' status is therefore excluded)
--   * not soft-deleted   profiles.deleted_at IS NULL
--   * category match     spd.services && p_categories  (array overlap)
--   * serves location    postcode-district coverage OR within service radius
--
-- Location is matched against the only location data providers actually store:
-- their `service_postcodes` (district coverage) and `base_location` (PostGIS
-- service radius). Town/region text matching is deliberately NOT a parameter
-- because `service_provider_details` has no town/region column to match against
-- (that data only exists on paid `sponsored_placements`, handled separately).
--
-- Ranking inside the RPC is a coarse pre-sort (location tier -> rating ->
-- reviews); the precise trust blend (rating, response, completed jobs,
-- completeness, category relevance) is computed in TypeScript so it is
-- unit-testable.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.local_experts_for_property(
  p_postcode_district TEXT DEFAULT NULL,
  p_lat DOUBLE PRECISION DEFAULT NULL,
  p_lng DOUBLE PRECISION DEFAULT NULL,
  p_categories TEXT[] DEFAULT NULL,
  p_radius_miles INTEGER DEFAULT 25,
  p_limit INTEGER DEFAULT 24
)
RETURNS TABLE (
  provider_id UUID,
  business_name TEXT,
  slug TEXT,
  avatar_url TEXT,
  services public.service_category[],
  service_postcodes TEXT[],
  primary_category public.service_category,
  average_rating NUMERIC,
  total_reviews BIGINT,
  response_rate NUMERIC,
  response_time_hours NUMERIC,
  years_in_business INTEGER,
  completed_jobs_count INTEGER,
  business_description TEXT,
  qualifications TEXT[],
  portfolio_urls TEXT[],
  location_match TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH search_params AS (
    SELECT
      CASE
        WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ELSE NULL
      END AS geo,
      GREATEST(COALESCE(p_radius_miles, 25), 1) * 1609.34 AS radius_m,
      -- Pre-escape LIKE wildcards so an anon caller cannot pass '%'/'_' to
      -- broaden the postcode match beyond the intended district prefix.
      CASE
        WHEN p_postcode_district IS NOT NULL
        THEN replace(replace(upper(p_postcode_district), '%', '\%'), '_', '\_') || '%'
        ELSE NULL
      END AS district_pattern
  )
  SELECT
    spd.user_id AS provider_id,
    spd.business_name,
    spd.slug,
    p.avatar_url,
    spd.services,
    spd.service_postcodes,
    COALESCE(
      (
        SELECT s FROM unnest(spd.services) AS s
        WHERE p_categories IS NULL OR s::text = ANY (p_categories)
        LIMIT 1
      ),
      spd.services[1]
    ) AS primary_category,
    prs.average_rating,
    prs.total_reviews,
    prs.response_rate,
    spd.response_time_hours,
    spd.years_in_business,
    spd.completed_jobs_count,
    spd.business_description,
    spd.qualifications,
    spd.portfolio_urls,
    CASE
      WHEN sp.district_pattern IS NOT NULL AND EXISTS (
        SELECT 1 FROM unnest(spd.service_postcodes) AS pc
        WHERE upper(replace(pc, ' ', '')) LIKE sp.district_pattern ESCAPE '\'
      ) THEN 'postcode'
      WHEN sp.geo IS NOT NULL AND spd.base_location IS NOT NULL
        AND ST_DWithin(spd.base_location, sp.geo, sp.radius_m) THEN 'town'
      ELSE 'none'
    END AS location_match
  FROM public.service_provider_details spd
  JOIN public.profiles p ON p.id = spd.user_id
  LEFT JOIN public.provider_rating_stats prs ON prs.provider_id = spd.user_id
  CROSS JOIN search_params sp
  WHERE p.provider_verification_status = 'verified'
    AND p.deleted_at IS NULL
    AND (p_categories IS NULL OR spd.services && p_categories::public.service_category[])
    AND (
      (
        sp.district_pattern IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(spd.service_postcodes) AS pc
          WHERE upper(replace(pc, ' ', '')) LIKE sp.district_pattern ESCAPE '\'
        )
      )
      OR (
        sp.geo IS NOT NULL AND spd.base_location IS NOT NULL
        AND ST_DWithin(spd.base_location, sp.geo, sp.radius_m)
      )
    )
  ORDER BY
    CASE
      WHEN sp.district_pattern IS NOT NULL AND EXISTS (
        SELECT 1 FROM unnest(spd.service_postcodes) AS pc
        WHERE upper(replace(pc, ' ', '')) LIKE sp.district_pattern ESCAPE '\'
      ) THEN 0 ELSE 1
    END,
    COALESCE(prs.average_rating, 0) DESC,
    COALESCE(prs.total_reviews, 0) DESC
  LIMIT LEAST(GREATEST(p_limit, 0), 100);
$$;

-- Read-only public surfacing (logged-out visitors must see the section).
-- REVOKE the default PUBLIC grant first, then grant explicitly — mirrors the
-- defensive pattern used by record_placement_event in migration 20260630120000.
REVOKE ALL ON FUNCTION public.local_experts_for_property(
  TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT[], INTEGER, INTEGER
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.local_experts_for_property(
  TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT[], INTEGER, INTEGER
) TO anon, authenticated, service_role;

-- ===========================================================================
-- RFQ attribution — let a "Request Quote" launched from the property page's
-- Local Vetted Traders section carry context: which trader card was clicked,
-- which listing it came from, and the originating surface. All nullable and
-- additive; the broadcast RFQ flow is unchanged when these are absent.
-- ===========================================================================
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS target_provider_id UUID,
  ADD COLUMN IF NOT EXISTS listing_id UUID;

COMMENT ON COLUMN public.service_requests.source IS
  'Originating surface, e.g. property_detail_local_traders. Attribution only.';
COMMENT ON COLUMN public.service_requests.target_provider_id IS
  'service_provider_details.user_id of the specific trader the buyer clicked, when directed from a trader card.';
COMMENT ON COLUMN public.service_requests.listing_id IS
  'The property listing the RFQ was launched from, for property->trader conversion attribution.';

CREATE INDEX IF NOT EXISTS service_requests_source_idx
  ON public.service_requests (source)
  WHERE source IS NOT NULL;
