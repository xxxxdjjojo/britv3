-- Organisation-scope the partner-ingestion surface.
-- ADDITIVE: adds nullable organisation_id to the agent-owned ingestion tables,
-- adds membership-based SELECT policies alongside the existing agent_id ones
-- (Postgres permissive policies OR together), and teaches the feed tenant
-- triggers to keep organisation_id consistent with the integration's org.
-- Existing agent_id columns/policies are untouched.

-- ===== organisation_id columns =====
ALTER TABLE public.agent_branches
  ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL;
ALTER TABLE public.agent_feed_integrations
  ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL;
ALTER TABLE public.feed_import_runs
  ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL;
ALTER TABLE public.feed_import_items
  ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL;
ALTER TABLE public.feed_listing_links
  ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL;
ALTER TABLE public.feed_branch_links
  ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL;
ALTER TABLE public.feed_media_links
  ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL;
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agent_feed_integrations_org
  ON public.agent_feed_integrations(organisation_id);
CREATE INDEX IF NOT EXISTS idx_feed_import_runs_org
  ON public.feed_import_runs(organisation_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_import_items_org
  ON public.feed_import_items(organisation_id, status);
CREATE INDEX IF NOT EXISTS idx_feed_listing_links_org
  ON public.feed_listing_links(organisation_id);
CREATE INDEX IF NOT EXISTS idx_feed_branch_links_org
  ON public.feed_branch_links(organisation_id);
CREATE INDEX IF NOT EXISTS idx_feed_media_links_org
  ON public.feed_media_links(organisation_id);
CREATE INDEX IF NOT EXISTS idx_listings_org
  ON public.listings(organisation_id);
CREATE INDEX IF NOT EXISTS idx_agent_branches_org
  ON public.agent_branches(organisation_id);

-- ===== Membership-based SELECT policies (additive to agent_id policies) =====
DROP POLICY IF EXISTS "feed_import_runs_org_member_select" ON public.feed_import_runs;
CREATE POLICY "feed_import_runs_org_member_select"
  ON public.feed_import_runs FOR SELECT TO authenticated
  USING (organisation_id IS NOT NULL AND public.is_org_member(organisation_id));

DROP POLICY IF EXISTS "feed_import_items_org_member_select" ON public.feed_import_items;
CREATE POLICY "feed_import_items_org_member_select"
  ON public.feed_import_items FOR SELECT TO authenticated
  USING (organisation_id IS NOT NULL AND public.is_org_member(organisation_id));

DROP POLICY IF EXISTS "feed_listing_links_org_member_select" ON public.feed_listing_links;
CREATE POLICY "feed_listing_links_org_member_select"
  ON public.feed_listing_links FOR SELECT TO authenticated
  USING (organisation_id IS NOT NULL AND public.is_org_member(organisation_id));

DROP POLICY IF EXISTS "feed_branch_links_org_member_select" ON public.feed_branch_links;
CREATE POLICY "feed_branch_links_org_member_select"
  ON public.feed_branch_links FOR SELECT TO authenticated
  USING (organisation_id IS NOT NULL AND public.is_org_member(organisation_id));

DROP POLICY IF EXISTS "feed_media_links_org_member_select" ON public.feed_media_links;
CREATE POLICY "feed_media_links_org_member_select"
  ON public.feed_media_links FOR SELECT TO authenticated
  USING (organisation_id IS NOT NULL AND public.is_org_member(organisation_id));

DROP POLICY IF EXISTS "agent_feed_integrations_org_member_select" ON public.agent_feed_integrations;
CREATE POLICY "agent_feed_integrations_org_member_select"
  ON public.agent_feed_integrations FOR SELECT TO authenticated
  USING (organisation_id IS NOT NULL AND public.is_org_member(organisation_id));

-- ===== Org-consistency in feed tenant triggers =====
-- Each guard keeps its existing agent_id check AND, when organisation_id is set,
-- requires it to match the owning integration's organisation_id.

CREATE OR REPLACE FUNCTION public.assert_feed_import_run_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.agent_feed_integrations afi
    WHERE afi.id = NEW.integration_id AND afi.agent_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed import run tenant mismatch';
  END IF;

  IF NEW.organisation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.agent_feed_integrations afi
    WHERE afi.id = NEW.integration_id AND afi.organisation_id = NEW.organisation_id
  ) THEN
    RAISE EXCEPTION 'feed import run organisation mismatch';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_feed_import_item_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.feed_import_runs run
    WHERE run.id = NEW.run_id
      AND run.integration_id = NEW.integration_id
      AND run.agent_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed import item tenant mismatch';
  END IF;

  IF NEW.organisation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.feed_import_runs run
    WHERE run.id = NEW.run_id AND run.organisation_id = NEW.organisation_id
  ) THEN
    RAISE EXCEPTION 'feed import item organisation mismatch';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_feed_listing_link_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.agent_feed_integrations afi
    WHERE afi.id = NEW.integration_id AND afi.agent_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed listing link integration tenant mismatch';
  END IF;

  IF NEW.listing_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = NEW.listing_id AND l.user_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed listing link listing tenant mismatch';
  END IF;

  IF NEW.organisation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.agent_feed_integrations afi
    WHERE afi.id = NEW.integration_id AND afi.organisation_id = NEW.organisation_id
  ) THEN
    RAISE EXCEPTION 'feed listing link organisation mismatch';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_feed_branch_link_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.agent_feed_integrations afi
    WHERE afi.id = NEW.integration_id AND afi.agent_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed branch link integration tenant mismatch';
  END IF;

  IF NEW.branch_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.agent_branches b
    WHERE b.id = NEW.branch_id AND b.agent_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed branch link branch tenant mismatch';
  END IF;

  IF NEW.organisation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.agent_feed_integrations afi
    WHERE afi.id = NEW.integration_id AND afi.organisation_id = NEW.organisation_id
  ) THEN
    RAISE EXCEPTION 'feed branch link organisation mismatch';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_feed_media_link_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.agent_feed_integrations afi
    JOIN public.listings l ON l.id = NEW.listing_id
    WHERE afi.id = NEW.integration_id
      AND afi.agent_id = NEW.agent_id
      AND l.user_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed media link tenant mismatch';
  END IF;

  IF NEW.media_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.property_media pm
    WHERE pm.id = NEW.media_id AND pm.listing_id = NEW.listing_id
  ) THEN
    RAISE EXCEPTION 'feed media link media mismatch';
  END IF;

  IF NEW.organisation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.agent_feed_integrations afi
    WHERE afi.id = NEW.integration_id AND afi.organisation_id = NEW.organisation_id
  ) THEN
    RAISE EXCEPTION 'feed media link organisation mismatch';
  END IF;

  RETURN NEW;
END;
$$;
