-- ============================================================================
-- Estate Agent Dashboard Migration
-- ============================================================================
-- Creates 15 tables for the estate agent dashboard feature set.
-- All tables have RLS enabled with appropriate policies.
--
-- Tables created:
--   1.  agent_agency_profiles     (agency branding & contact info)
--   2.  agent_leads               (lead pipeline)
--   3.  agent_lead_activities     (lead timeline / activity log)
--   4.  agent_offers              (offers on properties)
--   5.  agent_offer_history       (offer audit trail)
--   6.  agent_sale_progressions   (sale tracking pipeline)
--   7.  agent_commissions         (commission tracking)
--   8.  agent_team_members        (team management)
--   9.  agent_branches            (office branches)
--   10. agent_crm_clients         (CRM contacts)
--   11. agent_viewing_slots       (viewing availability)
--   12. agent_viewing_feedback    (post-viewing feedback)
--   13. agent_api_keys            (API key management)
--   14. agent_feed_integrations   (property feed integrations)
--   15. agent_vendor_reports      (generated vendor reports)
--
-- Also creates:
--   - set_updated_at() trigger function (CREATE OR REPLACE)
--   - Indexes on agent_id for all tables + composite indexes
--   - RPC: get_agent_dashboard_kpis(p_agent_id UUID)
-- ============================================================================

-- ============================================================================
-- TRIGGER FUNCTION: set_updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE 1: agent_agency_profiles

-- ============================================================================

CREATE TABLE public.agent_agency_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postcode TEXT,
  description TEXT,
  specializations TEXT[],
  coverage_areas TEXT[],
  logo_url TEXT,
  brand_primary_colour TEXT,
  brand_secondary_colour TEXT,
  social_facebook TEXT,
  social_twitter TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_agency_profiles_agent_id ON public.agent_agency_profiles (agent_id);

ALTER TABLE public.agent_agency_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own agency profile"
  ON public.agent_agency_profiles
  FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE TRIGGER trg_agent_agency_profiles_updated_at
  BEFORE UPDATE ON public.agent_agency_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE 2: agent_leads
-- ============================================================================

CREATE TABLE public.agent_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  stage TEXT NOT NULL CHECK (stage IN ('new_enquiry', 'qualified', 'viewing_booked', 'offer_made', 'closed')),
  source TEXT CHECK (source IN ('website', 'portal', 'phone', 'walk_in', 'referral', 'other')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_leads_agent_id ON public.agent_leads (agent_id);
CREATE INDEX idx_agent_leads_agent_stage ON public.agent_leads (agent_id, stage);

ALTER TABLE public.agent_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own leads"
  ON public.agent_leads
  FOR ALL
  USING (
    agent_id = auth.uid()
    OR assigned_to = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM public.agent_team_members
      WHERE agent_team_members.agent_id = agent_leads.agent_id
      AND status = 'active'
    )
  )
  WITH CHECK (agent_id = auth.uid() OR assigned_to = auth.uid());

CREATE TRIGGER trg_agent_leads_updated_at
  BEFORE UPDATE ON public.agent_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE 3: agent_lead_activities
-- ============================================================================

CREATE TABLE public.agent_lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.agent_leads(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_lead_activities_lead_id ON public.agent_lead_activities (lead_id);

ALTER TABLE public.agent_lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view activities for their leads"
  ON public.agent_lead_activities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_leads
      WHERE public.agent_leads.id = lead_id
        AND (public.agent_leads.agent_id = auth.uid() OR public.agent_leads.assigned_to = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agent_leads
      WHERE public.agent_leads.id = lead_id
        AND (public.agent_leads.agent_id = auth.uid() OR public.agent_leads.assigned_to = auth.uid())
    )
  );

-- ============================================================================
-- TABLE 4: agent_offers
-- ============================================================================

CREATE TABLE public.agent_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.agent_leads(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  buyer_phone TEXT,
  amount BIGINT NOT NULL,
  conditions TEXT,
  solicitor_details JSONB,
  aip_status TEXT NOT NULL CHECK (aip_status IN ('not_provided', 'provided', 'verified')) DEFAULT 'not_provided',
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'withdrawn')) DEFAULT 'pending',
  counter_amount BIGINT,
  vendor_notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_offers_agent_id ON public.agent_offers (agent_id);
CREATE INDEX idx_agent_offers_agent_status ON public.agent_offers (agent_id, status);

ALTER TABLE public.agent_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own offers"
  ON public.agent_offers
  FOR ALL
  USING (
    agent_id = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM public.agent_team_members
      WHERE agent_team_members.agent_id = agent_offers.agent_id
      AND status = 'active'
    )
  )
  WITH CHECK (agent_id = auth.uid());

CREATE TRIGGER trg_agent_offers_updated_at
  BEFORE UPDATE ON public.agent_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE 5: agent_offer_history
-- ============================================================================

CREATE TABLE public.agent_offer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.agent_offers(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_offer_history_offer_id ON public.agent_offer_history (offer_id);

ALTER TABLE public.agent_offer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view history for their offers"
  ON public.agent_offer_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_offers
      WHERE public.agent_offers.id = offer_id
        AND public.agent_offers.agent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agent_offers
      WHERE public.agent_offers.id = offer_id
        AND public.agent_offers.agent_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE 6: agent_sale_progressions
-- ============================================================================

CREATE TABLE public.agent_sale_progressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL UNIQUE REFERENCES public.agent_offers(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  stage TEXT NOT NULL CHECK (stage IN (
    'offer_accepted', 'memorandum_of_sale', 'solicitors_instructed',
    'searches', 'survey', 'mortgage', 'exchange', 'completion'
  )) DEFAULT 'offer_accepted',
  expected_completion_date DATE,
  solicitor_buyer JSONB,
  solicitor_seller JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_sale_progressions_agent_id ON public.agent_sale_progressions (agent_id);

ALTER TABLE public.agent_sale_progressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own sale progressions"
  ON public.agent_sale_progressions
  FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE TRIGGER trg_agent_sale_progressions_updated_at
  BEFORE UPDATE ON public.agent_sale_progressions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE 7: agent_commissions
-- ============================================================================

CREATE TABLE public.agent_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  sale_price BIGINT NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'invoiced', 'paid')) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_commissions_agent_id ON public.agent_commissions (agent_id);

ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own commissions"
  ON public.agent_commissions
  FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- ============================================================================
-- TABLE 8: agent_branches (before team_members, since team references branches)
-- ============================================================================

CREATE TABLE public.agent_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postcode TEXT,
  phone TEXT,
  email TEXT,
  is_head_office BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_branches_agent_id ON public.agent_branches (agent_id);

ALTER TABLE public.agent_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own branches"
  ON public.agent_branches
  FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE TRIGGER trg_agent_branches_updated_at
  BEFORE UPDATE ON public.agent_branches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE 9: agent_team_members
-- ============================================================================

CREATE TABLE public.agent_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.agent_branches(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'senior_negotiator', 'negotiator', 'lettings_manager', 'viewer')) DEFAULT 'negotiator',
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'pending',
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_agent_team_member UNIQUE (agent_id, user_id)
);

CREATE INDEX idx_agent_team_members_agent_id ON public.agent_team_members (agent_id);

ALTER TABLE public.agent_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own team members"
  ON public.agent_team_members
  FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- ============================================================================
-- TABLE 10: agent_crm_clients
-- ============================================================================

CREATE TABLE public.agent_crm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  client_type TEXT NOT NULL CHECK (client_type IN ('buyer', 'seller', 'landlord', 'tenant')),
  preferences JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  tags TEXT[],
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_crm_clients_agent_id ON public.agent_crm_clients (agent_id);

ALTER TABLE public.agent_crm_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own CRM clients"
  ON public.agent_crm_clients
  FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE TRIGGER trg_agent_crm_clients_updated_at
  BEFORE UPDATE ON public.agent_crm_clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE 11: agent_viewing_slots
-- ============================================================================

CREATE TABLE public.agent_viewing_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  booked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_viewing_slots_agent_id ON public.agent_viewing_slots (agent_id);

ALTER TABLE public.agent_viewing_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own viewing slots"
  ON public.agent_viewing_slots
  FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Buyers can view booked slots"
  ON public.agent_viewing_slots
  FOR SELECT
  USING (is_booked = true AND booked_by = auth.uid());

-- ============================================================================
-- TABLE 12: agent_viewing_feedback
-- ============================================================================

CREATE TABLE public.agent_viewing_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewing_slot_id UUID NOT NULL REFERENCES public.agent_viewing_slots(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  interest_level INT NOT NULL CHECK (interest_level BETWEEN 1 AND 5),
  price_opinion TEXT CHECK (price_opinion IN ('too_high', 'about_right', 'good_value')),
  likelihood_to_offer TEXT CHECK (likelihood_to_offer IN ('unlikely', 'possible', 'likely', 'very_likely')),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_viewing_feedback_agent_id ON public.agent_viewing_feedback (agent_id);

ALTER TABLE public.agent_viewing_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own viewing feedback"
  ON public.agent_viewing_feedback
  FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- ============================================================================
-- TABLE 13: agent_api_keys
-- ============================================================================

CREATE TABLE public.agent_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  rate_limit_per_minute INT NOT NULL DEFAULT 60,
  last_used_at TIMESTAMPTZ,
  usage_count BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_api_keys_agent_id ON public.agent_api_keys (agent_id);

ALTER TABLE public.agent_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own API keys"
  ON public.agent_api_keys
  FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- ============================================================================
-- TABLE 14: agent_feed_integrations
-- ============================================================================

CREATE TABLE public.agent_feed_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('reapit', 'alto', 'jupix')),
  api_key_encrypted TEXT,
  webhook_url TEXT,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('disconnected', 'connected', 'syncing', 'error')) DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  field_mapping JSONB NOT NULL DEFAULT '{}',
  error_log JSONB[] NOT NULL DEFAULT ARRAY[]::JSONB[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_feed_integrations_agent_id ON public.agent_feed_integrations (agent_id);

ALTER TABLE public.agent_feed_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own feed integrations"
  ON public.agent_feed_integrations
  FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE TRIGGER trg_agent_feed_integrations_updated_at
  BEFORE UPDATE ON public.agent_feed_integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TABLE 15: agent_vendor_reports
-- ============================================================================

CREATE TABLE public.agent_vendor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('listing_performance', 'viewing_summary', 'market_analysis')),
  data JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pdf_url TEXT
);

CREATE INDEX idx_agent_vendor_reports_agent_id ON public.agent_vendor_reports (agent_id);

ALTER TABLE public.agent_vendor_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own vendor reports"
  ON public.agent_vendor_reports
  FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- ============================================================================
-- RPC: get_agent_dashboard_kpis
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_agent_dashboard_kpis(p_agent_id UUID)
RETURNS TABLE (
  active_listings_count BIGINT,
  new_leads_count BIGINT,
  viewings_this_week_count BIGINT,
  pending_offers_count BIGINT,
  performance_score NUMERIC
) AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_agent_id THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    -- Active listings count
    (SELECT COUNT(*)
     FROM public.listings
     WHERE agent_id = p_agent_id
       AND status = 'active')::BIGINT AS active_listings_count,

    -- New leads in last 7 days
    (SELECT COUNT(*)
     FROM public.agent_leads
     WHERE agent_id = p_agent_id
       AND created_at >= NOW() - INTERVAL '7 days')::BIGINT AS new_leads_count,

    -- Viewings this week
    (SELECT COUNT(*)
     FROM public.agent_viewing_slots
     WHERE agent_id = p_agent_id
       AND start_time >= date_trunc('week', NOW())
       AND start_time < date_trunc('week', NOW()) + INTERVAL '7 days')::BIGINT AS viewings_this_week_count,

    -- Pending offers
    (SELECT COUNT(*)
     FROM public.agent_offers
     WHERE agent_id = p_agent_id
       AND status = 'pending')::BIGINT AS pending_offers_count,

    -- Performance score: closed leads / total leads ratio
    (SELECT CASE
       WHEN COUNT(*) = 0 THEN 0
       ELSE ROUND(COUNT(*) FILTER (WHERE stage = 'closed')::NUMERIC / COUNT(*)::NUMERIC, 2)
     END
     FROM public.agent_leads
     WHERE agent_id = p_agent_id)::NUMERIC AS performance_score;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
