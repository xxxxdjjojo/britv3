-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE tenancy_status AS ENUM ('active', 'ending_soon', 'ended', 'terminated');

CREATE TYPE maintenance_status AS ENUM (
  'new',
  'acknowledged',
  'assigned',
  'in_progress',
  'resolved',
  'closed'
);

CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'emergency');

CREATE TYPE financial_entry_type AS ENUM ('income', 'expense');

CREATE TYPE document_category AS ENUM (
  'gas_safety',
  'electrical_eicr',
  'epc',
  'insurance',
  'lease_agreement',
  'inventory',
  'inspection_report',
  'receipt',
  'other'
);

-- ============================================================================
-- TABLE 1: tenancies
-- ============================================================================

CREATE TABLE tenancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tenant info (may or may not be a Britestate user)
  tenant_name TEXT NOT NULL,
  tenant_email TEXT,
  tenant_phone TEXT,
  tenant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Lease terms
  status tenancy_status DEFAULT 'active',
  lease_start_date DATE NOT NULL,
  lease_end_date DATE,
  rent_amount NUMERIC(10,2) NOT NULL CHECK (rent_amount > 0),
  rent_frequency TEXT DEFAULT 'monthly' CHECK (rent_frequency IN ('weekly', 'monthly')),
  deposit_amount NUMERIC(10,2),
  deposit_scheme TEXT,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_lease_dates CHECK (
    lease_end_date IS NULL OR lease_end_date > lease_start_date
  ),
  CONSTRAINT valid_tenant_email CHECK (
    tenant_email IS NULL OR tenant_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- ============================================================================
-- TABLE 2: maintenance_requests
-- ============================================================================

CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES auth.users(id),

  -- Issue details
  title TEXT NOT NULL CHECK (LENGTH(title) <= 200),
  description TEXT NOT NULL CHECK (LENGTH(description) <= 2000),
  priority maintenance_priority DEFAULT 'medium',
  status maintenance_status DEFAULT 'new',

  -- Assignment (simple link, no marketplace sync)
  assigned_provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_provider_name TEXT,

  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,

  -- Photos (stored as array of Supabase Storage paths)
  photo_urls TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 3: financial_entries (income + expenses unified)
-- ============================================================================

CREATE TABLE financial_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Entry details
  type financial_entry_type NOT NULL,
  category TEXT NOT NULL,
  -- Income categories: 'rent', 'deposit', 'other_income'
  -- Expense categories: 'maintenance', 'insurance', 'service_charge',
  --                     'ground_rent', 'mortgage', 'management_fee', 'other_expense'

  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,

  -- Receipt (optional, Supabase Storage path)
  receipt_url TEXT,

  -- For rent tracking specifically
  rent_period_start DATE,
  rent_period_end DATE,
  payment_status TEXT CHECK (
    payment_status IS NULL OR payment_status IN ('paid', 'partial', 'overdue')
  ),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 4: property_documents (documents + compliance unified)
-- ============================================================================

CREATE TABLE property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Document info
  name TEXT NOT NULL,
  category document_category NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER CHECK (file_size > 0 AND file_size <= 2097152), -- 2MB max

  -- Compliance tracking
  expiry_date DATE,
  next_reminder_date DATE, -- Pre-calculated: expiry_date - 30 days
  reminder_sent BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_reminder_date CHECK (
    next_reminder_date IS NULL OR next_reminder_date <= expiry_date
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Tenancies
CREATE INDEX idx_tenancies_property ON tenancies(property_id) WHERE status = 'active';
CREATE INDEX idx_tenancies_landlord ON tenancies(landlord_id);
CREATE INDEX idx_tenancies_lease_end ON tenancies(lease_end_date) WHERE status = 'active';

-- Maintenance
CREATE INDEX idx_maintenance_property ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(property_id, status)
  WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX idx_maintenance_reported_by ON maintenance_requests(reported_by);

-- Financial entries
CREATE INDEX idx_financial_property ON financial_entries(property_id, entry_date DESC);
CREATE INDEX idx_financial_type ON financial_entries(property_id, type, entry_date DESC);
CREATE INDEX idx_financial_user ON financial_entries(user_id);

-- Documents
CREATE INDEX idx_documents_property ON property_documents(property_id);
CREATE INDEX idx_documents_reminder ON property_documents(next_reminder_date)
  WHERE next_reminder_date IS NOT NULL AND reminder_sent = FALSE;
CREATE INDEX idx_documents_expiry ON property_documents(expiry_date)
  WHERE expiry_date IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER set_tenancies_updated_at
  BEFORE UPDATE ON tenancies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_maintenance_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate next_reminder_date when expiry_date is set
CREATE OR REPLACE FUNCTION calculate_reminder_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    NEW.next_reminder_date := NEW.expiry_date - INTERVAL '30 days';
    NEW.reminder_sent := FALSE;
  ELSE
    NEW.next_reminder_date := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_reminder_date
  BEFORE INSERT OR UPDATE OF expiry_date ON property_documents
  FOR EACH ROW EXECUTE FUNCTION calculate_reminder_date();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

-- Tenancies: landlord manages own tenancies
CREATE POLICY "Landlords manage own tenancies"
  ON tenancies FOR ALL TO authenticated
  USING (landlord_id = auth.uid());

-- Maintenance: property owner or reporter can access
CREATE POLICY "Property owners manage maintenance"
  ON maintenance_requests FOR ALL TO authenticated
  USING (
    reported_by = auth.uid()
    OR property_id IN (
      SELECT property_id FROM listings WHERE user_id = auth.uid()
    )
  );

-- Financial entries: user manages own entries
CREATE POLICY "Users manage own financial entries"
  ON financial_entries FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Documents: uploader and property owner can access
CREATE POLICY "Property owners manage documents"
  ON property_documents FOR ALL TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR property_id IN (
      SELECT property_id FROM listings WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Property financial summary (avoids repeated SUM queries)
CREATE OR REPLACE FUNCTION get_property_financial_summary(
  p_property_id UUID,
  p_start_date DATE DEFAULT DATE_TRUNC('year', CURRENT_DATE)::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_income NUMERIC,
  total_expenses NUMERIC,
  net_income NUMERIC,
  entry_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net_income,
    COUNT(*) AS entry_count
  FROM financial_entries
  WHERE property_id = p_property_id
    AND entry_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get documents due for reminder (used by cron job)
CREATE OR REPLACE FUNCTION get_documents_due_for_reminder()
RETURNS TABLE (
  document_id UUID,
  property_id UUID,
  uploaded_by UUID,
  document_name TEXT,
  category document_category,
  expiry_date DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd.id,
    pd.property_id,
    pd.uploaded_by,
    pd.name,
    pd.category,
    pd.expiry_date,
    (pd.expiry_date - CURRENT_DATE)::INTEGER AS days_until_expiry
  FROM property_documents pd
  WHERE pd.next_reminder_date <= CURRENT_DATE
    AND pd.reminder_sent = FALSE
    AND pd.expiry_date > CURRENT_DATE
  ORDER BY pd.expiry_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create storage buckets for Epic 7
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('maintenance-photos', 'maintenance-photos', false, 1048576),    -- 1MB limit
  ('expense-receipts', 'expense-receipts', false, 2097152),        -- 2MB limit
  ('property-documents', 'property-documents', false, 2097152);    -- 2MB limit

-- RLS: Users can upload to their own properties
CREATE POLICY "Users upload to own property folders"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('maintenance-photos', 'expense-receipts', 'property-documents')
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM properties p
    JOIN listings l ON l.property_id = p.id
    WHERE l.user_id = auth.uid()
  )
);

-- RLS: Users can read their own uploads
CREATE POLICY "Users read own property files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('maintenance-photos', 'expense-receipts', 'property-documents')
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM properties p
    JOIN listings l ON l.property_id = p.id
    WHERE l.user_id = auth.uid()
  )
);

-- RLS: Users can delete their own uploads
CREATE POLICY "Users delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('maintenance-photos', 'expense-receipts', 'property-documents')
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM properties p
    JOIN listings l ON l.property_id = p.id
    WHERE l.user_id = auth.uid()
  )
);
