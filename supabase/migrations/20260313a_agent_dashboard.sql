-- ============================================================================
-- Phase 15: Estate Agent Dashboard Migration
-- ============================================================================
-- Creates 15 agent-domain tables with indexes, RLS policies, updated_at
-- triggers, and a KPI aggregation RPC function.
--
-- Tables created:
--   1.  agent_agency_profiles
--   2.  agent_leads
--   3.  agent_lead_activities
--   4.  agent_offers
--   5.  agent_offer_history
--   6.  agent_sale_progressions
--   7.  agent_commissions
--   8.  agent_team_members
--   9.  agent_branches
--   10. agent_crm_clients
--   11. agent_viewing_slots
--   12. agent_viewing_feedback
--   13. agent_api_keys
--   14. agent_feed_integrations
--   15. agent_vendor_reports
-- ============================================================================

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- Create only if it does not already exist (earlier migrations may define it).
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE 1: agent_agency_profiles
-- One-to-one agency branding record per agent user.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_agency_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id              UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name           TEXT NOT NULL,
  contact_email         TEXT,
  contact_phone         TEXT,
  address_line_1        TEXT,
  address_line_2        TEXT,
  city                  TEXT,
  postcode              TEXT,
  description           TEXT,
  specializations       TEXT[],
  coverage_areas        TEXT[],
  logo_url              TEXT,
  brand_primary_colour  TEXT,
  brand_secondary_colour TEXT,
  social_facebook       TEXT,
  social_twitter        TEXT,
  social_instagram      TEXT,
  social_linkedin       TEXT,
  website_url           TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_agency_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own agency profile" ON public.agent_agency_profiles;
CREATE POLICY "Agents can manage their own agency profile"
  ON public.agent_agency_profiles FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_agency_profiles_agent_id ON public.agent_agency_profiles (agent_id);

DROP TRIGGER IF EXISTS update_agent_agency_profiles_updated_at ON public.agent_agency_profiles;
CREATE TRIGGER update_agent_agency_profiles_updated_at
  BEFORE UPDATE ON public.agent_agency_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- TABLE 2: agent_leads
-- CRM lead pipeline per agent, optionally linked to a listing.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id   UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  contact_name  TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  stage         TEXT NOT NULL DEFAULT 'new_enquiry'
                  CHECK (stage IN ('new_enquiry', 'qualified', 'viewing_booked', 'offer_made', 'closed')),
  source        TEXT CHECK (source IN ('website', 'portal', 'phone', 'walk_in', 'referral', 'other')),
  assigned_to   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own leads" ON public.agent_leads;
CREATE POLICY "Agents can manage their own leads"
  ON public.agent_leads FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_leads_agent_id ON public.agent_leads (agent_id);
CREATE INDEX idx_agent_leads_agent_stage ON public.agent_leads (agent_id, stage);

DROP TRIGGER IF EXISTS update_agent_leads_updated_at ON public.agent_leads;
CREATE TRIGGER update_agent_leads_updated_at
  BEFORE UPDATE ON public.agent_leads
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- TABLE 3: agent_lead_activities
-- Activity log entries for a lead (calls, emails, viewings, notes, etc.).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_lead_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID NOT NULL REFERENCES public.agent_leads(id) ON DELETE CASCADE,
  actor_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description   TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_lead_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can view activities on their leads" ON public.agent_lead_activities;
CREATE POLICY "Agents can view activities on their leads"
  ON public.agent_lead_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_leads
      WHERE agent_leads.id = agent_lead_activities.lead_id
        AND agent_leads.agent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Agents can insert activities on their leads" ON public.agent_lead_activities;
CREATE POLICY "Agents can insert activities on their leads"
  ON public.agent_lead_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agent_leads
      WHERE agent_leads.id = agent_lead_activities.lead_id
        AND agent_leads.agent_id = auth.uid()
    )
  );

CREATE INDEX idx_agent_lead_activities_lead_id ON public.agent_lead_activities (lead_id);
CREATE INDEX idx_agent_lead_activities_actor_id ON public.agent_lead_activities (actor_id);

-- ============================================================================
-- TABLE 4: agent_offers
-- Offers received on a listing, managed by the agent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_offers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id       UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  lead_id           UUID REFERENCES public.agent_leads(id) ON DELETE SET NULL,
  buyer_name        TEXT NOT NULL,
  buyer_email       TEXT,
  buyer_phone       TEXT,
  amount            BIGINT NOT NULL,
  conditions        TEXT,
  solicitor_details JSONB,
  aip_status        TEXT DEFAULT 'not_provided'
                      CHECK (aip_status IN ('not_provided', 'provided', 'verified')),
  status            TEXT DEFAULT 'pending'
                      CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'withdrawn')),
  counter_amount    BIGINT,
  vendor_notified   BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own offers" ON public.agent_offers;
CREATE POLICY "Agents can manage their own offers"
  ON public.agent_offers FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_offers_agent_id ON public.agent_offers (agent_id);
CREATE INDEX idx_agent_offers_agent_status ON public.agent_offers (agent_id, status);

DROP TRIGGER IF EXISTS update_agent_offers_updated_at ON public.agent_offers;
CREATE TRIGGER update_agent_offers_updated_at
  BEFORE UPDATE ON public.agent_offers
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- TABLE 5: agent_offer_history
-- Immutable audit trail of offer status transitions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_offer_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id        UUID NOT NULL REFERENCES public.agent_offers(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status      TEXT NOT NULL,
  actor_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_offer_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can view history for their offers" ON public.agent_offer_history;
CREATE POLICY "Agents can view history for their offers"
  ON public.agent_offer_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_offers
      WHERE agent_offers.id = agent_offer_history.offer_id
        AND agent_offers.agent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Agents can insert history for their offers" ON public.agent_offer_history;
CREATE POLICY "Agents can insert history for their offers"
  ON public.agent_offer_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agent_offers
      WHERE agent_offers.id = agent_offer_history.offer_id
        AND agent_offers.agent_id = auth.uid()
    )
  );

CREATE INDEX idx_agent_offer_history_offer_id ON public.agent_offer_history (offer_id);

-- ============================================================================
-- TABLE 6: agent_sale_progressions
-- Post-acceptance sale progression tracking (one per accepted offer).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_sale_progressions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id                 UUID NOT NULL UNIQUE REFERENCES public.agent_offers(id) ON DELETE CASCADE,
  property_id              UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  stage                    TEXT NOT NULL DEFAULT 'offer_accepted'
                             CHECK (stage IN (
                               'offer_accepted', 'memorandum_of_sale', 'solicitors_instructed',
                               'searches', 'survey', 'mortgage', 'exchange', 'completion'
                             )),
  expected_completion_date DATE,
  solicitor_buyer          JSONB,
  solicitor_seller         JSONB,
  notes                    TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_sale_progressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own sale progressions" ON public.agent_sale_progressions;
CREATE POLICY "Agents can manage their own sale progressions"
  ON public.agent_sale_progressions FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_sale_progressions_agent_id ON public.agent_sale_progressions (agent_id);

DROP TRIGGER IF EXISTS update_agent_sale_progressions_updated_at ON public.agent_sale_progressions;
CREATE TRIGGER update_agent_sale_progressions_updated_at
  BEFORE UPDATE ON public.agent_sale_progressions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- TABLE 7: agent_commissions
-- Commission records for completed sales.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id       UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sale_price        BIGINT NOT NULL,
  commission_rate   DECIMAL(5, 2) NOT NULL,
  commission_amount BIGINT NOT NULL,
  status            TEXT DEFAULT 'pending'
                      CHECK (status IN ('pending', 'invoiced', 'paid')),
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own commissions" ON public.agent_commissions;
CREATE POLICY "Agents can manage their own commissions"
  ON public.agent_commissions FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_commissions_agent_id ON public.agent_commissions (agent_id);

-- ============================================================================
-- TABLE 8: agent_team_members
-- Team members under an agent account (branch_id FK added after agent_branches).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id   UUID,  -- FK to agent_branches added below via ALTER TABLE
  role        TEXT NOT NULL DEFAULT 'negotiator'
                CHECK (role IN ('admin', 'senior_negotiator', 'negotiator', 'lettings_manager', 'viewer')),
  status      TEXT DEFAULT 'pending'
                CHECK (status IN ('active', 'inactive', 'pending')),
  email       TEXT NOT NULL,
  name        TEXT NOT NULL,
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  joined_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (agent_id, user_id)
);

ALTER TABLE public.agent_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own team members" ON public.agent_team_members;
CREATE POLICY "Agents can manage their own team members"
  ON public.agent_team_members FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_team_members_agent_id ON public.agent_team_members (agent_id);

-- ============================================================================
-- TABLE 9: agent_branches
-- Physical office branches for an agency.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_branches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city           TEXT,
  postcode       TEXT,
  phone          TEXT,
  email          TEXT,
  is_head_office BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own branches" ON public.agent_branches;
CREATE POLICY "Agents can manage their own branches"
  ON public.agent_branches FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_branches_agent_id ON public.agent_branches (agent_id);

DROP TRIGGER IF EXISTS update_agent_branches_updated_at ON public.agent_branches;
CREATE TRIGGER update_agent_branches_updated_at
  BEFORE UPDATE ON public.agent_branches
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add FK from agent_team_members.branch_id → agent_branches now that agent_branches exists.
ALTER TABLE public.agent_team_members
  ADD CONSTRAINT fk_agent_team_members_branch
    FOREIGN KEY (branch_id) REFERENCES public.agent_branches(id) ON DELETE SET NULL;

-- ============================================================================
-- TABLE 10: agent_crm_clients
-- CRM contact records, optionally linked to a registered platform user.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_crm_clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  client_type     TEXT NOT NULL
                    CHECK (client_type IN ('buyer', 'seller', 'landlord', 'tenant')),
  preferences     JSONB,
  notes           TEXT,
  tags            TEXT[],
  last_contact_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_crm_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own CRM clients" ON public.agent_crm_clients;
CREATE POLICY "Agents can manage their own CRM clients"
  ON public.agent_crm_clients FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_crm_clients_agent_id ON public.agent_crm_clients (agent_id);

DROP TRIGGER IF EXISTS update_agent_crm_clients_updated_at ON public.agent_crm_clients;
CREATE TRIGGER update_agent_crm_clients_updated_at
  BEFORE UPDATE ON public.agent_crm_clients
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- TABLE 11: agent_viewing_slots
-- Calendar slots for property viewings managed by the agent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_viewing_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  is_booked   BOOLEAN DEFAULT false,
  booked_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_viewing_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own viewing slots" ON public.agent_viewing_slots;
CREATE POLICY "Agents can manage their own viewing slots"
  ON public.agent_viewing_slots FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_viewing_slots_agent_id ON public.agent_viewing_slots (agent_id);
CREATE INDEX idx_agent_viewing_slots_property_id ON public.agent_viewing_slots (property_id);
CREATE INDEX idx_agent_viewing_slots_start_time ON public.agent_viewing_slots (start_time);

-- ============================================================================
-- TABLE 12: agent_viewing_feedback
-- Post-viewing feedback collected from buyers.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_viewing_feedback (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewing_slot_id     UUID REFERENCES public.agent_viewing_slots(id) ON DELETE SET NULL,
  buyer_name          TEXT NOT NULL,
  interest_level      INT NOT NULL CHECK (interest_level BETWEEN 1 AND 5),
  price_opinion       TEXT NOT NULL
                        CHECK (price_opinion IN ('too_high', 'about_right', 'good_value')),
  likelihood_to_offer TEXT NOT NULL
                        CHECK (likelihood_to_offer IN ('unlikely', 'possible', 'likely', 'very_likely')),
  comments            TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_viewing_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own viewing feedback" ON public.agent_viewing_feedback;
CREATE POLICY "Agents can manage their own viewing feedback"
  ON public.agent_viewing_feedback FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_viewing_feedback_agent_id ON public.agent_viewing_feedback (agent_id);
CREATE INDEX idx_agent_viewing_feedback_slot_id ON public.agent_viewing_feedback (viewing_slot_id);

-- ============================================================================
-- TABLE 13: agent_api_keys
-- API keys for third-party integrations (stored as hashes).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_api_keys (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash              TEXT NOT NULL,
  key_prefix            TEXT NOT NULL,
  name                  TEXT NOT NULL,
  rate_limit_per_minute INT DEFAULT 60,
  last_used_at          TIMESTAMPTZ,
  usage_count           BIGINT DEFAULT 0,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  revoked_at            TIMESTAMPTZ
);

ALTER TABLE public.agent_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own API keys" ON public.agent_api_keys;
CREATE POLICY "Agents can manage their own API keys"
  ON public.agent_api_keys FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_api_keys_agent_id ON public.agent_api_keys (agent_id);

-- ============================================================================
-- TABLE 14: agent_feed_integrations
-- CRM / feed provider integrations (Reapit, Alto, Jupix).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_feed_integrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL
                      CHECK (provider IN ('reapit', 'alto', 'jupix')),
  api_key_encrypted TEXT,
  webhook_url       TEXT,
  sync_status       TEXT DEFAULT 'disconnected'
                      CHECK (sync_status IN ('disconnected', 'connected', 'syncing', 'error')),
  last_sync_at      TIMESTAMPTZ,
  field_mapping     JSONB,
  error_log         JSONB[],
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_feed_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own feed integrations" ON public.agent_feed_integrations;
CREATE POLICY "Agents can manage their own feed integrations"
  ON public.agent_feed_integrations FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_feed_integrations_agent_id ON public.agent_feed_integrations (agent_id);

DROP TRIGGER IF EXISTS update_agent_feed_integrations_updated_at ON public.agent_feed_integrations;
CREATE TRIGGER update_agent_feed_integrations_updated_at
  BEFORE UPDATE ON public.agent_feed_integrations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- TABLE 15: agent_vendor_reports
-- Generated vendor/seller reports (PDF + raw data).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_vendor_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  report_type  TEXT NOT NULL
                 CHECK (report_type IN ('listing_performance', 'viewing_summary', 'market_analysis')),
  data         JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  pdf_url      TEXT
);

ALTER TABLE public.agent_vendor_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can manage their own vendor reports" ON public.agent_vendor_reports;
CREATE POLICY "Agents can manage their own vendor reports"
  ON public.agent_vendor_reports FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX idx_agent_vendor_reports_agent_id ON public.agent_vendor_reports (agent_id);
CREATE INDEX idx_agent_vendor_reports_property_id ON public.agent_vendor_reports (property_id);

-- ============================================================================
-- RPC: get_agent_dashboard_kpis
-- Returns aggregated KPI metrics for a given agent, used by the dashboard.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_agent_dashboard_kpis(p_agent_id UUID)
RETURNS TABLE(
  active_listings_count   BIGINT,
  new_leads_count         BIGINT,
  viewings_this_week_count BIGINT,
  pending_offers_count    BIGINT,
  performance_score       NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.listings WHERE user_id = p_agent_id AND status = 'active')::BIGINT,
    (SELECT COUNT(*) FROM public.agent_leads WHERE agent_id = p_agent_id AND created_at >= NOW() - INTERVAL '7 days')::BIGINT,
    (SELECT COUNT(*) FROM public.agent_viewing_slots
      WHERE agent_id = p_agent_id
        AND start_time >= date_trunc('week', NOW())
        AND start_time < date_trunc('week', NOW()) + INTERVAL '7 days')::BIGINT,
    (SELECT COUNT(*) FROM public.agent_offers WHERE agent_id = p_agent_id AND status = 'pending')::BIGINT,
    COALESCE(
      (SELECT COUNT(*)::NUMERIC FILTER (WHERE stage = 'closed') / NULLIF(COUNT(*)::NUMERIC, 0)
       FROM public.agent_leads WHERE agent_id = p_agent_id),
      0
    );
END;
$$;
