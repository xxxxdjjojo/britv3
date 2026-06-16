-- 20260318200000_unified_referrals.sql
--
-- Unified referral system. Replaces:
-- - referral_codes + referral_conversions (buyer system)
-- - provider_referrals (provider system)
--
-- Old tables are NOT dropped — they're preserved for data integrity.
-- New code reads/writes only to `referrals` and `referral_rewards`.
--
-- NOTE: Application code uses SELECT...FOR UPDATE on referrals rows
-- to prevent race conditions in the conversion pipeline (eng review 2A).

-- ============================================================================
-- Enums
-- ============================================================================

-- Simplified state machine (eng review 3A): only pending + rewarded.
-- Add signed_up/verified when verification system exists.
CREATE TYPE referral_status AS ENUM ('pending', 'rewarded');
CREATE TYPE referral_track AS ENUM ('trade_to_trade', 'trade_to_homeowner');
CREATE TYPE referral_tier AS ENUM ('none', 'connector', 'ambassador', 'champion', 'partner');
CREATE TYPE reward_status AS ENUM ('earned', 'applied', 'failed', 'voided');

-- ============================================================================
-- Referrals table
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  track referral_track NOT NULL DEFAULT 'trade_to_trade',
  status referral_status NOT NULL DEFAULT 'pending',
  referred_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ,
  CONSTRAINT unique_referred_id UNIQUE (referred_id)
);

-- Indexes
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

-- ============================================================================
-- Referral codes table (one code per user)
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_codes_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_codes_v2_code ON referral_codes_v2(code);

-- ============================================================================
-- Referral rewards ledger
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL DEFAULT 'subscription_credit',
  amount_pence INTEGER NOT NULL,
  status reward_status NOT NULL DEFAULT 'earned',
  stripe_coupon_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ
);

CREATE INDEX idx_referral_rewards_recipient ON referral_rewards(recipient_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX idx_referral_rewards_referral ON referral_rewards(referral_id);

-- ============================================================================
-- Referrer tier cache (denormalized for fast dashboard reads)
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_tier referral_tier NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- RLS policies
-- ============================================================================

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Referrals: users can see their own (as referrer or referred)
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (
    auth.uid() = referrer_id OR auth.uid() = referred_id
  );

CREATE POLICY "Users can insert referrals for themselves" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Referral codes: users can manage their own
CREATE POLICY "Users can view own referral code" ON referral_codes_v2
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral code" ON referral_codes_v2
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rewards: users can see their own
CREATE POLICY "Users can view own rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = recipient_id);

-- Service role can do everything (for webhook writes)
CREATE POLICY "Service role full access referrals" ON referrals
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access referral_codes_v2" ON referral_codes_v2
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access referral_rewards" ON referral_rewards
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Data migration from old tables (eng review 1A)
-- ============================================================================

-- Migrate buyer referral codes → referral_codes_v2
INSERT INTO referral_codes_v2 (id, user_id, code, created_at)
SELECT id, user_id, code, created_at
FROM referral_codes
ON CONFLICT (user_id) DO NOTHING;

-- Migrate provider referral codes (seed rows where referred_user_id IS NULL)
INSERT INTO referral_codes_v2 (id, user_id, code, created_at)
SELECT id, referrer_id, referral_code, created_at
FROM provider_referrals
WHERE referred_user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Migrate buyer referral conversions → referrals
INSERT INTO referrals (id, referrer_id, referred_id, referral_code, track, status, created_at, converted_at)
SELECT
  id,
  referrer_id,
  referred_id,
  code_used,
  'trade_to_trade'::referral_track,
  CASE WHEN status = 'converted' THEN 'rewarded'::referral_status ELSE 'pending'::referral_status END,
  converted_at,
  CASE WHEN status = 'converted' THEN converted_at ELSE NULL END
FROM referral_conversions
ON CONFLICT (referred_id) DO NOTHING;

-- Migrate provider referrals (non-seed rows where referred_user_id IS NOT NULL)
INSERT INTO referrals (id, referrer_id, referred_id, referral_code, track, status, created_at, converted_at)
SELECT
  id,
  referrer_id,
  referred_user_id,
  referral_code,
  'trade_to_trade'::referral_track,
  CASE
    WHEN status = 'rewarded' THEN 'rewarded'::referral_status
    ELSE 'pending'::referral_status
  END,
  created_at,
  CASE WHEN status = 'rewarded' THEN rewarded_at ELSE NULL END
FROM provider_referrals
WHERE referred_user_id IS NOT NULL
ON CONFLICT (referred_id) DO NOTHING;

-- Update profile tier cache based on migrated data
UPDATE profiles p
SET
  referral_count = sub.cnt,
  referral_tier = CASE
    WHEN sub.cnt >= 10 THEN 'partner'::referral_tier
    WHEN sub.cnt >= 5 THEN 'champion'::referral_tier
    WHEN sub.cnt >= 3 THEN 'ambassador'::referral_tier
    WHEN sub.cnt >= 1 THEN 'connector'::referral_tier
    ELSE 'none'::referral_tier
  END
FROM (
  SELECT referrer_id, COUNT(*) AS cnt
  FROM referrals
  WHERE status = 'rewarded'
  GROUP BY referrer_id
) sub
WHERE p.id = sub.referrer_id;
