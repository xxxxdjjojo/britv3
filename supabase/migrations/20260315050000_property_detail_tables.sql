-- 20260315050000_property_detail_tables.sql
-- Property Detail Pages: insights cache, view tracking, renovation scenarios + benchmarks
-- Refs: properties, listings (003_property_portal.sql); price_history (003_property_portal.sql)

-- ===========================================================================
-- 1. property_insights — Cache external API data per property
--    Types: land_registry, ofsted, crime, broadband, roi
-- ===========================================================================

CREATE TABLE IF NOT EXISTS property_insights (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  insight_type  TEXT        NOT NULL CHECK (insight_type IN ('land_registry', 'ofsted', 'crime', 'broadband', 'roi')),
  data          JSONB       NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,
  UNIQUE(property_id, insight_type)
);

ALTER TABLE property_insights ENABLE ROW LEVEL SECURITY;

-- Public can read insights where the property has at least one active listing
DROP POLICY IF EXISTS property_insights_public_read ON property_insights;
CREATE POLICY property_insights_public_read ON property_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.property_id = property_insights.property_id
        AND l.status = 'active'
        AND l.deleted_at IS NULL
    )
  );

-- Service role (background jobs, API workers) can write
DROP POLICY IF EXISTS property_insights_service_write ON property_insights;
CREATE POLICY property_insights_service_write ON property_insights
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ===========================================================================
-- 2. property_views — Real-time anonymous view tracking
-- ===========================================================================

CREATE TABLE IF NOT EXISTS property_views (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  session_id  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can record a view
DROP POLICY IF EXISTS property_views_insert ON property_views;
CREATE POLICY property_views_insert ON property_views
  FOR INSERT WITH CHECK (true);

-- Only service role can read raw view rows (aggregation happens server-side)
DROP POLICY IF EXISTS property_views_service_read ON property_views;
CREATE POLICY property_views_service_read ON property_views
  FOR SELECT USING (auth.role() = 'service_role');

-- ===========================================================================
-- 3. property_renovation_scenarios — User-saved "What if?" renovation scenarios
-- ===========================================================================

CREATE TABLE IF NOT EXISTS property_renovation_scenarios (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  renovation_type       TEXT        NOT NULL,
  budget_input          INTEGER,
  estimated_uplift_low  INTEGER,
  estimated_uplift_high INTEGER,
  confidence            TEXT        CHECK (confidence IN ('high', 'medium', 'low')),
  created_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE property_renovation_scenarios ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own scenarios
DROP POLICY IF EXISTS renovation_scenarios_own ON property_renovation_scenarios;
CREATE POLICY renovation_scenarios_own ON property_renovation_scenarios
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- 4. renovation_type_benchmarks — Seeded lookup: cost + value uplift by region
-- ===========================================================================

CREATE TABLE IF NOT EXISTS renovation_type_benchmarks (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  renovation_type      TEXT        NOT NULL,
  region               TEXT        NOT NULL,
  cost_low_per_sqm     INTEGER,
  cost_high_per_sqm    INTEGER,
  value_uplift_pct_low NUMERIC(5,2),
  value_uplift_pct_high NUMERIC(5,2),
  data_source          TEXT,
  last_updated         DATE        NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(renovation_type, region)
);

ALTER TABLE renovation_type_benchmarks ENABLE ROW LEVEL SECURITY;

-- Public read — benchmark data is non-sensitive
DROP POLICY IF EXISTS renovation_benchmarks_public_read ON renovation_type_benchmarks;
CREATE POLICY renovation_benchmarks_public_read ON renovation_type_benchmarks
  FOR SELECT USING (true);

-- Service role manages seed data and updates
DROP POLICY IF EXISTS renovation_benchmarks_admin_write ON renovation_type_benchmarks;
CREATE POLICY renovation_benchmarks_admin_write ON renovation_type_benchmarks
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ===========================================================================
-- 5. Indexes
--    Notes from 003_property_portal.sql audit:
--    - slug lives on listings (UNIQUE constraint already creates an index)
--    - properties has no slug or postcode_district column — those indexes are omitted
--    - price history table is named price_history (listing_id FK)
-- ===========================================================================

-- Support view-count queries scoped by property and time window
CREATE INDEX IF NOT EXISTS idx_property_views_property_id_created
  ON property_views(property_id, created_at);

-- Support insight freshness checks (e.g. WHERE expires_at < now())
CREATE INDEX IF NOT EXISTS idx_property_insights_property_type
  ON property_insights(property_id, insight_type);

-- Support renovation scenario queries per user
CREATE INDEX IF NOT EXISTS idx_renovation_scenarios_user_id
  ON property_renovation_scenarios(user_id);

-- Support renovation scenario queries per property
CREATE INDEX IF NOT EXISTS idx_renovation_scenarios_property_id
  ON property_renovation_scenarios(property_id);

-- Support benchmark lookups by renovation type + region
CREATE INDEX IF NOT EXISTS idx_renovation_benchmarks_type_region
  ON renovation_type_benchmarks(renovation_type, region);

-- listings.slug already has a UNIQUE index from 003_property_portal.sql.
-- Explicitly named index added for discoverability; Postgres will skip if equivalent exists.
CREATE INDEX IF NOT EXISTS idx_listings_slug
  ON listings(slug);

-- price_history: index for timeline queries on a listing's price history
CREATE INDEX IF NOT EXISTS idx_price_history_listing_changed
  ON price_history(listing_id, changed_at DESC);
