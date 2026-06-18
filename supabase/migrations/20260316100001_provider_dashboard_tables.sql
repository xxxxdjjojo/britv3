-- ============================================================
-- Phase 16: Provider Dashboard Foundation Tables
-- Creates 11 new tables, extends enums, adds RLS policies,
-- indexes, and triggers for the Tradesperson Dashboard.
-- Depends on: service_provider_details (002_marketplace.sql),
--             bookings (002_marketplace.sql), profiles, auth.users
-- ============================================================

-- ============================================================
-- SECTION 0: Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- SECTION 1: New enum types (idempotent)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE provider_reference_type AS ENUM ('client', 'peer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE provider_reference_status AS ENUM ('pending', 'submitted', 'verified');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- SECTION 2: Extend verification_document_type enum
-- ============================================================

ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'gas_safe_certificate';
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'niceic_registration';
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'napit_registration';
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'cscs_card';
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'part_p_certificate';
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'acs_qualification';
ALTER TYPE verification_document_type ADD VALUE IF NOT EXISTS 'public_liability_insurance';

-- ============================================================
-- SECTION 3: Extend provider_availability
-- ============================================================

ALTER TABLE provider_availability
  ADD COLUMN IF NOT EXISTS recurring_rules JSONB NOT NULL DEFAULT '[]';

-- ============================================================
-- SECTION 4: provider_services
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('hourly', 'fixed', 'quote_on_request')),
  price_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_services_provider_id
  ON provider_services (provider_id);

ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_services_select_own"
  ON provider_services FOR SELECT
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_services_insert_own"
  ON provider_services FOR INSERT
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_services_update_own"
  ON provider_services FOR UPDATE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_services_delete_own"
  ON provider_services FOR DELETE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER provider_services_updated_at
  BEFORE UPDATE ON provider_services
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Anon public-read policy (relocated from 017_public_profiles.sql, which ran
-- before this table existed — schema-drift / migration-ordering fix).
CREATE POLICY "Anon can view provider services"
  ON provider_services FOR SELECT TO anon
  USING (TRUE);

-- ============================================================
-- SECTION 5: provider_references
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(user_id) ON DELETE CASCADE,
  reference_type provider_reference_type NOT NULL,
  referee_name TEXT NOT NULL,
  referee_email TEXT NOT NULL,
  referee_phone TEXT,
  relationship TEXT,
  status provider_reference_status NOT NULL DEFAULT 'pending',
  reference_text TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_provider_references_provider_id
  ON provider_references (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_references_status
  ON provider_references (status);

ALTER TABLE provider_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_references_select_own"
  ON provider_references FOR SELECT
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_references_insert_own"
  ON provider_references FOR INSERT
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_references_update_own"
  ON provider_references FOR UPDATE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_references_delete_own"
  ON provider_references FOR DELETE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- SECTION 6: provider_badges
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(user_id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_label TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_provider_badges_provider_id
  ON provider_badges (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_badges_is_active
  ON provider_badges (provider_id, is_active);

ALTER TABLE provider_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_badges_select_own"
  ON provider_badges FOR SELECT
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_badges_insert_own"
  ON provider_badges FOR INSERT
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_badges_update_own"
  ON provider_badges FOR UPDATE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_badges_delete_own"
  ON provider_badges FOR DELETE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- SECTION 7: provider_portfolio_items (Phase 16 extended version)
-- Note: 017_public_profiles.sql already created provider_portfolio_items.
-- This migration adds before_image_path, after_image_path, is_featured,
-- display_order columns if they do not exist.
-- ============================================================

ALTER TABLE provider_portfolio_items
  ADD COLUMN IF NOT EXISTS before_image_path TEXT,
  ADD COLUMN IF NOT EXISTS after_image_path TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- SECTION 8: provider_invoices
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(user_id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  client_id UUID NOT NULL REFERENCES auth.users(id),
  invoice_number TEXT NOT NULL UNIQUE,
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10, 2) NOT NULL,
  vat_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_invoices_provider_id
  ON provider_invoices (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_invoices_client_id
  ON provider_invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_provider_invoices_booking_id
  ON provider_invoices (booking_id);
CREATE INDEX IF NOT EXISTS idx_provider_invoices_status
  ON provider_invoices (status);
CREATE INDEX IF NOT EXISTS idx_provider_invoices_stripe_payment_intent
  ON provider_invoices (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

ALTER TABLE provider_invoices ENABLE ROW LEVEL SECURITY;

-- Provider can manage own invoices
CREATE POLICY "provider_invoices_select_own"
  ON provider_invoices FOR SELECT
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_invoices_insert_own"
  ON provider_invoices FOR INSERT
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_invoices_update_own"
  ON provider_invoices FOR UPDATE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_invoices_delete_own"
  ON provider_invoices FOR DELETE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

-- Client can view invoices addressed to them
CREATE POLICY "provider_invoices_select_client"
  ON provider_invoices FOR SELECT
  USING (client_id = auth.uid());

CREATE TRIGGER provider_invoices_updated_at
  BEFORE UPDATE ON provider_invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SECTION 9: stripe_connect_accounts
-- ============================================================

CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL UNIQUE REFERENCES service_provider_details(user_id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  details_submitted BOOLEAN NOT NULL DEFAULT false,
  kyc_status TEXT,
  last_payout_amount BIGINT,
  last_payout_status TEXT,
  last_payout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_provider_id
  ON stripe_connect_accounts (provider_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_stripe_account_id
  ON stripe_connect_accounts (stripe_account_id);

ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_connect_accounts_select_own"
  ON stripe_connect_accounts FOR SELECT
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "stripe_connect_accounts_insert_own"
  ON stripe_connect_accounts FOR INSERT
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "stripe_connect_accounts_update_own"
  ON stripe_connect_accounts FOR UPDATE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER stripe_connect_accounts_updated_at
  BEFORE UPDATE ON stripe_connect_accounts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SECTION 10: provider_boosts
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(user_id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('featured_profile', 'area_spotlight', 'category_top')),
  coverage_area TEXT,
  duration_days INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_paid NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_boosts_provider_id
  ON provider_boosts (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_boosts_active
  ON provider_boosts (is_active, ends_at)
  WHERE is_active = true;

ALTER TABLE provider_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_boosts_select_own"
  ON provider_boosts FOR SELECT
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_boosts_insert_own"
  ON provider_boosts FOR INSERT
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_boosts_update_own"
  ON provider_boosts FOR UPDATE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_boosts_delete_own"
  ON provider_boosts FOR DELETE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- SECTION 11: provider_referrals
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES service_provider_details(user_id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'verified', 'rewarded')),
  reward_amount NUMERIC(10, 2) DEFAULT 50.00,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_referrals_referrer_id
  ON provider_referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_provider_referrals_referral_code
  ON provider_referrals (referral_code);
CREATE INDEX IF NOT EXISTS idx_provider_referrals_referred_user_id
  ON provider_referrals (referred_user_id)
  WHERE referred_user_id IS NOT NULL;

ALTER TABLE provider_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_referrals_select_own"
  ON provider_referrals FOR SELECT
  USING (
    referrer_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_referrals_insert_own"
  ON provider_referrals FOR INSERT
  WITH CHECK (
    referrer_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_referrals_update_own"
  ON provider_referrals FOR UPDATE
  USING (
    referrer_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    referrer_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- SECTION 12: provider_service_areas
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(user_id) ON DELETE CASCADE,
  name TEXT,
  zone geometry(MultiPolygon, 4326) NOT NULL,
  radius_km NUMERIC(6, 2),
  zone_type TEXT NOT NULL DEFAULT 'polygon' CHECK (zone_type IN ('radius', 'polygon')),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_service_areas_provider_id
  ON provider_service_areas (provider_id);

-- GiST index for spatial queries
CREATE INDEX IF NOT EXISTS idx_provider_service_areas_zone
  ON provider_service_areas USING GIST (zone);

ALTER TABLE provider_service_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_service_areas_select_own"
  ON provider_service_areas FOR SELECT
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_service_areas_insert_own"
  ON provider_service_areas FOR INSERT
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_service_areas_update_own"
  ON provider_service_areas FOR UPDATE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "provider_service_areas_delete_own"
  ON provider_service_areas FOR DELETE
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER provider_service_areas_updated_at
  BEFORE UPDATE ON provider_service_areas
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SECTION 13: stripe_events (webhook idempotency)
-- ============================================================

CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  account_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id
  ON stripe_events (event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_type
  ON stripe_events (event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at
  ON stripe_events (processed_at DESC);

-- Service role only — no user-level access
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_events_service_role_only"
  ON stripe_events FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- SECTION 14: provider_analytics_daily
-- ============================================================

CREATE TABLE IF NOT EXISTS provider_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider_details(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  profile_views INTEGER NOT NULL DEFAULT 0,
  enquiries_received INTEGER NOT NULL DEFAULT 0,
  quotes_sent INTEGER NOT NULL DEFAULT 0,
  bookings_won INTEGER NOT NULL DEFAULT 0,
  earnings_pence BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, date)
);

CREATE INDEX IF NOT EXISTS idx_provider_analytics_daily_provider_date
  ON provider_analytics_daily (provider_id, date DESC);

ALTER TABLE provider_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Providers can only SELECT their own analytics (no direct write — computed by cron)
CREATE POLICY "provider_analytics_daily_select_own"
  ON provider_analytics_daily FOR SELECT
  USING (
    provider_id = (
      SELECT user_id FROM service_provider_details WHERE user_id = auth.uid()
    )
  );
