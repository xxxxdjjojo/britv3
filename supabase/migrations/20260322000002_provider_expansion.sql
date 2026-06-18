-- Migration: provider_expansion
-- Adds 'completing' booking status, lat/lng to service_requests,
-- completing state transitions, payment_schedules table, and certificates table.

-- ============================================================
-- 1. 'completing' booking_status enum value is added in
--    20260322000000_booking_status_completing_enum.sql (must be committed in a
--    prior transaction before it can be referenced in seed data below).
-- ============================================================

-- ============================================================
-- 2. Add lat/lng columns to service_requests
-- ============================================================
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_sr_lat_lng ON service_requests (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- ============================================================
-- 3. Add completing transitions to booking_state_transitions
-- ============================================================
INSERT INTO booking_state_transitions (from_status, to_status, allowed_by, requires_reason)
VALUES
  ('in_progress', 'completing', '{"provider"}',  false),
  ('completing',  'completed',  '{"system"}',    false),
  ('completing',  'in_progress','{"system"}',    true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Create payment_schedules table
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_schedules (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID          NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  quote_id        UUID          REFERENCES quotes(id) ON DELETE SET NULL,
  provider_id     UUID          NOT NULL REFERENCES service_provider_details(user_id) ON DELETE CASCADE,
  milestone_label TEXT          NOT NULL,
  amount_pence    BIGINT        NOT NULL CHECK (amount_pence > 0),
  due_at          TIMESTAMPTZ,
  status          TEXT          NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'invoiced', 'paid', 'cancelled')),
  invoice_id      UUID          REFERENCES provider_invoices(id) ON DELETE SET NULL,
  sort_order      INTEGER       NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_booking_id
  ON payment_schedules (booking_id);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_provider_id
  ON payment_schedules (provider_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_payment_schedules_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_schedules_updated_at ON payment_schedules;
CREATE TRIGGER trg_payment_schedules_updated_at
  BEFORE UPDATE ON payment_schedules
  FOR EACH ROW EXECUTE FUNCTION update_payment_schedules_updated_at();

-- RLS
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_select_own_payment_schedules"
  ON payment_schedules FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "provider_insert_own_payment_schedules"
  ON payment_schedules FOR INSERT
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "provider_update_own_payment_schedules"
  ON payment_schedules FOR UPDATE
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "provider_delete_own_payment_schedules"
  ON payment_schedules FOR DELETE
  USING (provider_id = auth.uid());

-- ============================================================
-- 5. Create certificates table
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID        REFERENCES bookings(id) ON DELETE SET NULL,
  provider_id       UUID        NOT NULL REFERENCES service_provider_details(user_id) ON DELETE CASCADE,
  certificate_type  TEXT        NOT NULL
                                CHECK (certificate_type IN (
                                  'gas_safe_cp12',
                                  'eic',
                                  'eicr',
                                  'minor_works',
                                  'custom'
                                )),
  certificate_number TEXT,
  data              JSONB       NOT NULL DEFAULT '{}',
  issued_at         DATE        NOT NULL DEFAULT CURRENT_DATE,
  expires_at        DATE,
  file_path         TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_booking_id
  ON certificates (booking_id);

CREATE INDEX IF NOT EXISTS idx_certificates_provider_id
  ON certificates (provider_id);

CREATE INDEX IF NOT EXISTS idx_certificates_provider_type
  ON certificates (provider_id, certificate_type);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_certificates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_certificates_updated_at ON certificates;
CREATE TRIGGER trg_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW EXECUTE FUNCTION update_certificates_updated_at();

-- RLS (no DELETE — certificates are immutable)
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_select_own_certificates"
  ON certificates FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "provider_insert_own_certificates"
  ON certificates FOR INSERT
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "provider_update_own_certificates"
  ON certificates FOR UPDATE
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());
