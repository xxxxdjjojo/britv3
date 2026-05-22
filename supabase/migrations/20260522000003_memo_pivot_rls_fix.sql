-- 20260522000003_memo_pivot_rls_fix.sql
-- Memo Pivot v2 — fix RLS policies for sdr_* + invite_codes to match
-- the actual profiles schema (is_admin boolean), not the speculative
-- profiles.role = 'admin' text column the earlier migrations assumed.

-- SDR policies
DROP POLICY IF EXISTS "Admins only — campaigns" ON sdr_campaigns;
CREATE POLICY "Admins only — campaigns" ON sdr_campaigns
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "Admins only — targets" ON sdr_targets;
CREATE POLICY "Admins only — targets" ON sdr_targets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "Admins only — messages" ON sdr_messages;
CREATE POLICY "Admins only — messages" ON sdr_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Invite codes
DROP POLICY IF EXISTS "Admins can read invite codes" ON invite_codes;
CREATE POLICY "Admins can read invite codes" ON invite_codes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "Authenticated users can redeem their own invite" ON invite_codes;
CREATE POLICY "Authenticated users can redeem their own invite" ON invite_codes
  FOR UPDATE TO authenticated
  USING (redeemed_at IS NULL)
  WITH CHECK (redeemed_at IS NOT NULL AND redeemed_by = auth.uid());

DROP POLICY IF EXISTS "Admins manage invite codes" ON invite_codes;
CREATE POLICY "Admins manage invite codes" ON invite_codes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
