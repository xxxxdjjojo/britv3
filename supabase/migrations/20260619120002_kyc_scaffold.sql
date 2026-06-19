-- Identity verification (KYC) scaffold
-- Adds user-level identity KYC tracking to profiles. No live provider is wired
-- yet (KYC_PROVIDER defaults to "stub"); these columns let an AML-gated flow
-- record verification state when a provider is activated later.
--
-- NOTE: distinct from stripe_connect_accounts.kyc_status, which tracks Stripe
-- Connect payout onboarding for providers, not personal identity verification.

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status TEXT
    CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'failed'))
    DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS kyc_provider_ref TEXT;
