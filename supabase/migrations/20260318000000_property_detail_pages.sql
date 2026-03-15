-- Phase 15: Property Detail Pages - Wave 1
-- Creates tables for property insights, view tracking, renovation scenarios, and benchmarks.
-- Also adds note column to saved_properties and creates required indexes.

-- ============================================================================
-- TABLE 1: property_insights
-- Cache for external API data (land registry, ofsted, crime, broadband, ROI)
-- ============================================================================

CREATE TABLE property_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(property_id, insight_type)
);

ALTER TABLE property_insights ENABLE ROW LEVEL SECURITY;

-- Public can read insights for active properties
CREATE POLICY "public_read_insights" ON property_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_insights.property_id
      AND p.status = 'active'
    )
  );

-- ============================================================================
-- TABLE 2: property_views
-- Real-time view tracking (anonymous session-based, not user_id)
-- ============================================================================

CREATE TABLE property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_property_views_property_id_created ON property_views(property_id, created_at);

ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (no read required via client)
CREATE POLICY "anon_insert_views" ON property_views
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- TABLE 3: property_renovation_scenarios
-- Saved "What if" renovation scenarios per user
-- ============================================================================

CREATE TABLE property_renovation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  renovation_type TEXT NOT NULL,
  budget_input INTEGER,
  estimated_uplift_low INTEGER,
  estimated_uplift_high INTEGER,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_property_renovation_scenarios_user_property ON property_renovation_scenarios(user_id, property_id);

ALTER TABLE property_renovation_scenarios ENABLE ROW LEVEL SECURITY;

-- Users can only see and create their own scenarios
CREATE POLICY "users_own_scenarios" ON property_renovation_scenarios
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE 4: renovation_type_benchmarks
-- Seeded lookup table with quarterly refresh cadence
-- Regional cost and value uplift benchmarks by renovation type
-- ============================================================================

CREATE TABLE renovation_type_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renovation_type TEXT NOT NULL,
  region TEXT NOT NULL,
  cost_low_per_sqm INTEGER,
  cost_high_per_sqm INTEGER,
  value_uplift_pct_low NUMERIC(5,2),
  value_uplift_pct_high NUMERIC(5,2),
  data_source TEXT,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(renovation_type, region)
);

ALTER TABLE renovation_type_benchmarks ENABLE ROW LEVEL SECURITY;

-- Public read-only (not user data, lookup only)
CREATE POLICY "public_read_benchmarks" ON renovation_type_benchmarks
  FOR SELECT USING (true);

-- ============================================================================
-- TABLE 5: saved_properties - RENAME NOTES COLUMN
-- Delight feature allowing users to add personal notes to saved properties
-- ============================================================================

ALTER TABLE saved_properties RENAME COLUMN notes TO note;

-- ============================================================================
-- INDEXES FOR PROPERTY DETAIL QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);

-- ============================================================================
-- SEED DATA: renovation_type_benchmarks
-- UK regional benchmarks from RICS 2024, Which? 2024, Savills 2024
-- Covers: loft conversion, kitchen, extension, bathroom, full refurb
-- Regions: london, south_east, midlands, north, scotland
-- ============================================================================

INSERT INTO renovation_type_benchmarks (renovation_type, region, cost_low_per_sqm, cost_high_per_sqm, value_uplift_pct_low, value_uplift_pct_high, data_source)
VALUES
-- Loft conversion
('loft_conversion', 'london', 1800, 3200, 10.00, 20.00, 'RICS 2024'),
('loft_conversion', 'south_east', 1400, 2600, 8.00, 18.00, 'RICS 2024'),
('loft_conversion', 'midlands', 1100, 2000, 7.00, 15.00, 'RICS 2024'),
('loft_conversion', 'north', 900, 1800, 6.00, 14.00, 'RICS 2024'),
('loft_conversion', 'scotland', 1000, 1900, 6.00, 13.00, 'RICS 2024'),
-- Kitchen refurb
('kitchen', 'london', 800, 2500, 3.00, 8.00, 'Which? 2024'),
('kitchen', 'south_east', 600, 2000, 2.50, 7.00, 'Which? 2024'),
('kitchen', 'midlands', 500, 1600, 2.00, 6.00, 'Which? 2024'),
('kitchen', 'north', 400, 1400, 2.00, 5.50, 'Which? 2024'),
('kitchen', 'scotland', 450, 1500, 2.00, 5.50, 'Which? 2024'),
-- Extension (single storey rear)
('extension', 'london', 2200, 3800, 12.00, 22.00, 'RICS 2024'),
('extension', 'south_east', 1800, 3200, 10.00, 20.00, 'RICS 2024'),
('extension', 'midlands', 1400, 2600, 8.00, 17.00, 'RICS 2024'),
('extension', 'north', 1200, 2200, 7.00, 15.00, 'RICS 2024'),
('extension', 'scotland', 1300, 2400, 7.00, 15.00, 'RICS 2024'),
-- Bathroom refurb
('bathroom', 'london', 600, 1800, 1.50, 5.00, 'Which? 2024'),
('bathroom', 'south_east', 500, 1500, 1.50, 4.50, 'Which? 2024'),
('bathroom', 'midlands', 400, 1200, 1.00, 4.00, 'Which? 2024'),
('bathroom', 'north', 350, 1100, 1.00, 3.50, 'Which? 2024'),
('bathroom', 'scotland', 380, 1200, 1.00, 3.50, 'Which? 2024'),
-- Full refurb
('full_refurb', 'london', 1500, 3500, 15.00, 30.00, 'Savills 2024'),
('full_refurb', 'south_east', 1200, 2800, 12.00, 25.00, 'Savills 2024'),
('full_refurb', 'midlands', 900, 2200, 10.00, 22.00, 'Savills 2024'),
('full_refurb', 'north', 700, 1900, 8.00, 20.00, 'Savills 2024'),
('full_refurb', 'scotland', 800, 2000, 8.00, 19.00, 'Savills 2024')
ON CONFLICT (renovation_type, region) DO NOTHING;
