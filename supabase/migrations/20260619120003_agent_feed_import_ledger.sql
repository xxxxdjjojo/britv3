-- Agent feed import ledger.
-- Live portal/CRM connectors should write into this review ledger before any
-- canonical property/listing/media publication.

CREATE TABLE IF NOT EXISTS public.feed_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.agent_feed_integrations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  source_fingerprint text NOT NULL,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'needs_review', 'succeeded', 'failed', 'published')),
  total_items integer NOT NULL DEFAULT 0 CHECK (total_items >= 0),
  eligible_items integer NOT NULL DEFAULT 0 CHECK (eligible_items >= 0),
  error_items integer NOT NULL DEFAULT 0 CHECK (error_items >= 0),
  published_items integer NOT NULL DEFAULT 0 CHECK (published_items >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  error_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_id, source_fingerprint)
);

CREATE TABLE IF NOT EXISTS public.feed_import_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.feed_import_runs(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.agent_feed_integrations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('listing', 'branch', 'media')),
  external_id text NOT NULL,
  external_branch_id text,
  payload jsonb NOT NULL,
  normalized_payload jsonb,
  payload_sha256 text NOT NULL,
  status text NOT NULL DEFAULT 'needs_review'
    CHECK (status IN ('needs_review', 'approved', 'rejected', 'published', 'failed', 'withdrawn')),
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  canonical_listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, item_type, external_id)
);

CREATE TABLE IF NOT EXISTS public.feed_listing_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.agent_feed_integrations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_listing_id text NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  last_seen_run_id uuid REFERENCES public.feed_import_runs(id) ON DELETE SET NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_id, external_listing_id),
  UNIQUE (integration_id, listing_id)
);

CREATE TABLE IF NOT EXISTS public.feed_branch_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.agent_feed_integrations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_branch_id text NOT NULL,
  branch_id uuid REFERENCES public.agent_branches(id) ON DELETE CASCADE,
  last_seen_run_id uuid REFERENCES public.feed_import_runs(id) ON DELETE SET NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_id, external_branch_id),
  UNIQUE (integration_id, branch_id)
);

CREATE TABLE IF NOT EXISTS public.feed_media_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.agent_feed_integrations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_media_id text NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  media_id uuid REFERENCES public.property_media(id) ON DELETE CASCADE,
  source_url text,
  source_sha256 text,
  last_seen_run_id uuid REFERENCES public.feed_import_runs(id) ON DELETE SET NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_id, listing_id, external_media_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_import_runs_agent_id
  ON public.feed_import_runs(agent_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_import_runs_integration_id
  ON public.feed_import_runs(integration_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_feed_import_items_agent_id
  ON public.feed_import_items(agent_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_import_items_run_id
  ON public.feed_import_items(run_id, status);
CREATE INDEX IF NOT EXISTS idx_feed_import_items_external_id
  ON public.feed_import_items(integration_id, item_type, external_id);

CREATE INDEX IF NOT EXISTS idx_feed_listing_links_agent_id
  ON public.feed_listing_links(agent_id, listing_id);
CREATE INDEX IF NOT EXISTS idx_feed_listing_links_last_seen
  ON public.feed_listing_links(agent_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_listing_links_listing_id
  ON public.feed_listing_links(listing_id);
CREATE INDEX IF NOT EXISTS idx_feed_listing_links_property_id
  ON public.feed_listing_links(property_id);

CREATE INDEX IF NOT EXISTS idx_feed_branch_links_agent_id
  ON public.feed_branch_links(agent_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_feed_branch_links_external_id
  ON public.feed_branch_links(integration_id, external_branch_id);

CREATE INDEX IF NOT EXISTS idx_feed_media_links_agent_id
  ON public.feed_media_links(agent_id, listing_id);
CREATE INDEX IF NOT EXISTS idx_feed_media_links_media_id
  ON public.feed_media_links(media_id);
CREATE INDEX IF NOT EXISTS idx_feed_media_links_external_id
  ON public.feed_media_links(integration_id, listing_id, external_media_id);

ALTER TABLE public.feed_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_import_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_listing_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_branch_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_media_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_import_runs_agent_select" ON public.feed_import_runs;
CREATE POLICY "feed_import_runs_agent_select"
  ON public.feed_import_runs
  FOR SELECT
  TO authenticated
  USING (agent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "feed_import_items_agent_select" ON public.feed_import_items;
CREATE POLICY "feed_import_items_agent_select"
  ON public.feed_import_items
  FOR SELECT
  TO authenticated
  USING (agent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "feed_listing_links_agent_select" ON public.feed_listing_links;
CREATE POLICY "feed_listing_links_agent_select"
  ON public.feed_listing_links
  FOR SELECT
  TO authenticated
  USING (agent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "feed_branch_links_agent_select" ON public.feed_branch_links;
CREATE POLICY "feed_branch_links_agent_select"
  ON public.feed_branch_links
  FOR SELECT
  TO authenticated
  USING (agent_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "feed_media_links_agent_select" ON public.feed_media_links;
CREATE POLICY "feed_media_links_agent_select"
  ON public.feed_media_links
  FOR SELECT
  TO authenticated
  USING (agent_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.assert_feed_import_run_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.agent_feed_integrations afi
    WHERE afi.id = NEW.integration_id
      AND afi.agent_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed import run tenant mismatch';
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
    SELECT 1
    FROM public.feed_import_runs run
    WHERE run.id = NEW.run_id
      AND run.integration_id = NEW.integration_id
      AND run.agent_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed import item tenant mismatch';
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
    SELECT 1
    FROM public.agent_feed_integrations afi
    WHERE afi.id = NEW.integration_id
      AND afi.agent_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed listing link integration tenant mismatch';
  END IF;

  IF NEW.listing_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = NEW.listing_id
      AND l.user_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed listing link listing tenant mismatch';
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
    SELECT 1
    FROM public.agent_feed_integrations afi
    WHERE afi.id = NEW.integration_id
      AND afi.agent_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed branch link integration tenant mismatch';
  END IF;

  IF NEW.branch_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.agent_branches b
    WHERE b.id = NEW.branch_id
      AND b.agent_id = NEW.agent_id
  ) THEN
    RAISE EXCEPTION 'feed branch link branch tenant mismatch';
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
    SELECT 1
    FROM public.property_media pm
    WHERE pm.id = NEW.media_id
      AND pm.listing_id = NEW.listing_id
  ) THEN
    RAISE EXCEPTION 'feed media link media mismatch';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_feed_import_runs_tenant ON public.feed_import_runs;
CREATE TRIGGER trg_feed_import_runs_tenant
  BEFORE INSERT OR UPDATE ON public.feed_import_runs
  FOR EACH ROW EXECUTE FUNCTION public.assert_feed_import_run_tenant();

DROP TRIGGER IF EXISTS trg_feed_import_items_tenant ON public.feed_import_items;
CREATE TRIGGER trg_feed_import_items_tenant
  BEFORE INSERT OR UPDATE ON public.feed_import_items
  FOR EACH ROW EXECUTE FUNCTION public.assert_feed_import_item_tenant();

DROP TRIGGER IF EXISTS trg_feed_listing_links_tenant ON public.feed_listing_links;
CREATE TRIGGER trg_feed_listing_links_tenant
  BEFORE INSERT OR UPDATE ON public.feed_listing_links
  FOR EACH ROW EXECUTE FUNCTION public.assert_feed_listing_link_tenant();

DROP TRIGGER IF EXISTS trg_feed_branch_links_tenant ON public.feed_branch_links;
CREATE TRIGGER trg_feed_branch_links_tenant
  BEFORE INSERT OR UPDATE ON public.feed_branch_links
  FOR EACH ROW EXECUTE FUNCTION public.assert_feed_branch_link_tenant();

DROP TRIGGER IF EXISTS trg_feed_media_links_tenant ON public.feed_media_links;
CREATE TRIGGER trg_feed_media_links_tenant
  BEFORE INSERT OR UPDATE ON public.feed_media_links
  FOR EACH ROW EXECUTE FUNCTION public.assert_feed_media_link_tenant();
