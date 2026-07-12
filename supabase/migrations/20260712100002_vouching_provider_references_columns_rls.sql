-- ============================================================
-- Vouching (provider references) — Migration B:
-- invitation columns + constraints + RLS security rewrite
-- ============================================================
-- Adds the referee-invitation columns to provider_references and REWRITES the
-- table's RLS to close the forgery hole: the subject trader could previously
-- UPDATE their own reference rows and forge status='verified' + reference_text
-- from the browser. Trader writes now go through a service-role API route;
-- referee submissions go through service-role endpoints. Traders keep read-only
-- access to their own rows; admins get read + review (update) access.
--
-- Depends on Migration A (20260712100001) having committed the new enum values
-- referenced by the partial indexes below.

-- ------------------------------------------------------------
-- Invitation + review columns
-- ------------------------------------------------------------
ALTER TABLE provider_references
  ADD COLUMN IF NOT EXISTS invite_token_hash   TEXT,           -- sha256 hex of raw token; raw token NEVER stored
  ADD COLUMN IF NOT EXISTS invite_expires_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invite_sent_at      TIMESTAMPTZ,    -- first successful send
  ADD COLUMN IF NOT EXISTS invite_last_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invite_send_count   INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS work_date           DATE,           -- client refs: date work occurred (recency source)
  ADD COLUMN IF NOT EXISTS rating              SMALLINT,
  ADD COLUMN IF NOT EXISTS declined_reason     TEXT,
  ADD COLUMN IF NOT EXISTS declined_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by         UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS review_reason       TEXT;

-- rating range check (added separately so ADD COLUMN IF NOT EXISTS stays clean)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_references_rating_check'
  ) THEN
    ALTER TABLE provider_references
      ADD CONSTRAINT provider_references_rating_check
      CHECK (rating IS NULL OR rating BETWEEN 1 AND 5);
  END IF;
END $$;

-- Defense-in-depth: even service-role / batch paths cannot record a client
-- reference whose work_date is in the future (recency scoring depends on it).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_references_work_date_not_future'
  ) THEN
    ALTER TABLE provider_references
      ADD CONSTRAINT provider_references_work_date_not_future
      CHECK (work_date IS NULL OR work_date <= CURRENT_DATE);
  END IF;
END $$;

-- ------------------------------------------------------------
-- Indexes / uniqueness
-- ------------------------------------------------------------
-- One live token per invitation (raw token is single-use; only the hash lives here).
CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_references_token_hash
  ON provider_references (invite_token_hash) WHERE invite_token_hash IS NOT NULL;

-- One ACTIVE invitation per (provider, referee_email, type). Terminal statuses
-- (declined/expired/revoked/rejected/verified/submitted-not-active) free the slot.
CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_references_active_invite
  ON provider_references (provider_id, lower(referee_email), reference_type)
  WHERE status IN ('pending', 'sent', 'submitted', 'flagged');

-- Expiry sweeps only touch outstanding invitations.
CREATE INDEX IF NOT EXISTS idx_provider_references_expiry
  ON provider_references (invite_expires_at) WHERE status IN ('pending', 'sent');

-- ------------------------------------------------------------
-- RLS rewrite — the security fix
-- ------------------------------------------------------------
-- DROP the trader write policies (INSERT/UPDATE/DELETE). Trader-initiated
-- writes now run through the service-role client (bypasses RLS); referee
-- submissions likewise. UPDATE-own was the forgery hole (trader could set
-- status='verified' + reference_text). DELETE-own is replaced by a status
-- transition through the API, preserving history.
DROP POLICY IF EXISTS "provider_references_insert_own" ON provider_references;
DROP POLICY IF EXISTS "provider_references_update_own" ON provider_references;
DROP POLICY IF EXISTS "provider_references_delete_own" ON provider_references;

-- Recreate SELECT-own as a simple owner predicate (provider_id references
-- service_provider_details.user_id, which equals the owner's auth uid).
DROP POLICY IF EXISTS "provider_references_select_own" ON provider_references;
CREATE POLICY provider_references_select_own
  ON provider_references FOR SELECT
  USING (provider_id = auth.uid());

-- Admin SELECT — mirrors the feature_flags admin-write predicate.
DROP POLICY IF EXISTS provider_references_admin_select ON provider_references;
CREATE POLICY provider_references_admin_select
  ON provider_references FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Admin UPDATE — admin review runs with the user-context client via
-- auditedAdminActionWithPermission, so admins need real RLS write access.
DROP POLICY IF EXISTS provider_references_admin_update ON provider_references;
CREATE POLICY provider_references_admin_update
  ON provider_references FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Tenant-boundary guard: WITH CHECK can only see NEW, so an admin UPDATE could
-- otherwise reassign a row to a different provider_id (or rewrite the referee
-- identity) and slip past the policy. A BEFORE UPDATE trigger sees OLD and NEW,
-- so it can freeze the identity columns for ALL update paths (admin *and*
-- service-role), not just the RLS-gated ones.
CREATE OR REPLACE FUNCTION prevent_provider_reference_identity_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.provider_id IS DISTINCT FROM OLD.provider_id
     OR NEW.referee_email IS DISTINCT FROM OLD.referee_email
     OR NEW.reference_type IS DISTINCT FROM OLD.reference_type THEN
    RAISE EXCEPTION 'provider_references identity columns (provider_id, referee_email, reference_type) are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS provider_references_prevent_identity_change ON provider_references;
CREATE TRIGGER provider_references_prevent_identity_change
  BEFORE UPDATE ON provider_references
  FOR EACH ROW EXECUTE FUNCTION prevent_provider_reference_identity_change();

-- No anon or referee policies: referee + trader-write endpoints use the
-- service-role client, which bypasses RLS.
