-- Fix: RLS policies reference profiles.role='admin' but the actual column is profiles.is_admin (boolean)
-- This affects admin_audit_log, feature_flags, gdpr_requests, cms_articles, email_campaigns, promo_codes

-- ── admin_audit_log ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_audit_log_select" ON admin_audit_log;
CREATE POLICY "admin_audit_log_select" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- INSERT policy is fine (checks admin_id = auth.uid(), not role)

-- ── feature_flags ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "feature_flags_write" ON feature_flags;
CREATE POLICY "feature_flags_write" ON feature_flags
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── gdpr_requests ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "gdpr_requests_admin" ON gdpr_requests;
CREATE POLICY "gdpr_requests_admin" ON gdpr_requests
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── cms_articles (admin policy) ──────────────────────────────────────
DROP POLICY IF EXISTS "cms_articles_admin" ON cms_articles;
CREATE POLICY "cms_articles_admin" ON cms_articles
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── email_campaigns ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "email_campaigns_admin" ON email_campaigns;
CREATE POLICY "email_campaigns_admin" ON email_campaigns
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── promo_codes ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "promo_codes_admin" ON promo_codes;
CREATE POLICY "promo_codes_admin" ON promo_codes
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── content_reports (admin policy — net-new, not a fix) ──────────────
-- Note: 010_admin.sql never created an admin read policy for content_reports;
-- admins accessed via service_role bypass. Adding explicit RLS for safety.
DROP POLICY IF EXISTS "content_reports_admin_read" ON content_reports;
CREATE POLICY "content_reports_admin_read" ON content_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── email_logs (admin policy — from 20260317100000_email_logs.sql) ───
DROP POLICY IF EXISTS "email_logs_admin_all" ON email_logs;
CREATE POLICY "email_logs_admin_all" ON email_logs
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── feature_flags (additional select policy from 20260318100001) ─────
DROP POLICY IF EXISTS "feature_flags_admin_select" ON feature_flags;
CREATE POLICY "feature_flags_admin_select" ON feature_flags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
