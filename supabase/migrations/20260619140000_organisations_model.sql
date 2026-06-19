-- Organisations tenancy model.
-- Introduces a real multi-user organisation boundary (agencies today, other
-- trader verticals later) alongside the existing single-user agent_id model.
-- This migration is ADDITIVE: it adds new tables + membership helpers only.
-- Ownership is wired onto the ingestion surface in 20260619140001 and existing
-- agencies are backfilled in 20260619140002.

CREATE TABLE IF NOT EXISTS public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  org_type text NOT NULL DEFAULT 'estate_agency'
    CHECK (org_type IN ('estate_agency', 'trade_provider')),
  verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending_review', 'verified', 'suspended', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organisation_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  branch_id uuid REFERENCES public.agent_branches(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'invited', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_memberships_user
  ON public.organisation_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org
  ON public.organisation_memberships(organisation_id, status);

-- ===== Membership helpers =====
-- SECURITY DEFINER so RLS policies on org-owned data can call them without
-- recursing back through organisation_memberships' own RLS.

CREATE OR REPLACE FUNCTION public.is_org_member(p_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organisation_memberships m
    WHERE m.organisation_id = p_org
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(p_org uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organisation_memberships m
    WHERE m.organisation_id = p_org
      AND m.user_id = (SELECT auth.uid())
      AND m.status = 'active'
      AND m.role = ANY (p_roles)
  );
$$;

-- Least privilege: only authenticated callers (via RLS) and the service role
-- need these. auth.uid() is null for anon, so granting anon added no capability.
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, text[]) TO authenticated, service_role;

-- ===== RLS: select for members, writes are service-role only =====
-- (Mirrors the feed ledger posture: reads via RLS, writes via the trusted
-- server-side service role. Org creation/membership management runs server-side.)
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organisations_member_select" ON public.organisations;
CREATE POLICY "organisations_member_select"
  ON public.organisations
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(id));

DROP POLICY IF EXISTS "organisation_memberships_member_select" ON public.organisation_memberships;
CREATE POLICY "organisation_memberships_member_select"
  ON public.organisation_memberships
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.is_org_member(organisation_id)
  );
