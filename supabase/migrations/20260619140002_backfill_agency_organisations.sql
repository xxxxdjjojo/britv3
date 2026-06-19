-- Backfill: one organisation (+ owner membership) per existing agency, then
-- propagate organisation_id onto the agent's branches, feed integrations,
-- import ledger rows and listings. Re-runnable: skips agents that already have
-- a membership, so a manual re-apply will not create duplicate organisations.

DO $$
BEGIN
  CREATE TEMPORARY TABLE _org_backfill_map (
    agent_id uuid PRIMARY KEY,
    organisation_id uuid NOT NULL DEFAULT gen_random_uuid()
  ) ON COMMIT DROP;

  -- One org per agency that is not yet onboarded into the org model.
  INSERT INTO _org_backfill_map (agent_id)
  SELECT p.agent_id
  FROM public.agent_agency_profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organisation_memberships m WHERE m.user_id = p.agent_id
  );

  INSERT INTO public.organisations (id, name, slug, org_type, verification_status)
  SELECT
    m.organisation_id,
    COALESCE(NULLIF(trim(p.agency_name), ''), 'Agency'),
    regexp_replace(lower(COALESCE(NULLIF(trim(p.agency_name), ''), 'agency')), '[^a-z0-9]+', '-', 'g')
      || '-' || left(replace(m.organisation_id::text, '-', ''), 8),
    'estate_agency',
    'unverified'
  FROM _org_backfill_map m
  JOIN public.agent_agency_profiles p ON p.agent_id = m.agent_id;

  INSERT INTO public.organisation_memberships (organisation_id, user_id, role, status)
  SELECT m.organisation_id, m.agent_id, 'owner', 'active'
  FROM _org_backfill_map m;

  UPDATE public.agent_branches b
    SET organisation_id = m.organisation_id
    FROM _org_backfill_map m
    WHERE b.agent_id = m.agent_id AND b.organisation_id IS NULL;

  UPDATE public.agent_feed_integrations afi
    SET organisation_id = m.organisation_id
    FROM _org_backfill_map m
    WHERE afi.agent_id = m.agent_id AND afi.organisation_id IS NULL;

  UPDATE public.feed_import_runs r
    SET organisation_id = m.organisation_id
    FROM _org_backfill_map m
    WHERE r.agent_id = m.agent_id AND r.organisation_id IS NULL;

  UPDATE public.feed_import_items i
    SET organisation_id = m.organisation_id
    FROM _org_backfill_map m
    WHERE i.agent_id = m.agent_id AND i.organisation_id IS NULL;

  UPDATE public.feed_listing_links fl
    SET organisation_id = m.organisation_id
    FROM _org_backfill_map m
    WHERE fl.agent_id = m.agent_id AND fl.organisation_id IS NULL;

  UPDATE public.feed_branch_links fb
    SET organisation_id = m.organisation_id
    FROM _org_backfill_map m
    WHERE fb.agent_id = m.agent_id AND fb.organisation_id IS NULL;

  UPDATE public.feed_media_links fm
    SET organisation_id = m.organisation_id
    FROM _org_backfill_map m
    WHERE fm.agent_id = m.agent_id AND fm.organisation_id IS NULL;

  UPDATE public.listings l
    SET organisation_id = m.organisation_id
    FROM _org_backfill_map m
    WHERE l.user_id = m.agent_id AND l.organisation_id IS NULL;
END $$;
