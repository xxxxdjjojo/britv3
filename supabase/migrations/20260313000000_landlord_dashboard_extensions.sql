-- Phase 14: Landlord Dashboard Extensions
-- Creates 4 new tables, indexes, RLS policies, storage bucket, and KPI aggregation RPC.
-- Extends the Phase 6 landlord schema to support tenant screening, deposit management,
-- inventory reports, and legal notices workflows.

-- ============================================================================
-- TABLE 1: tenant_applications
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_user_id UUID REFERENCES auth.users(id),
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  -- Application data
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'shortlisted', 'referencing', 'approved', 'rejected', 'withdrawn')),
  monthly_income NUMERIC(10,2),
  employment_status TEXT,
  credit_check_status TEXT CHECK (credit_check_status IN ('pending', 'passed', 'failed', 'not_run')),
  references_status TEXT CHECK (references_status IN ('pending', 'received', 'verified')),
  notes TEXT,
  rejection_reason TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 2: inventory_reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  landlord_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('check_in', 'check_out')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'complete', 'signed')),
  -- Report data (JSONB for flexible room-by-room structure)
  rooms JSONB DEFAULT '[]',
  notes TEXT,
  -- Photos stored as array of Storage paths
  photo_urls TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 3: deposit_registrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS deposit_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenancy_id UUID NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(10,2) NOT NULL,
  scheme TEXT NOT NULL CHECK (scheme IN ('TDS', 'DPS', 'mydeposits', 'other')),
  scheme_reference TEXT,
  registration_date DATE,
  prescribed_info_sent_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'returned', 'disputed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 4: legal_notices
-- ============================================================================

CREATE TABLE IF NOT EXISTS legal_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  landlord_id UUID NOT NULL REFERENCES auth.users(id),
  notice_type TEXT NOT NULL CHECK (notice_type IN ('section_21', 'section_8')),
  -- Section 21 fields
  possession_date DATE,
  deposit_scheme_reference TEXT,
  epc_provided BOOLEAN,
  gas_safety_provided BOOLEAN,
  -- Section 8 fields
  grounds TEXT[],  -- e.g. ['ground_8', 'ground_10']
  arrears_amount NUMERIC(10,2),
  -- Common fields
  served_date DATE,
  pdf_storage_path TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'served')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenant_applications_landlord_id ON tenant_applications(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_property_id ON tenant_applications(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_status ON tenant_applications(status);
CREATE INDEX IF NOT EXISTS idx_inventory_reports_property_id ON inventory_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_deposit_registrations_tenancy_id ON deposit_registrations(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_legal_notices_landlord_id ON legal_notices(landlord_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE tenant_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Landlords can manage their own applications"
  ON tenant_applications FOR ALL
  USING (landlord_id = auth.uid())
  WITH CHECK (landlord_id = auth.uid());

ALTER TABLE inventory_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Landlords can manage their own inventory reports"
  ON inventory_reports FOR ALL
  USING (landlord_id = auth.uid())
  WITH CHECK (landlord_id = auth.uid());

ALTER TABLE deposit_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Landlords can manage their own deposit registrations"
  ON deposit_registrations FOR ALL
  USING (landlord_id = auth.uid())
  WITH CHECK (landlord_id = auth.uid());

ALTER TABLE legal_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Landlords can manage their own legal notices"
  ON legal_notices FOR ALL
  USING (landlord_id = auth.uid())
  WITH CHECK (landlord_id = auth.uid());

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language plpgsql;

CREATE TRIGGER update_tenant_applications_updated_at
  BEFORE UPDATE ON tenant_applications
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_deposit_registrations_updated_at
  BEFORE UPDATE ON deposit_registrations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- STORAGE BUCKET: landlord-documents
-- Private, 5MB limit. Covers: tenancy agreements, legal notices, inventory photos.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landlord-documents',
  'landlord-documents',
  false,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Landlords can manage their own documents"
  ON storage.objects FOR ALL
  USING (bucket_id = 'landlord-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- KPI AGGREGATION RPC: get_landlord_portfolio_kpis
-- Used by portfolio-service.ts for the LD-01 dashboard home KPI block.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_landlord_portfolio_kpis(p_landlord_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_properties', COUNT(DISTINCT p.id),
    'occupied', COUNT(DISTINCT t.property_id) FILTER (WHERE t.lease_end_date >= NOW() AND t.lease_start_date <= NOW()),
    'vacant', COUNT(DISTINCT p.id) - COUNT(DISTINCT t.property_id) FILTER (WHERE t.lease_end_date >= NOW() AND t.lease_start_date <= NOW()),
    'total_monthly_rent', COALESCE(SUM(t.rent_amount) FILTER (WHERE t.lease_end_date >= NOW()), 0),
    'compliance_alerts', COUNT(pd.id) FILTER (WHERE pd.expiry_date <= NOW() + INTERVAL '30 days' AND pd.expiry_date >= NOW()),
    'open_maintenance', COUNT(mr.id) FILTER (WHERE mr.status IN ('open', 'in_progress')),
    'expired_compliance', COUNT(pd.id) FILTER (WHERE pd.expiry_date < NOW())
  ) INTO result
  FROM properties p
  LEFT JOIN tenancies t ON t.property_id = p.id
  LEFT JOIN property_documents pd ON pd.property_id = p.id AND pd.category IN ('gas_safety', 'electrical_eicr', 'epc')
  LEFT JOIN maintenance_requests mr ON mr.property_id = p.id
  WHERE p.landlord_id = p_landlord_id OR t.landlord_id = p_landlord_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
