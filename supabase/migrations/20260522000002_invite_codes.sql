-- 20260522000002_invite_codes.sql
-- Memo Pivot v2 — invite-only seed onboarding codes.

CREATE TABLE IF NOT EXISTS invite_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  audience        TEXT NOT NULL CHECK (audience IN ('trade', 'agent', 'developer')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id),
  redeemed_at     TIMESTAMPTZ,
  redeemed_by     UUID REFERENCES auth.users(id),
  expires_at      TIMESTAMPTZ,
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS invite_codes_audience_idx ON invite_codes(audience) WHERE redeemed_at IS NULL;
CREATE INDEX IF NOT EXISTS invite_codes_redeemed_idx ON invite_codes(redeemed_at);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- SELECT is admin-only. Public validation goes through the API route
-- (`/api/invites/[code]`) which uses the service-role client to skip RLS.
-- This prevents anon/authenticated clients from dumping unredeemed codes.
DROP POLICY IF EXISTS "Anyone can validate invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Admins can read invite codes" ON invite_codes;
CREATE POLICY "Admins can read invite codes" ON invite_codes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Redemption stays open to authenticated users — they can update any
-- still-unredeemed code so long as they set redeemed_by = themselves.
-- This is safe because validation happens server-side first and the
-- code itself is the secret.
DROP POLICY IF EXISTS "Authenticated users can redeem their own invite" ON invite_codes;
CREATE POLICY "Authenticated users can redeem their own invite" ON invite_codes
  FOR UPDATE TO authenticated
  USING (redeemed_at IS NULL)
  WITH CHECK (redeemed_at IS NOT NULL AND redeemed_by = auth.uid());

-- Admins manage (insert/delete/update) everything
DROP POLICY IF EXISTS "Admins manage invite codes" ON invite_codes;
CREATE POLICY "Admins manage invite codes" ON invite_codes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
