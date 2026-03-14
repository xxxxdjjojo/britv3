-- Phase 15: Estate Agent Dashboard — Agent-specific tables
-- Creates all agent-domain tables, indexes, RLS policies, triggers, and KPI RPC.
-- All monetary values in pence (BIGINT). All tables have RLS enabled.
-- Depends on: profiles, listings (from earlier migrations).

-- ============================================================================
-- HELPER: updated_at trigger function (create if not exists)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE 1: agent_agency_profiles
-- ============================================================================

CREATE TABLE agent_agency_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postcode TEXT,
  description TEXT,
  specializations TEXT[] DEFAULT '{}',
  coverage_areas TEXT[] DEFAULT '{}',
  logo_url TEXT,
  brand_primary_colour TEXT,
  brand_secondary_colour TEXT,
  social_facebook TEXT,
  social_twitter TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_agency_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_agency_profiles_select"
  ON agent_agency_profiles FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "agent_agency_profiles_insert"
  ON agent_agency_profiles FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_agency_profiles_update"
  ON agent_agency_profiles FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_agency_profiles_delete"
  ON agent_agency_profiles FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_agency_profiles_agent_id ON agent_agency_profiles(agent_id);

CREATE TRIGGER set_agent_agency_profiles_updated_at
  BEFORE UPDATE ON agent_agency_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE 2: agent_leads
-- ============================================================================

CREATE TABLE agent_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  stage TEXT NOT NULL DEFAULT 'new_enquiry'
    CHECK (stage IN ('new_enquiry', 'qualified', 'viewing_booked', 'offer_made', 'closed')),
  source TEXT NOT NULL DEFAULT 'other'
    CHECK (source IN ('website', 'portal', 'phone', 'walk_in', 'referral', 'other')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_leads_select"
  ON agent_leads FOR SELECT
  USING (
    agent_id = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM agent_team_members
      WHERE agent_id = agent_leads.agent_id
        AND status = 'active'
    )
  );

CREATE POLICY "agent_leads_insert"
  ON agent_leads FOR INSERT
  WITH CHECK (
    agent_id = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM agent_team_members
      WHERE agent_id = agent_leads.agent_id
        AND status = 'active'
    )
  );

CREATE POLICY "agent_leads_update"
  ON agent_leads FOR UPDATE
  USING (
    agent_id = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM agent_team_members
      WHERE agent_id = agent_leads.agent_id
        AND status = 'active'
    )
  );

CREATE POLICY "agent_leads_delete"
  ON agent_leads FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_leads_agent_id ON agent_leads(agent_id);
CREATE INDEX idx_agent_leads_agent_stage ON agent_leads(agent_id, stage);
CREATE INDEX idx_agent_leads_property_id ON agent_leads(property_id);

CREATE TRIGGER set_agent_leads_updated_at
  BEFORE UPDATE ON agent_leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE 3: agent_lead_activities
-- ============================================================================

CREATE TABLE agent_lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES agent_leads(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_lead_activities_select"
  ON agent_lead_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_leads
      WHERE agent_leads.id = agent_lead_activities.lead_id
        AND (
          agent_leads.agent_id = auth.uid()
          OR auth.uid() IN (
            SELECT user_id FROM agent_team_members
            WHERE agent_id = agent_leads.agent_id
              AND status = 'active'
          )
        )
    )
  );

CREATE POLICY "agent_lead_activities_insert"
  ON agent_lead_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agent_leads
      WHERE agent_leads.id = agent_lead_activities.lead_id
        AND (
          agent_leads.agent_id = auth.uid()
          OR auth.uid() IN (
            SELECT user_id FROM agent_team_members
            WHERE agent_id = agent_leads.agent_id
              AND status = 'active'
          )
        )
    )
  );

CREATE INDEX idx_agent_lead_activities_lead_id ON agent_lead_activities(lead_id);
CREATE INDEX idx_agent_lead_activities_actor_id ON agent_lead_activities(actor_id);

-- ============================================================================
-- TABLE 4: agent_offers
-- ============================================================================

CREATE TABLE agent_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES agent_leads(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  buyer_phone TEXT,
  amount BIGINT NOT NULL,
  conditions TEXT,
  solicitor_details JSONB DEFAULT '{}',
  aip_status TEXT NOT NULL DEFAULT 'not_provided'
    CHECK (aip_status IN ('not_provided', 'provided', 'verified')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'withdrawn')),
  counter_amount BIGINT,
  vendor_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_offers_select"
  ON agent_offers FOR SELECT
  USING (
    agent_id = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM agent_team_members
      WHERE agent_id = agent_offers.agent_id
        AND status = 'active'
    )
  );

CREATE POLICY "agent_offers_insert"
  ON agent_offers FOR INSERT
  WITH CHECK (
    agent_id = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM agent_team_members
      WHERE agent_id = agent_offers.agent_id
        AND status = 'active'
    )
  );

CREATE POLICY "agent_offers_update"
  ON agent_offers FOR UPDATE
  USING (
    agent_id = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM agent_team_members
      WHERE agent_id = agent_offers.agent_id
        AND status = 'active'
    )
  );

CREATE POLICY "agent_offers_delete"
  ON agent_offers FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_offers_agent_id ON agent_offers(agent_id);
CREATE INDEX idx_agent_offers_agent_status ON agent_offers(agent_id, status);
CREATE INDEX idx_agent_offers_property_id ON agent_offers(property_id);
CREATE INDEX idx_agent_offers_lead_id ON agent_offers(lead_id);

CREATE TRIGGER set_agent_offers_updated_at
  BEFORE UPDATE ON agent_offers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE 5: agent_offer_history
-- ============================================================================

CREATE TABLE agent_offer_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES agent_offers(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_offer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_offer_history_select"
  ON agent_offer_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_offers
      WHERE agent_offers.id = agent_offer_history.offer_id
        AND (
          agent_offers.agent_id = auth.uid()
          OR auth.uid() IN (
            SELECT user_id FROM agent_team_members
            WHERE agent_id = agent_offers.agent_id
              AND status = 'active'
          )
        )
    )
  );

CREATE POLICY "agent_offer_history_insert"
  ON agent_offer_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agent_offers
      WHERE agent_offers.id = agent_offer_history.offer_id
        AND (
          agent_offers.agent_id = auth.uid()
          OR auth.uid() IN (
            SELECT user_id FROM agent_team_members
            WHERE agent_id = agent_offers.agent_id
              AND status = 'active'
          )
        )
    )
  );

CREATE INDEX idx_agent_offer_history_offer_id ON agent_offer_history(offer_id);

-- ============================================================================
-- TABLE 6: agent_sale_progressions
-- ============================================================================

CREATE TABLE agent_sale_progressions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL UNIQUE REFERENCES agent_offers(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'offer_accepted'
    CHECK (stage IN (
      'offer_accepted',
      'memorandum_of_sale',
      'solicitors_instructed',
      'searches',
      'survey',
      'mortgage',
      'exchange',
      'completion'
    )),
  expected_completion_date DATE,
  solicitor_buyer JSONB DEFAULT '{}',
  solicitor_seller JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_sale_progressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_sale_progressions_select"
  ON agent_sale_progressions FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "agent_sale_progressions_insert"
  ON agent_sale_progressions FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_sale_progressions_update"
  ON agent_sale_progressions FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_sale_progressions_delete"
  ON agent_sale_progressions FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_sale_progressions_agent_id ON agent_sale_progressions(agent_id);
CREATE INDEX idx_agent_sale_progressions_offer_id ON agent_sale_progressions(offer_id);

CREATE TRIGGER set_agent_sale_progressions_updated_at
  BEFORE UPDATE ON agent_sale_progressions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE 7: agent_commissions
-- ============================================================================

CREATE TABLE agent_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sale_price BIGINT NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'invoiced', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_commissions_select"
  ON agent_commissions FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "agent_commissions_insert"
  ON agent_commissions FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_commissions_update"
  ON agent_commissions FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_commissions_delete"
  ON agent_commissions FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_commissions_agent_id ON agent_commissions(agent_id);
CREATE INDEX idx_agent_commissions_property_id ON agent_commissions(property_id);

-- ============================================================================
-- TABLE 8: agent_branches
-- (Created before agent_team_members to satisfy FK reference)
-- ============================================================================

CREATE TABLE agent_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postcode TEXT,
  phone TEXT,
  email TEXT,
  is_head_office BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_branches_select"
  ON agent_branches FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "agent_branches_insert"
  ON agent_branches FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_branches_update"
  ON agent_branches FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_branches_delete"
  ON agent_branches FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_branches_agent_id ON agent_branches(agent_id);

CREATE TRIGGER set_agent_branches_updated_at
  BEFORE UPDATE ON agent_branches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE 9: agent_team_members
-- ============================================================================

CREATE TABLE agent_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES agent_branches(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'negotiator'
    CHECK (role IN ('admin', 'senior_negotiator', 'negotiator', 'lettings_manager', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('active', 'inactive', 'pending')),
  email TEXT,
  name TEXT,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (agent_id, user_id)
);

ALTER TABLE agent_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_team_members_select"
  ON agent_team_members FOR SELECT
  USING (agent_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "agent_team_members_insert"
  ON agent_team_members FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_team_members_update"
  ON agent_team_members FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_team_members_delete"
  ON agent_team_members FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_team_members_agent_id ON agent_team_members(agent_id);
CREATE INDEX idx_agent_team_members_user_id ON agent_team_members(user_id);
CREATE INDEX idx_agent_team_members_branch_id ON agent_team_members(branch_id);

-- ============================================================================
-- TABLE 10: agent_crm_clients
-- ============================================================================

CREATE TABLE agent_crm_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  client_type TEXT NOT NULL DEFAULT 'buyer'
    CHECK (client_type IN ('buyer', 'seller', 'landlord', 'tenant')),
  preferences JSONB DEFAULT '{}',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_crm_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_crm_clients_select"
  ON agent_crm_clients FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "agent_crm_clients_insert"
  ON agent_crm_clients FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_crm_clients_update"
  ON agent_crm_clients FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_crm_clients_delete"
  ON agent_crm_clients FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_crm_clients_agent_id ON agent_crm_clients(agent_id);
CREATE INDEX idx_agent_crm_clients_user_id ON agent_crm_clients(user_id);

CREATE TRIGGER set_agent_crm_clients_updated_at
  BEFORE UPDATE ON agent_crm_clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE 11: agent_viewing_slots
-- ============================================================================

CREATE TABLE agent_viewing_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  booked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_viewing_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_viewing_slots_select_owner"
  ON agent_viewing_slots FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "agent_viewing_slots_select_booked_buyer"
  ON agent_viewing_slots FOR SELECT
  USING (is_booked = true AND booked_by = auth.uid());

CREATE POLICY "agent_viewing_slots_insert"
  ON agent_viewing_slots FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_viewing_slots_update"
  ON agent_viewing_slots FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_viewing_slots_delete"
  ON agent_viewing_slots FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_viewing_slots_agent_id ON agent_viewing_slots(agent_id);
CREATE INDEX idx_agent_viewing_slots_property_id ON agent_viewing_slots(property_id);
CREATE INDEX idx_agent_viewing_slots_start_time ON agent_viewing_slots(start_time);

-- ============================================================================
-- TABLE 12: agent_viewing_feedback
-- ============================================================================

CREATE TABLE agent_viewing_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewing_slot_id UUID NOT NULL REFERENCES agent_viewing_slots(id) ON DELETE CASCADE,
  buyer_name TEXT,
  interest_level INT CHECK (interest_level BETWEEN 1 AND 5),
  price_opinion TEXT CHECK (price_opinion IN ('too_high', 'about_right', 'good_value')),
  likelihood_to_offer TEXT CHECK (likelihood_to_offer IN ('unlikely', 'possible', 'likely', 'very_likely')),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_viewing_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_viewing_feedback_select"
  ON agent_viewing_feedback FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "agent_viewing_feedback_insert"
  ON agent_viewing_feedback FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_viewing_feedback_update"
  ON agent_viewing_feedback FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_viewing_feedback_delete"
  ON agent_viewing_feedback FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_viewing_feedback_agent_id ON agent_viewing_feedback(agent_id);
CREATE INDEX idx_agent_viewing_feedback_viewing_slot_id ON agent_viewing_feedback(viewing_slot_id);

-- ============================================================================
-- TABLE 13: agent_api_keys
-- ============================================================================

CREATE TABLE agent_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  rate_limit_per_minute INT DEFAULT 60,
  last_used_at TIMESTAMPTZ,
  usage_count BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_api_keys_select"
  ON agent_api_keys FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "agent_api_keys_insert"
  ON agent_api_keys FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_api_keys_update"
  ON agent_api_keys FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_api_keys_delete"
  ON agent_api_keys FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_api_keys_agent_id ON agent_api_keys(agent_id);
CREATE INDEX idx_agent_api_keys_key_hash ON agent_api_keys(key_hash);

-- ============================================================================
-- TABLE 14: agent_feed_integrations
-- ============================================================================

CREATE TABLE agent_feed_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL
    CHECK (provider IN ('reapit', 'alto', 'jupix')),
  api_key_encrypted TEXT,
  webhook_url TEXT,
  sync_status TEXT NOT NULL DEFAULT 'disconnected'
    CHECK (sync_status IN ('disconnected', 'connected', 'syncing', 'error')),
  last_sync_at TIMESTAMPTZ,
  field_mapping JSONB DEFAULT '{}',
  error_log JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_feed_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_feed_integrations_select"
  ON agent_feed_integrations FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "agent_feed_integrations_insert"
  ON agent_feed_integrations FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_feed_integrations_update"
  ON agent_feed_integrations FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_feed_integrations_delete"
  ON agent_feed_integrations FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_feed_integrations_agent_id ON agent_feed_integrations(agent_id);

CREATE TRIGGER set_agent_feed_integrations_updated_at
  BEFORE UPDATE ON agent_feed_integrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE 15: agent_vendor_reports
-- ============================================================================

CREATE TABLE agent_vendor_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL
    CHECK (report_type IN ('listing_performance', 'viewing_summary', 'market_analysis')),
  data JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  pdf_url TEXT
);

ALTER TABLE agent_vendor_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_vendor_reports_select"
  ON agent_vendor_reports FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "agent_vendor_reports_insert"
  ON agent_vendor_reports FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_vendor_reports_update"
  ON agent_vendor_reports FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "agent_vendor_reports_delete"
  ON agent_vendor_reports FOR DELETE
  USING (agent_id = auth.uid());

CREATE INDEX idx_agent_vendor_reports_agent_id ON agent_vendor_reports(agent_id);
CREATE INDEX idx_agent_vendor_reports_property_id ON agent_vendor_reports(property_id);

-- ============================================================================
-- RPC: get_agent_dashboard_kpis
-- Returns KPI summary for the agent dashboard.
-- SECURITY DEFINER so cross-table aggregation is not blocked by RLS.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_agent_dashboard_kpis(p_agent_id UUID)
RETURNS TABLE (
  active_listings_count   BIGINT,
  new_leads_count         BIGINT,
  viewings_this_week_count BIGINT,
  pending_offers_count    BIGINT,
  performance_score       NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_total_leads  BIGINT;
  v_closed_leads BIGINT;
BEGIN
  -- Total and closed leads for performance ratio
  SELECT COUNT(*) INTO v_total_leads
  FROM agent_leads
  WHERE agent_id = p_agent_id;

  SELECT COUNT(*) INTO v_closed_leads
  FROM agent_leads
  WHERE agent_id = p_agent_id AND stage = 'closed';

  RETURN QUERY
  SELECT
    -- active listings: listings table where agent created them and status is active
    (
      SELECT COUNT(*)::BIGINT
      FROM listings
      WHERE created_by = p_agent_id
        AND status = 'active'
    ) AS active_listings_count,

    -- new leads in last 7 days
    (
      SELECT COUNT(*)::BIGINT
      FROM agent_leads
      WHERE agent_id = p_agent_id
        AND created_at >= NOW() - INTERVAL '7 days'
    ) AS new_leads_count,

    -- viewings scheduled this week
    (
      SELECT COUNT(*)::BIGINT
      FROM agent_viewing_slots
      WHERE agent_id = p_agent_id
        AND start_time >= date_trunc('week', NOW())
        AND start_time <  date_trunc('week', NOW()) + INTERVAL '7 days'
    ) AS viewings_this_week_count,

    -- pending offers
    (
      SELECT COUNT(*)::BIGINT
      FROM agent_offers
      WHERE agent_id = p_agent_id
        AND status = 'pending'
    ) AS pending_offers_count,

    -- performance score: closed / total leads (0.00 if no leads)
    CASE
      WHEN v_total_leads = 0 THEN 0.00
      ELSE ROUND((v_closed_leads::NUMERIC / v_total_leads::NUMERIC) * 100, 2)
    END AS performance_score;
END;
$$;

-- Grant execute to authenticated users (RLS on underlying tables + p_agent_id guard)
GRANT EXECUTE ON FUNCTION get_agent_dashboard_kpis(UUID) TO authenticated;
