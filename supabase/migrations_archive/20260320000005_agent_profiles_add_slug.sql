-- ============================================================================
-- Add missing columns to agent_agency_profiles for public profile support.
--
-- The table was created in 20260313_agent_dashboard.sql but the public profile
-- routes (agents/[slug]) and RPC (get_agent_public_stats) expect columns that
-- were not originally defined: slug, user_id, display_name, bio, role, agency_id.
-- ============================================================================

-- slug: URL-friendly identifier for /agents/[slug] route
ALTER TABLE public.agent_agency_profiles
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- display_name: agent's public-facing name (may differ from agency_name)
ALTER TABLE public.agent_agency_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- bio: free-text agent biography
ALTER TABLE public.agent_agency_profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- role: agent's role within the agency (e.g. "Senior Negotiator", "Branch Manager")
ALTER TABLE public.agent_agency_profiles
  ADD COLUMN IF NOT EXISTS role TEXT;

-- user_id: alias for agent_id to match the provider convention used in services
ALTER TABLE public.agent_agency_profiles
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- agency_id: self-referential FK for team member grouping under a parent agency
ALTER TABLE public.agent_agency_profiles
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agent_agency_profiles(id) ON DELETE SET NULL;

-- Populate user_id from agent_id for existing rows
UPDATE public.agent_agency_profiles
  SET user_id = agent_id
  WHERE user_id IS NULL AND agent_id IS NOT NULL;

-- Generate slugs from agency_name for existing rows that lack one
UPDATE public.agent_agency_profiles
  SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(agency_name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
  WHERE slug IS NULL AND agency_name IS NOT NULL;

-- Unique index on slug for fast lookups and uniqueness enforcement
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_agency_profiles_slug
  ON public.agent_agency_profiles (slug)
  WHERE slug IS NOT NULL;

-- Index on agency_id for team member queries
CREATE INDEX IF NOT EXISTS idx_agent_agency_profiles_agency_id
  ON public.agent_agency_profiles (agency_id)
  WHERE agency_id IS NOT NULL;

-- Allow public (anon) read access for the slug column (extends existing public read policy)
-- The 20260317300000_agent_profiles_public_read.sql migration already grants SELECT;
-- this ensures the new columns are included in that policy automatically.
