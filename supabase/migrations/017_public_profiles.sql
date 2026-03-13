-- =============================================================================
-- Migration 017: Public Profile Tables + Anon RLS Policies + RPCs
-- Phase 17: Service Provider Public Profiles
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 1: provider_portfolio_items table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS provider_portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolio_items_provider ON provider_portfolio_items(provider_id, sort_order);

ALTER TABLE provider_portfolio_items ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- SECTION 2: provider_leads table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS provider_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  service_type TEXT,
  preferred_date DATE,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'profile_page',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE provider_leads ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- SECTION 3: RLS anon policies
-- ---------------------------------------------------------------------------

CREATE POLICY "Anon can view verified provider details"
  ON service_provider_details FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = service_provider_details.user_id
        AND provider_verification_status = 'verified'
        AND deleted_at IS NULL
    )
  );

CREATE POLICY "Anon can view approved reviews"
  ON reviews FOR SELECT TO anon
  USING (moderation_status = 'approved' AND deleted_at IS NULL);

CREATE POLICY "Anon can view rating stats"
  ON provider_rating_stats FOR SELECT TO anon
  USING (TRUE);

CREATE POLICY "Anon can view provider services"
  ON provider_services FOR SELECT TO anon
  USING (TRUE);

CREATE POLICY "Anon can view portfolio items"
  ON provider_portfolio_items FOR SELECT TO anon
  USING (TRUE);

CREATE POLICY "Anon can submit leads"
  ON provider_leads FOR INSERT TO anon
  WITH CHECK (TRUE);

CREATE POLICY "Provider can view own leads"
  ON provider_leads FOR SELECT TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- SECTION 4: RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_seo_category_locations()
RETURNS TABLE(category TEXT, location TEXT, provider_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    unnest(services)::TEXT AS category,
    LOWER(REPLACE(COALESCE(city, service_postcodes[1], 'uk'), ' ', '-')) AS location,
    COUNT(*) AS provider_count
  FROM service_provider_details spd
  JOIN profiles p ON p.id = spd.user_id
  WHERE p.provider_verification_status = 'verified'
    AND p.deleted_at IS NULL
  GROUP BY category, location
  HAVING COUNT(*) >= 3
  ORDER BY provider_count DESC
  LIMIT 500;
$$;

CREATE OR REPLACE FUNCTION get_agent_public_stats(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_agent_id UUID;
  v_result JSONB;
BEGIN
  SELECT user_id INTO v_agent_id
  FROM agent_agency_profiles
  WHERE slug = p_slug
  LIMIT 1;

  IF v_agent_id IS NULL THEN
    RETURN '{}'::JSONB;
  END IF;

  SELECT jsonb_build_object(
    'active_listings_count', COUNT(*) FILTER (WHERE status IN ('for_sale','for_rent','under_offer')),
    'sold_count', COUNT(*) FILTER (WHERE status IN ('sold','let')),
    'avg_days_to_sell', ROUND(AVG(EXTRACT(EPOCH FROM (sold_at - created_at))/86400) FILTER (WHERE status IN ('sold','let')))::INTEGER,
    'avg_pct_asking', ROUND(AVG(sold_price / NULLIF(price, 0) * 100) FILTER (WHERE status = 'sold' AND sold_price IS NOT NULL), 1),
    'avg_rating', ROUND(AVG(overall_rating)::NUMERIC, 1),
    'total_reviews', COUNT(DISTINCT r.id)
  )
  INTO v_result
  FROM listings l
  LEFT JOIN reviews r ON r.provider_id = v_agent_id AND r.moderation_status = 'approved'
  WHERE l.agent_id = v_agent_id;

  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$;
