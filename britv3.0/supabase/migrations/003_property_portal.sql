-- 003_property_portal.sql
-- Property portal schema: PostGIS, FTS, materialized views, RLS
-- Tables: properties, listings, property_media, price_history,
--         saved_properties, saved_searches, search_analytics, viewing_history

-- ===========================================================================
-- Extensions
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===========================================================================
-- Enums
-- ===========================================================================

CREATE TYPE property_type AS ENUM (
  'detached', 'semi_detached', 'terraced', 'flat', 'bungalow',
  'land', 'cottage', 'penthouse', 'studio', 'maisonette', 'other'
);

CREATE TYPE listing_type AS ENUM ('sale', 'rent');

CREATE TYPE listing_status AS ENUM (
  'draft', 'active', 'under_offer', 'sold', 'let', 'withdrawn', 'archived'
);

CREATE TYPE tenure_type AS ENUM ('freehold', 'leasehold', 'shared_ownership');

CREATE TYPE media_type AS ENUM ('image', 'floor_plan', 'epc_document');

-- ===========================================================================
-- Tables
-- ===========================================================================

-- Properties table (physical asset)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  county TEXT,
  postcode TEXT NOT NULL,
  coordinates GEOGRAPHY(POINT, 4326),
  property_type property_type NOT NULL,
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0 AND bedrooms <= 50),
  bathrooms NUMERIC(3,1) NOT NULL CHECK (bathrooms >= 0),
  reception_rooms INTEGER CHECK (reception_rooms >= 0),
  square_footage INTEGER CHECK (square_footage > 0),
  title TEXT NOT NULL CHECK (LENGTH(title) <= 200),
  description TEXT NOT NULL CHECK (LENGTH(description) <= 5000),
  description_tsv TSVECTOR,
  features JSONB DEFAULT '{}'::jsonb,
  epc_rating CHAR(1) CHECK (epc_rating IN ('A','B','C','D','E','F','G')),
  epc_score INTEGER CHECK (epc_score BETWEEN 1 AND 100),
  tenure tenure_type,
  lease_remaining_years INTEGER CHECK (lease_remaining_years >= 0),
  council_tax_band CHAR(1) CHECK (council_tax_band IN ('A','B','C','D','E','F','G','H')),
  year_built INTEGER CHECK (year_built >= 1600 AND year_built <= 2050),
  new_build BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT valid_postcode CHECK (postcode ~ '^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$')
);

-- Listings table (market offering)
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_type listing_type NOT NULL,
  status listing_status DEFAULT 'draft',
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  rent_frequency TEXT CHECK (rent_frequency IN ('weekly', 'monthly', 'yearly')),
  price_qualifier TEXT CHECK (price_qualifier IN ('offers_over', 'guide_price', 'fixed_price', 'from', 'poa')),
  service_charge_annual NUMERIC(10,2),
  ground_rent_annual NUMERIC(10,2),
  listed_date DATE DEFAULT CURRENT_DATE,
  available_from DATE,
  slug TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,
  enquiry_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT valid_rent_freq CHECK (
    (listing_type = 'rent' AND rent_frequency IS NOT NULL) OR listing_type = 'sale'
  )
);

-- Property media (images, floor plans, EPC documents)
CREATE TABLE property_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  media_type media_type NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  file_size INTEGER,
  original_filename TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price history (tracked via trigger)
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  old_price NUMERIC(12,2) NOT NULL,
  new_price NUMERIC(12,2) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id)
);

-- Saved properties (user shortlist)
CREATE TABLE saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Saved searches (with alert preferences)
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  alerts_enabled BOOLEAN DEFAULT TRUE,
  alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
  last_alerted_at TIMESTAMPTZ,
  new_results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search analytics (query logging)
CREATE TABLE search_analytics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  filters JSONB NOT NULL,
  result_count INTEGER NOT NULL,
  query_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viewing history (track which listings user has viewed)
CREATE TABLE viewing_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- ===========================================================================
-- Triggers
-- ===========================================================================

-- Auto-generate description_tsv from title + description + city
CREATE OR REPLACE FUNCTION update_properties_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.description_tsv :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_properties_tsv
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_properties_tsv();

-- Auto-update updated_at on properties
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on listings
CREATE TRIGGER trg_update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Track price changes on listings
CREATE OR REPLACE FUNCTION track_price_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO price_history (listing_id, old_price, new_price, changed_by)
    VALUES (NEW.id, OLD.price, NEW.price, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_track_price_changes
  AFTER UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION track_price_changes();

-- Generate listing slug from property address + listing_type
CREATE OR REPLACE FUNCTION generate_listing_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  SELECT
    LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          p.address_line1 || '-' || p.city || '-' || NEW.listing_type,
          '[^a-zA-Z0-9\-]', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    )
  INTO base_slug
  FROM properties p
  WHERE p.id = NEW.property_id;

  -- Trim leading/trailing hyphens
  base_slug := TRIM(BOTH '-' FROM base_slug);
  final_slug := base_slug;

  -- Handle uniqueness
  WHILE EXISTS (SELECT 1 FROM listings WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_listing_slug
  BEFORE INSERT ON listings
  FOR EACH ROW EXECUTE FUNCTION generate_listing_slug();

-- ===========================================================================
-- Indexes
-- ===========================================================================

-- Geospatial index on property coordinates
CREATE INDEX idx_properties_coordinates ON properties USING GIST (coordinates);

-- Full-text search index
CREATE INDEX idx_properties_description_tsv ON properties USING GIN (description_tsv);

-- Features JSONB index
CREATE INDEX idx_properties_features ON properties USING GIN (features);

-- Composite index for filtered searches (listing_type + status + price)
CREATE INDEX idx_listings_search ON listings (listing_type, status, price);

-- Index for sorting by date
CREATE INDEX idx_listings_listed_date ON listings (listed_date DESC);

-- Index for my-listings queries
CREATE INDEX idx_listings_user_id ON listings (user_id);

-- Index on property_media for listing media queries
CREATE INDEX idx_property_media_listing_sort ON property_media (listing_id, sort_order);

-- Index on saved_searches by user
CREATE INDEX idx_saved_searches_user_id ON saved_searches (user_id);

-- ===========================================================================
-- Materialized View: search_listings
-- ===========================================================================

CREATE MATERIALIZED VIEW search_listings AS
SELECT
  l.id AS listing_id,
  p.id AS property_id,
  l.listing_type,
  l.status,
  l.price,
  p.property_type,
  p.bedrooms,
  p.bathrooms,
  p.city,
  p.postcode,
  p.coordinates,
  p.description_tsv,
  p.features,
  p.epc_rating,
  p.new_build,
  l.listed_date,
  l.slug,
  pm.thumbnail_url,
  p.title,
  p.address_line1,
  l.rent_frequency,
  l.price_qualifier,
  p.reception_rooms,
  p.square_footage,
  l.view_count,
  l.favorite_count,
  l.enquiry_count
FROM listings l
JOIN properties p ON p.id = l.property_id
LEFT JOIN property_media pm ON pm.listing_id = l.id AND pm.sort_order = 0 AND pm.media_type = 'image'
WHERE l.status = 'active'
  AND l.deleted_at IS NULL
  AND p.deleted_at IS NULL;

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_search_listings_listing_id ON search_listings (listing_id);

-- Additional indexes on materialized view for search performance
CREATE INDEX idx_search_listings_type_price ON search_listings (listing_type, price);
CREATE INDEX idx_search_listings_coordinates ON search_listings USING GIST (coordinates);
CREATE INDEX idx_search_listings_tsv ON search_listings USING GIN (description_tsv);

-- ===========================================================================
-- RPC Functions
-- ===========================================================================

-- Search listings by radius (PostGIS)
CREATE OR REPLACE FUNCTION search_listings_by_radius(
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION,
  p_listing_type listing_type DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_bedrooms INTEGER DEFAULT NULL,
  p_property_type property_type DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_cursor UUID DEFAULT NULL
)
RETURNS TABLE (
  listing_id UUID,
  property_id UUID,
  listing_type listing_type,
  status listing_status,
  price NUMERIC,
  property_type property_type,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  city TEXT,
  postcode TEXT,
  epc_rating CHAR(1),
  new_build BOOLEAN,
  listed_date DATE,
  slug TEXT,
  thumbnail_url TEXT,
  title TEXT,
  address_line1 TEXT,
  rent_frequency TEXT,
  price_qualifier TEXT,
  distance_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sl.listing_id,
    sl.property_id,
    sl.listing_type,
    sl.status,
    sl.price,
    sl.property_type,
    sl.bedrooms,
    sl.bathrooms,
    sl.city,
    sl.postcode,
    sl.epc_rating,
    sl.new_build,
    sl.listed_date,
    sl.slug,
    sl.thumbnail_url,
    sl.title,
    sl.address_line1,
    sl.rent_frequency,
    sl.price_qualifier,
    ST_Distance(
      sl.coordinates,
      ST_MakePoint(center_lng, center_lat)::geography
    ) AS distance_meters
  FROM search_listings sl
  WHERE ST_DWithin(
    sl.coordinates,
    ST_MakePoint(center_lng, center_lat)::geography,
    radius_meters
  )
  AND (p_listing_type IS NULL OR sl.listing_type = p_listing_type)
  AND (p_min_price IS NULL OR sl.price >= p_min_price)
  AND (p_max_price IS NULL OR sl.price <= p_max_price)
  AND (p_min_bedrooms IS NULL OR sl.bedrooms >= p_min_bedrooms)
  AND (p_property_type IS NULL OR sl.property_type = p_property_type)
  AND (p_cursor IS NULL OR sl.listing_id > p_cursor)
  ORDER BY distance_meters ASC, sl.listing_id ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Search listings by polygon (PostGIS)
CREATE OR REPLACE FUNCTION search_listings_by_polygon(
  polygon_geojson TEXT,
  p_listing_type listing_type DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_bedrooms INTEGER DEFAULT NULL,
  p_property_type property_type DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_cursor UUID DEFAULT NULL
)
RETURNS TABLE (
  listing_id UUID,
  property_id UUID,
  listing_type listing_type,
  status listing_status,
  price NUMERIC,
  property_type property_type,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  city TEXT,
  postcode TEXT,
  epc_rating CHAR(1),
  new_build BOOLEAN,
  listed_date DATE,
  slug TEXT,
  thumbnail_url TEXT,
  title TEXT,
  address_line1 TEXT,
  rent_frequency TEXT,
  price_qualifier TEXT
) AS $$
DECLARE
  poly GEOMETRY;
BEGIN
  poly := ST_GeomFromGeoJSON(polygon_geojson);

  RETURN QUERY
  SELECT
    sl.listing_id,
    sl.property_id,
    sl.listing_type,
    sl.status,
    sl.price,
    sl.property_type,
    sl.bedrooms,
    sl.bathrooms,
    sl.city,
    sl.postcode,
    sl.epc_rating,
    sl.new_build,
    sl.listed_date,
    sl.slug,
    sl.thumbnail_url,
    sl.title,
    sl.address_line1,
    sl.rent_frequency,
    sl.price_qualifier
  FROM search_listings sl
  WHERE ST_Intersects(
    sl.coordinates::geometry,
    ST_Envelope(poly)  -- Bounding box pre-filter (uses GIST index)
  )
  AND ST_Within(
    sl.coordinates::geometry,
    poly  -- Exact polygon check
  )
  AND (p_listing_type IS NULL OR sl.listing_type = p_listing_type)
  AND (p_min_price IS NULL OR sl.price >= p_min_price)
  AND (p_max_price IS NULL OR sl.price <= p_max_price)
  AND (p_min_bedrooms IS NULL OR sl.bedrooms >= p_min_bedrooms)
  AND (p_property_type IS NULL OR sl.property_type = p_property_type)
  AND (p_cursor IS NULL OR sl.listing_id > p_cursor)
  ORDER BY sl.listed_date DESC, sl.listing_id ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Refresh materialized view wrapper
CREATE OR REPLACE FUNCTION refresh_search_listings()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY search_listings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================================================
-- RLS Policies
-- ===========================================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewing_history ENABLE ROW LEVEL SECURITY;

-- Properties: SELECT for all authenticated
CREATE POLICY properties_select ON properties
  FOR SELECT TO authenticated USING (TRUE);

-- Properties: INSERT for authenticated users
CREATE POLICY properties_insert ON properties
  FOR INSERT TO authenticated WITH CHECK (TRUE);

-- Properties: UPDATE for owner (via listing user_id)
CREATE POLICY properties_update ON properties
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.property_id = properties.id AND l.user_id = auth.uid()
    )
  );

-- Listings: SELECT active listings for anyone (including anon)
CREATE POLICY listings_select_active ON listings
  FOR SELECT USING (status = 'active' AND deleted_at IS NULL);

-- Listings: SELECT all own listings for owner
CREATE POLICY listings_select_own ON listings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Listings: INSERT for authenticated
CREATE POLICY listings_insert ON listings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Listings: UPDATE for owner
CREATE POLICY listings_update ON listings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Listings: DELETE (soft) for owner
CREATE POLICY listings_delete ON listings
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Property media: SELECT via listing access (same visibility as listing)
CREATE POLICY property_media_select ON property_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = property_media.listing_id
        AND (l.status = 'active' OR l.user_id = auth.uid())
    )
  );

-- Property media: INSERT for listing owner
CREATE POLICY property_media_insert ON property_media
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = property_media.listing_id AND l.user_id = auth.uid()
    )
  );

-- Property media: UPDATE for listing owner
CREATE POLICY property_media_update ON property_media
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = property_media.listing_id AND l.user_id = auth.uid()
    )
  );

-- Property media: DELETE for listing owner
CREATE POLICY property_media_delete ON property_media
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = property_media.listing_id AND l.user_id = auth.uid()
    )
  );

-- Price history: SELECT for all authenticated
CREATE POLICY price_history_select ON price_history
  FOR SELECT TO authenticated USING (TRUE);

-- Price history: INSERT restricted (trigger only, no direct inserts)
-- The trigger uses SECURITY DEFINER to bypass RLS

-- Saved properties: Full CRUD for own records
CREATE POLICY saved_properties_select ON saved_properties
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY saved_properties_insert ON saved_properties
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY saved_properties_update ON saved_properties
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY saved_properties_delete ON saved_properties
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Saved searches: Full CRUD for own records
CREATE POLICY saved_searches_select ON saved_searches
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY saved_searches_insert ON saved_searches
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY saved_searches_update ON saved_searches
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY saved_searches_delete ON saved_searches
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Search analytics: INSERT for authenticated, SELECT for admin only
CREATE POLICY search_analytics_insert ON search_analytics
  FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY search_analytics_select ON search_analytics
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- Viewing history: Full CRUD for own records
CREATE POLICY viewing_history_select ON viewing_history
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY viewing_history_insert ON viewing_history
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY viewing_history_update ON viewing_history
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY viewing_history_delete ON viewing_history
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ===========================================================================
-- Storage Buckets (comments for manual creation in Supabase dashboard)
-- ===========================================================================

-- property-images bucket: public read, authenticated write
-- Folder structure: property-images/{listing_id}/{hash}.webp
-- Policy: Authenticated users can upload to their own listing folders
-- Public read access for all images

-- property-documents bucket: private
-- Folder structure: property-documents/{listing_id}/{filename}
-- Policy: Authenticated read/write for listing owners only
-- Signed URLs for temporary access
