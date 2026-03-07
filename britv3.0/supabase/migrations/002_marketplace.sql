-- =============================================================================
-- Phase 4 Marketplace: Database Schema Migration
-- =============================================================================
-- Creates the marketplace tables for service providers, RFQs, quotes, bookings,
-- reviews, and moderation. Includes enums, triggers, indexes, RLS policies,
-- and the search_providers() function.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions (idempotent)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ---------------------------------------------------------------------------
-- Enum Types (6 new)
-- ---------------------------------------------------------------------------
CREATE TYPE service_category AS ENUM (
  'conveyancing',
  'surveying',
  'mortgage_broker',
  'moving_company',
  'home_inspector',
  'cleaning',
  'handyman',
  'plumber',
  'electrician',
  'landscaping',
  'interior_design',
  'architect',
  'property_management',
  'pest_control',
  'locksmith',
  'other'
);

CREATE TYPE verification_document_type AS ENUM (
  'identity_proof',
  'qualification_certificate',
  'insurance_certificate',
  'business_registration',
  'dbs_check',
  'reference_letter'
);

CREATE TYPE document_verification_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'more_info_required'
);

CREATE TYPE provider_verification_status AS ENUM (
  'unverified',
  'pending_review',
  'verified',
  'suspended',
  'rejected'
);

CREATE TYPE rfq_status AS ENUM (
  'open',
  'quotes_received',
  'awarded',
  'cancelled',
  'expired'
);

CREATE TYPE quote_status AS ENUM (
  'draft',
  'sent',
  'viewed',
  'accepted',
  'declined',
  'expired',
  'withdrawn'
);

CREATE TYPE booking_status AS ENUM (
  'pending_confirmation',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'disputed'
);

-- ---------------------------------------------------------------------------
-- ALTER profiles: add provider_verification_status column
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_verification_status provider_verification_status
    NOT NULL DEFAULT 'unverified';

-- ---------------------------------------------------------------------------
-- Table 1: service_provider_details
-- ---------------------------------------------------------------------------
CREATE TABLE public.service_provider_details (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_description TEXT,
  trading_name TEXT,
  company_number TEXT,
  vat_number TEXT,
  services service_category[] NOT NULL DEFAULT '{}',
  service_postcodes TEXT[] NOT NULL DEFAULT '{}',
  service_radius INTEGER DEFAULT 25,
  base_location GEOGRAPHY(Point, 4326),
  pricing JSONB DEFAULT '{}'::jsonb,
  qualifications TEXT[],
  accreditations TEXT[],
  insurance_details JSONB,
  portfolio_urls TEXT[],
  slug TEXT UNIQUE NOT NULL,
  website_url TEXT,
  years_in_business INTEGER DEFAULT 0,
  completed_jobs_count INTEGER DEFAULT 0,
  response_time_hours NUMERIC(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Table 2: provider_documents
-- ---------------------------------------------------------------------------
CREATE TABLE public.provider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type verification_document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  verification_status document_verification_status NOT NULL DEFAULT 'pending',
  expiry_date DATE,
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Table 3: provider_availability
-- ---------------------------------------------------------------------------
CREATE TABLE public.provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_provider_details(user_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT provider_availability_dates_valid CHECK (end_date >= start_date)
);

-- ---------------------------------------------------------------------------
-- Table 4: service_requests (RFQs)
-- ---------------------------------------------------------------------------
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_category service_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  property_address TEXT,
  property_postcode TEXT NOT NULL
    CONSTRAINT valid_uk_postcode CHECK (
      property_postcode ~* '^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$'
    ),
  property_location GEOGRAPHY(Point, 4326),
  preferred_start_date DATE,
  urgency_level TEXT NOT NULL DEFAULT 'normal'
    CHECK (urgency_level IN ('low', 'normal', 'high', 'emergency')),
  budget_min NUMERIC(10, 2),
  budget_max NUMERIC(10, 2),
  attachments JSONB DEFAULT '[]'::jsonb,
  status rfq_status NOT NULL DEFAULT 'open',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  view_count INTEGER DEFAULT 0,
  quote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Table 5: quotes
-- ---------------------------------------------------------------------------
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.service_provider_details(user_id) ON DELETE CASCADE,
  quote_number TEXT UNIQUE,
  total_amount NUMERIC(10, 2) NOT NULL,
  vat_included BOOLEAN NOT NULL DEFAULT FALSE,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  scope_of_work TEXT NOT NULL,
  estimated_duration TEXT,
  payment_terms TEXT,
  warranty_info TEXT,
  validity_date DATE,
  status quote_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique index: only one accepted quote per service request
CREATE UNIQUE INDEX idx_quotes_one_accepted_per_rfq
  ON quotes(service_request_id) WHERE status = 'accepted';

-- ---------------------------------------------------------------------------
-- Table 6: bookings
-- ---------------------------------------------------------------------------
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.service_provider_details(user_id) ON DELETE CASCADE,
  booking_reference TEXT UNIQUE,
  scheduled_start_date DATE NOT NULL,
  scheduled_end_date DATE NOT NULL,
  actual_start_date DATE,
  actual_end_date DATE,
  status booking_status NOT NULL DEFAULT 'pending_confirmation',
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT bookings_dates_valid CHECK (scheduled_end_date >= scheduled_start_date)
);

-- ---------------------------------------------------------------------------
-- Table 7: booking_state_transitions (lookup table)
-- ---------------------------------------------------------------------------
CREATE TABLE public.booking_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_status booking_status NOT NULL,
  to_status booking_status NOT NULL,
  allowed_by TEXT[] NOT NULL DEFAULT '{}',
  requires_reason BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(from_status, to_status)
);

-- Seed the 9 valid transitions
INSERT INTO public.booking_state_transitions (from_status, to_status, allowed_by, requires_reason) VALUES
  ('pending_confirmation', 'confirmed',    ARRAY['provider'],           FALSE),
  ('pending_confirmation', 'cancelled',    ARRAY['user', 'provider'],   TRUE),
  ('confirmed',            'in_progress',  ARRAY['provider'],           FALSE),
  ('confirmed',            'cancelled',    ARRAY['user', 'provider'],   TRUE),
  ('in_progress',          'completed',    ARRAY['provider'],           FALSE),
  ('in_progress',          'cancelled',    ARRAY['provider'],           TRUE),
  ('completed',            'disputed',     ARRAY['user'],               TRUE),
  ('cancelled',            'confirmed',    ARRAY['provider'],           FALSE),
  ('disputed',             'completed',    ARRAY['system'],             FALSE);

-- ---------------------------------------------------------------------------
-- Table 8: booking_status_history
-- ---------------------------------------------------------------------------
CREATE TABLE public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_status booking_status,
  to_status booking_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Table 9: reviews
-- ---------------------------------------------------------------------------
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.service_provider_details(user_id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
  professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  review_text TEXT NOT NULL,
  search_vector TSVECTOR,
  sentiment TEXT CHECK (sentiment IN ('very_negative', 'negative', 'neutral', 'positive', 'very_positive')),
  authenticity_score NUMERIC(5, 2) DEFAULT 0,
  fake_review_probability NUMERIC(5, 2) DEFAULT 0,
  spam_indicators JSONB DEFAULT '{}'::jsonb,
  moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  provider_response TEXT,
  provider_response_at TIMESTAMPTZ,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Table 10: review_helpfulness
-- ---------------------------------------------------------------------------
CREATE TABLE public.review_helpfulness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Table 11: review_flags
-- ---------------------------------------------------------------------------
CREATE TABLE public.review_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam', 'inappropriate', 'fake', 'off_topic',
    'contact_info', 'promotional', 'duplicate'
  )),
  description TEXT,
  admin_status TEXT DEFAULT 'pending'
    CHECK (admin_status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Table 12: moderation_queue
-- ---------------------------------------------------------------------------
CREATE TABLE public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  priority_score INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  decision TEXT CHECK (decision IN ('approved', 'rejected', 'flagged')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Table 13: provider_rating_stats
-- ---------------------------------------------------------------------------
CREATE TABLE public.provider_rating_stats (
  provider_id UUID PRIMARY KEY REFERENCES public.service_provider_details(user_id) ON DELETE CASCADE,
  average_rating NUMERIC(3, 2) DEFAULT 0,
  total_reviews BIGINT DEFAULT 0,
  avg_punctuality NUMERIC(3, 2) DEFAULT 0,
  avg_quality NUMERIC(3, 2) DEFAULT 0,
  avg_value NUMERIC(3, 2) DEFAULT 0,
  avg_professionalism NUMERIC(3, 2) DEFAULT 0,
  count_5_star INTEGER DEFAULT 0,
  count_4_star INTEGER DEFAULT 0,
  count_3_star INTEGER DEFAULT 0,
  count_2_star INTEGER DEFAULT 0,
  count_1_star INTEGER DEFAULT 0,
  total_helpful_votes BIGINT DEFAULT 0,
  reviews_with_responses INTEGER DEFAULT 0,
  response_rate NUMERIC(5, 2) DEFAULT 0,
  last_review_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- service_provider_details
CREATE INDEX idx_spd_services ON service_provider_details USING GIN (services);
CREATE INDEX idx_spd_base_location ON service_provider_details USING GIST (base_location);
CREATE INDEX idx_spd_service_postcodes ON service_provider_details USING GIN (service_postcodes);
CREATE INDEX idx_spd_slug ON service_provider_details (slug);

-- service_requests
CREATE INDEX idx_sr_user_status ON service_requests (user_id, status);
CREATE INDEX idx_sr_category_open ON service_requests (service_category, status)
  WHERE status = 'open';
CREATE INDEX idx_sr_property_location ON service_requests USING GIST (property_location);

-- quotes
CREATE INDEX idx_quotes_request_status ON quotes (service_request_id, status);
CREATE INDEX idx_quotes_provider_status ON quotes (provider_id, status);

-- bookings
CREATE INDEX idx_bookings_user_status ON bookings (user_id, status);
CREATE INDEX idx_bookings_provider_status ON bookings (provider_id, status);
CREATE INDEX idx_bookings_schedule_active ON bookings (scheduled_start_date)
  WHERE status IN ('confirmed', 'in_progress');

-- reviews
CREATE INDEX idx_reviews_provider_moderated ON reviews (provider_id, moderation_status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_search_vector ON reviews USING GIN (search_vector);

-- booking_status_history
CREATE INDEX idx_bsh_booking ON booking_status_history (booking_id);

-- provider_availability
CREATE INDEX idx_pa_provider_dates ON provider_availability (provider_id, start_date, end_date);

-- moderation_queue
CREATE INDEX idx_mq_priority ON moderation_queue (priority_score DESC)
  WHERE completed_at IS NULL;

-- ---------------------------------------------------------------------------
-- Trigger: updated_at for marketplace tables
-- ---------------------------------------------------------------------------
-- Reuse the update_updated_at() function from 001_foundation.sql

CREATE TRIGGER service_provider_details_updated_at
  BEFORE UPDATE ON service_provider_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER provider_documents_updated_at
  BEFORE UPDATE ON provider_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER provider_availability_updated_at
  BEFORE UPDATE ON provider_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger Function: generate_quote_number
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.quote_number := 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_generate_number
  BEFORE INSERT ON quotes
  FOR EACH ROW EXECUTE FUNCTION generate_quote_number();

-- ---------------------------------------------------------------------------
-- Trigger Function: generate_booking_reference
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_reference := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_generate_reference
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_reference();

-- ---------------------------------------------------------------------------
-- Trigger Function: update_completed_jobs_count
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_completed_jobs_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE service_provider_details
    SET completed_jobs_count = completed_jobs_count + 1
    WHERE user_id = NEW.provider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_update_completed_count
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_completed_jobs_count();

-- ---------------------------------------------------------------------------
-- Trigger Function: update_provider_rating_stats_incremental
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_provider_rating_stats_incremental()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.moderation_status = 'approved' AND (OLD IS NULL OR OLD.moderation_status != 'approved') THEN
    INSERT INTO provider_rating_stats (provider_id, average_rating, total_reviews, last_review_date)
    VALUES (NEW.provider_id, NEW.overall_rating, 1, NOW())
    ON CONFLICT (provider_id) DO UPDATE SET
      average_rating = (
        (provider_rating_stats.average_rating * provider_rating_stats.total_reviews + NEW.overall_rating)
        / (provider_rating_stats.total_reviews + 1)
      ),
      total_reviews = provider_rating_stats.total_reviews + 1,
      avg_punctuality = CASE
        WHEN NEW.punctuality_rating IS NOT NULL THEN
          (provider_rating_stats.avg_punctuality * provider_rating_stats.total_reviews + NEW.punctuality_rating)
          / (provider_rating_stats.total_reviews + 1)
        ELSE provider_rating_stats.avg_punctuality
      END,
      avg_quality = CASE
        WHEN NEW.quality_rating IS NOT NULL THEN
          (provider_rating_stats.avg_quality * provider_rating_stats.total_reviews + NEW.quality_rating)
          / (provider_rating_stats.total_reviews + 1)
        ELSE provider_rating_stats.avg_quality
      END,
      avg_value = CASE
        WHEN NEW.value_rating IS NOT NULL THEN
          (provider_rating_stats.avg_value * provider_rating_stats.total_reviews + NEW.value_rating)
          / (provider_rating_stats.total_reviews + 1)
        ELSE provider_rating_stats.avg_value
      END,
      avg_professionalism = CASE
        WHEN NEW.professionalism_rating IS NOT NULL THEN
          (provider_rating_stats.avg_professionalism * provider_rating_stats.total_reviews + NEW.professionalism_rating)
          / (provider_rating_stats.total_reviews + 1)
        ELSE provider_rating_stats.avg_professionalism
      END,
      count_5_star = provider_rating_stats.count_5_star + CASE WHEN NEW.overall_rating = 5 THEN 1 ELSE 0 END,
      count_4_star = provider_rating_stats.count_4_star + CASE WHEN NEW.overall_rating = 4 THEN 1 ELSE 0 END,
      count_3_star = provider_rating_stats.count_3_star + CASE WHEN NEW.overall_rating = 3 THEN 1 ELSE 0 END,
      count_2_star = provider_rating_stats.count_2_star + CASE WHEN NEW.overall_rating = 2 THEN 1 ELSE 0 END,
      count_1_star = provider_rating_stats.count_1_star + CASE WHEN NEW.overall_rating = 1 THEN 1 ELSE 0 END,
      last_review_date = NOW(),
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_update_rating_stats
  AFTER UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_provider_rating_stats_incremental();

-- ---------------------------------------------------------------------------
-- Trigger Function: on_review_created (authenticity scoring)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_review_created()
RETURNS TRIGGER AS $$
DECLARE
  v_user_review_count INTEGER;
  v_booking_completed_at TIMESTAMPTZ;
  v_hours_since_completion NUMERIC;
  v_text_len INTEGER;
  v_caps_ratio NUMERIC;
  v_authenticity NUMERIC := 50;
  v_fake_probability NUMERIC := 0;
BEGIN
  -- Count reviewer's previous reviews
  SELECT COUNT(*) INTO v_user_review_count
  FROM reviews
  WHERE reviewer_id = NEW.reviewer_id AND id != NEW.id;

  -- Get booking completion time
  SELECT updated_at INTO v_booking_completed_at
  FROM bookings
  WHERE id = NEW.booking_id AND status = 'completed';

  IF v_booking_completed_at IS NOT NULL THEN
    v_hours_since_completion := EXTRACT(EPOCH FROM (NOW() - v_booking_completed_at)) / 3600;
  ELSE
    v_hours_since_completion := 0;
  END IF;

  -- Text analysis
  v_text_len := LENGTH(NEW.review_text);
  v_caps_ratio := CASE
    WHEN v_text_len > 0 THEN
      LENGTH(REGEXP_REPLACE(NEW.review_text, '[^A-Z]', '', 'g'))::NUMERIC / v_text_len
    ELSE 0
  END;

  -- Authenticity scoring
  -- User has review history (more credible)
  IF v_user_review_count > 0 THEN
    v_authenticity := v_authenticity + LEAST(v_user_review_count * 5, 20);
  END IF;

  -- Review written within reasonable time (1-720 hours after completion)
  IF v_hours_since_completion BETWEEN 1 AND 720 THEN
    v_authenticity := v_authenticity + 15;
  END IF;

  -- Review has reasonable length (50-1000 chars is ideal)
  IF v_text_len BETWEEN 50 AND 1000 THEN
    v_authenticity := v_authenticity + 10;
  END IF;

  -- Fake probability indicators
  -- Too fast (< 5 minutes after completion)
  IF v_hours_since_completion < 0.083 THEN
    v_fake_probability := v_fake_probability + 20;
  END IF;

  -- Too much ALL CAPS (> 30%)
  IF v_caps_ratio > 0.3 THEN
    v_fake_probability := v_fake_probability + 15;
  END IF;

  -- Extreme rating with short text
  IF (NEW.overall_rating IN (1, 5)) AND v_text_len < 50 THEN
    v_fake_probability := v_fake_probability + 10;
  END IF;

  -- No review history for this user
  IF v_user_review_count = 0 THEN
    v_fake_probability := v_fake_probability + 5;
  END IF;

  -- Clamp values
  NEW.authenticity_score := LEAST(GREATEST(v_authenticity, 0), 100);
  NEW.fake_review_probability := LEAST(GREATEST(v_fake_probability, 0), 100);

  -- Update search vector
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.review_text, '')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_on_created
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION on_review_created();

-- ---------------------------------------------------------------------------
-- Row Level Security: Enable on ALL marketplace tables
-- ---------------------------------------------------------------------------
ALTER TABLE service_provider_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpfulness ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_rating_stats ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS Policies: service_provider_details
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can view verified providers" ON service_provider_details
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = service_provider_details.user_id
        AND provider_verification_status = 'verified'
        AND deleted_at IS NULL
    )
  );

CREATE POLICY "Providers can manage own details" ON service_provider_details
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS Policies: provider_documents
-- ---------------------------------------------------------------------------
CREATE POLICY "Providers can manage own documents" ON provider_documents
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all documents" ON provider_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ---------------------------------------------------------------------------
-- RLS Policies: provider_availability
-- ---------------------------------------------------------------------------
CREATE POLICY "Providers can manage own availability" ON provider_availability
  FOR ALL TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Public can view provider availability" ON provider_availability
  FOR SELECT TO authenticated
  USING (TRUE);

-- ---------------------------------------------------------------------------
-- RLS Policies: service_requests
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can manage own RFQs" ON service_requests
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Verified providers can view open RFQs" ON service_requests
  FOR SELECT TO authenticated
  USING (
    status = 'open'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND provider_verification_status = 'verified'
    )
  );

-- ---------------------------------------------------------------------------
-- RLS Policies: quotes
-- ---------------------------------------------------------------------------
CREATE POLICY "Providers can manage own quotes" ON quotes
  FOR ALL TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "RFQ owners can view quotes for their RFQs" ON quotes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_requests
      WHERE id = quotes.service_request_id
        AND user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RLS Policies: bookings
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Providers can view their bookings" ON bookings
  FOR SELECT TO authenticated
  USING (provider_id = auth.uid());

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Booking parties can update" ON bookings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR provider_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR provider_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS Policies: booking_state_transitions (public read)
-- ---------------------------------------------------------------------------
CREATE POLICY "Anyone can view transitions" ON booking_state_transitions
  FOR SELECT TO authenticated
  USING (TRUE);

-- ---------------------------------------------------------------------------
-- RLS Policies: booking_status_history
-- ---------------------------------------------------------------------------
CREATE POLICY "Booking parties can view history" ON booking_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_status_history.booking_id
        AND (user_id = auth.uid() OR provider_id = auth.uid())
    )
  );

CREATE POLICY "System can insert history" ON booking_status_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_status_history.booking_id
        AND (user_id = auth.uid() OR provider_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- RLS Policies: reviews
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can view approved reviews" ON reviews
  FOR SELECT TO authenticated
  USING (moderation_status = 'approved' AND deleted_at IS NULL);

CREATE POLICY "Reviewers can view own reviews" ON reviews
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "Users can create reviews for own completed bookings" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE id = reviews.booking_id
        AND user_id = auth.uid()
        AND status = 'completed'
    )
  );

CREATE POLICY "Providers can update own response" ON reviews
  FOR UPDATE TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS Policies: review_helpfulness
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can manage own helpfulness votes" ON review_helpfulness
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS Policies: review_flags
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can flag reviews" ON review_flags
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own flags" ON review_flags
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all flags" ON review_flags
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ---------------------------------------------------------------------------
-- RLS Policies: moderation_queue
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can manage moderation queue" ON moderation_queue
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ---------------------------------------------------------------------------
-- RLS Policies: provider_rating_stats
-- ---------------------------------------------------------------------------
CREATE POLICY "Public can view rating stats" ON provider_rating_stats
  FOR SELECT TO authenticated
  USING (TRUE);

-- ---------------------------------------------------------------------------
-- Function: search_providers()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_providers(
  p_service_category service_category DEFAULT NULL,
  p_postcode TEXT DEFAULT NULL,
  p_lat FLOAT DEFAULT NULL,
  p_lng FLOAT DEFAULT NULL,
  p_radius_miles INTEGER DEFAULT 25,
  p_min_rating NUMERIC DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  provider_id UUID,
  business_name TEXT,
  business_description TEXT,
  services service_category[],
  average_rating NUMERIC,
  review_count BIGINT,
  distance_miles NUMERIC,
  slug TEXT,
  avatar_url TEXT,
  years_in_business INTEGER,
  completed_jobs_count INTEGER
) AS $$
DECLARE
  search_location GEOGRAPHY;
  radius_meters INTEGER;
BEGIN
  radius_meters := p_radius_miles * 1609;

  IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    search_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  END IF;

  RETURN QUERY
  SELECT
    spd.user_id,
    spd.business_name,
    spd.business_description,
    spd.services,
    COALESCE(prs.average_rating, 0::NUMERIC),
    COALESCE(prs.total_reviews, 0::BIGINT),
    CASE
      WHEN search_location IS NOT NULL AND spd.base_location IS NOT NULL THEN
        ROUND((ST_Distance(spd.base_location, search_location) / 1609)::NUMERIC, 1)
      ELSE NULL
    END,
    spd.slug,
    p.avatar_url,
    spd.years_in_business,
    spd.completed_jobs_count
  FROM service_provider_details spd
  JOIN profiles p ON spd.user_id = p.id
  LEFT JOIN provider_rating_stats prs ON spd.user_id = prs.provider_id
  WHERE
    p.provider_verification_status = 'verified'
    AND p.deleted_at IS NULL
    AND (p_service_category IS NULL OR p_service_category = ANY(spd.services))
    AND (
      search_location IS NULL
      OR spd.base_location IS NULL
      OR ST_DWithin(spd.base_location, search_location, radius_meters)
      OR p_postcode = ANY(spd.service_postcodes)
    )
    AND (p_min_rating IS NULL OR COALESCE(prs.average_rating, 0) >= p_min_rating)
    AND (
      p_search_query IS NULL
      OR to_tsvector('english',
        COALESCE(spd.business_name, '') || ' ' ||
        COALESCE(spd.business_description, '')
      ) @@ plainto_tsquery('english', p_search_query)
    )
  ORDER BY
    CASE WHEN p_postcode = ANY(spd.service_postcodes) THEN 0 ELSE 1 END,
    CASE WHEN search_location IS NOT NULL AND spd.base_location IS NOT NULL
      THEN ST_Distance(spd.base_location, search_location) ELSE 999999999 END,
    COALESCE(prs.average_rating, 0) DESC,
    COALESCE(prs.total_reviews, 0) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
