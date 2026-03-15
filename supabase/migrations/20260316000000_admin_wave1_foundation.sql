-- ============================================================
-- Wave 1: Admin Foundation Migration
-- ============================================================

-- 1. Suspend/ban fields on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz,
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz;

-- 2. Admin audit log (append-only)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  metadata jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_admin_id_idx
  ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON admin_audit_log(created_at DESC);

-- RLS: append-only, no UPDATE/DELETE even for admins
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_audit_log_select" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_audit_log_insert" ON admin_audit_log
  FOR INSERT WITH CHECK (admin_id = auth.uid());

-- 3. Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  key text PRIMARY KEY,
  enabled boolean DEFAULT false,
  rollout_pct int DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  allowed_roles text[],
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Auto-update updated_at on feature_flags changes
-- Note: set_updated_at() function is defined in 20260313_agent_dashboard migration
CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_select" ON feature_flags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "feature_flags_write" ON feature_flags
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. GDPR requests
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  request_type text NOT NULL CHECK (
    request_type IN ('access', 'deletion', 'portability', 'rectification')
  ),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'fulfilled', 'rejected', 'failed', 'email_failed')
  ),
  export_url text,
  export_expires_at timestamptz,
  notes text,
  fulfilled_by uuid REFERENCES profiles(id),
  fulfilled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gdpr_requests_status_idx
  ON gdpr_requests(status)
  WHERE status = 'pending';

ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gdpr_requests_own" ON gdpr_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "gdpr_requests_admin" ON gdpr_requests
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. GIN index for user search performance
CREATE INDEX IF NOT EXISTS profiles_search_idx
  ON profiles
  USING gin(
    to_tsvector('english',
      coalesce(full_name, '') || ' ' || coalesce(email, '')
    )
  );
