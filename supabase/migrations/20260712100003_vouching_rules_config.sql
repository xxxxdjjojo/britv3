-- ============================================================
-- Vouching (provider references) — Migration C:
-- verification_vouch_rules singleton config table
-- ============================================================
-- Single-row config governing the trader vouching gate: how many peer/client
-- vouches are required, client-vouch recency window, invitation expiry, resend
-- cooldown, and whether the gate is enforced. Authenticated users read it
-- (services need the thresholds); only admins write it.

CREATE TABLE IF NOT EXISTS verification_vouch_rules (
  id                      BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  required_peer_vouches   INT NOT NULL DEFAULT 3  CHECK (required_peer_vouches >= 0),
  required_client_vouches INT NOT NULL DEFAULT 3  CHECK (required_client_vouches >= 0),
  client_recency_days     INT NOT NULL DEFAULT 90 CHECK (client_recency_days > 0),
  invite_expiry_days      INT NOT NULL DEFAULT 30 CHECK (invite_expiry_days > 0),
  resend_cooldown_hours   INT NOT NULL DEFAULT 24 CHECK (resend_cooldown_hours >= 0),
  gate_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at              TIMESTAMPTZ DEFAULT now(),
  updated_by              UUID REFERENCES profiles(id)
);

-- Seed the singleton row with defaults.
INSERT INTO verification_vouch_rules (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

-- Keep updated_at fresh on every write. Reuses the shared set_updated_at()
-- trigger fn defined in 20260315000000_billing_tables.sql (same pattern as
-- feature_flags and the other admin config tables).
DROP TRIGGER IF EXISTS verification_vouch_rules_updated_at ON verification_vouch_rules;
CREATE TRIGGER verification_vouch_rules_updated_at
  BEFORE UPDATE ON verification_vouch_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE verification_vouch_rules ENABLE ROW LEVEL SECURITY;

-- Authenticated read — services need the thresholds.
DROP POLICY IF EXISTS verification_vouch_rules_read ON verification_vouch_rules;
CREATE POLICY verification_vouch_rules_read
  ON verification_vouch_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admin write — mirrors the feature_flags admin-write policy.
DROP POLICY IF EXISTS verification_vouch_rules_admin_write ON verification_vouch_rules;
CREATE POLICY verification_vouch_rules_admin_write
  ON verification_vouch_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
