-- Companies House verification gate
-- Adds incorporation/verification tracking columns to the agent and provider
-- legal-entity tables so onboarding can enforce a "registered >= 2 years" rule.
-- All statements are idempotent and tolerate the table not existing locally
-- (some entity tables are provisioned in other environments).

-- ---------------------------------------------------------------------------
-- service_provider_details (tradespeople / service providers)
-- company_number + years_in_business already exist (002_marketplace.sql)
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.service_provider_details
  ADD COLUMN IF NOT EXISTS companies_house_status TEXT,
  ADD COLUMN IF NOT EXISTS companies_house_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS incorporation_date DATE;

-- service_provider_profiles is the table the tradesperson onboarding writes to.
-- company_number is optional here (many tradespeople are sole traders).
ALTER TABLE IF EXISTS public.service_provider_profiles
  ADD COLUMN IF NOT EXISTS company_number TEXT,
  ADD COLUMN IF NOT EXISTS companies_house_status TEXT,
  ADD COLUMN IF NOT EXISTS companies_house_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS incorporation_date DATE;

-- ---------------------------------------------------------------------------
-- agent_agency_profiles (estate-agent agency dashboard profile)
-- company_number already added in 20260612000000_truedeed_introductions.sql
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.agent_agency_profiles
  ADD COLUMN IF NOT EXISTS companies_house_status TEXT,
  ADD COLUMN IF NOT EXISTS companies_house_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS incorporation_date DATE;

-- ---------------------------------------------------------------------------
-- agencies (legal entity written by agent onboarding)
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.agencies
  ADD COLUMN IF NOT EXISTS company_number TEXT,
  ADD COLUMN IF NOT EXISTS companies_house_status TEXT,
  ADD COLUMN IF NOT EXISTS companies_house_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS incorporation_date DATE;
