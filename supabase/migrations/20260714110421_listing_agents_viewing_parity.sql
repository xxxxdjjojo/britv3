-- =============================================================================
-- Estate-agent representation on a listing + viewing parity with the host.
--
-- Today a property's viewings (in-person / virtual appointments) are owned only
-- by the listing owner (`listings.user_id`, "the host"): only they can publish
-- viewing_slots, see booked viewings with times, and confirm/decline requests.
-- An estate agent marketing the property on the owner's behalf has no way in.
--
-- This migration adds a `listing_agents` representation link so an owner can
-- attach an estate agent to a listing, and extends the existing viewing RLS
-- policies + respond_viewing_request RPC so a *represented* agent gets full
-- parity with the host for viewings — nothing more.
--
-- Backward-compatible & additive: a new table, and strictly-more-permissive
-- OR clauses appended to existing viewing policies / the RPC auth block. No
-- existing access is revoked. Idempotent on re-run (guards + DROP IF EXISTS).
--
-- Policy/constraint names below are the EXACT current prod names for the
-- objects being extended (the ledger was baseline-squashed; do not trust
-- migration-file names).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. listing_agents — an owner attaches an estate agent to their listing.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listing_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','removed')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One active representation per (listing, agent). Removed rows are kept for
-- history and do not block re-adding the same agent later.
CREATE UNIQUE INDEX IF NOT EXISTS listing_agents_unique_active
  ON public.listing_agents (listing_id, agent_id) WHERE status = 'active';

-- Fast lookup of "listings this agent actively represents" (dashboard, RLS).
CREATE INDEX IF NOT EXISTS listing_agents_agent_active_idx
  ON public.listing_agents (agent_id) WHERE status = 'active';

ALTER TABLE public.listing_agents ENABLE ROW LEVEL SECURITY;

-- The agent sees their own assignments; the owner sees assignments on their
-- listings.
DROP POLICY IF EXISTS "listing_agents_select" ON public.listing_agents;
CREATE POLICY "listing_agents_select" ON public.listing_agents
  FOR SELECT TO authenticated
  USING (
    auth.uid() = agent_id
    OR auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id)
  );

-- Only the listing owner may attach an agent, and must record themselves as
-- the creator.
DROP POLICY IF EXISTS "listing_agents_insert" ON public.listing_agents;
CREATE POLICY "listing_agents_insert" ON public.listing_agents
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id)
    AND created_by = auth.uid()
  );

-- Only the listing owner may change status (e.g. set 'removed'). Soft-remove
-- only — there is deliberately NO DELETE policy.
DROP POLICY IF EXISTS "listing_agents_update" ON public.listing_agents;
CREATE POLICY "listing_agents_update" ON public.listing_agents
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id));

-- ---------------------------------------------------------------------------
-- 2. viewing_slots RLS — grant a represented agent host-parity.
--    The represented-agent predicate (inline EXISTS) is OR'd into each policy.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "viewing_slots_select_public" ON public.viewing_slots;
CREATE POLICY "viewing_slots_select_public" ON public.viewing_slots
  FOR SELECT TO anon, authenticated
  USING (
    status = 'available'
    OR auth.uid() = agent_id
    OR auth.uid() = booked_by
    OR EXISTS (
      SELECT 1 FROM public.listing_agents la
      WHERE la.listing_id = viewing_slots.listing_id
        AND la.agent_id = auth.uid() AND la.status = 'active'
    )
  );

-- The host OR a represented agent may publish slots. agent_id stays = the
-- inserting user (the represented agent is recorded as the slot's creator).
DROP POLICY IF EXISTS "viewing_slots_host_insert" ON public.viewing_slots;
CREATE POLICY "viewing_slots_host_insert" ON public.viewing_slots
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = agent_id
    AND (
      EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.id = listing_id AND l.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.listing_agents la
        WHERE la.listing_id = viewing_slots.listing_id
          AND la.agent_id = auth.uid() AND la.status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "viewing_slots_host_update" ON public.viewing_slots;
CREATE POLICY "viewing_slots_host_update" ON public.viewing_slots
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = agent_id
    OR EXISTS (
      SELECT 1 FROM public.listing_agents la
      WHERE la.listing_id = viewing_slots.listing_id
        AND la.agent_id = auth.uid() AND la.status = 'active'
    )
  )
  WITH CHECK (
    auth.uid() = agent_id
    OR EXISTS (
      SELECT 1 FROM public.listing_agents la
      WHERE la.listing_id = viewing_slots.listing_id
        AND la.agent_id = auth.uid() AND la.status = 'active'
    )
  );

-- The host OR a represented agent may delete only an unbooked slot.
DROP POLICY IF EXISTS "viewing_slots_host_delete" ON public.viewing_slots;
CREATE POLICY "viewing_slots_host_delete" ON public.viewing_slots
  FOR DELETE TO authenticated
  USING (
    (
      auth.uid() = agent_id
      OR EXISTS (
        SELECT 1 FROM public.listing_agents la
        WHERE la.listing_id = viewing_slots.listing_id
          AND la.agent_id = auth.uid() AND la.status = 'active'
      )
    )
    AND status = 'available'
  );

-- ---------------------------------------------------------------------------
-- 3. viewings SELECT — a represented agent sees booked viewings (with times)
--    on listings they represent, alongside the buyer and the owner.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "viewings_select" ON public.viewings;
CREATE POLICY "viewings_select" ON public.viewings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id)
    OR EXISTS (
      SELECT 1 FROM public.listing_agents la
      WHERE la.listing_id = viewings.listing_id
        AND la.agent_id = auth.uid() AND la.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- 4. respond_viewing_request — a represented agent may confirm/decline a
--    pending request, exactly like the host. Body reproduced verbatim from
--    20260706155747_fix_viewing_booking.sql; ONLY the authorization block
--    changed to also accept a represented agent.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_viewing_request(
  p_viewing_id uuid,
  p_action text,
  p_slot_id uuid DEFAULT NULL
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_viewing public.viewings;
  v_slot    public.viewing_slots;
BEGIN
  IF p_action NOT IN ('confirm', 'decline') THEN
    RETURN jsonb_build_object('error', 'invalid_action');
  END IF;

  SELECT * INTO v_viewing
  FROM public.viewings
  WHERE id = p_viewing_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- The listing owner OR a represented agent may respond.
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = v_viewing.listing_id AND l.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.listing_agents la
      WHERE la.listing_id = v_viewing.listing_id
        AND la.agent_id = auth.uid() AND la.status = 'active'
    )
  ) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  IF p_action = 'decline' THEN
    UPDATE public.viewings SET status = 'declined', updated_at = now() WHERE id = p_viewing_id;
  ELSE
    -- Optionally attach an available slot the host is offering.
    IF p_slot_id IS NOT NULL THEN
      SELECT * INTO v_slot
      FROM public.viewing_slots
      WHERE id = p_slot_id AND listing_id = v_viewing.listing_id AND status = 'available'
      FOR UPDATE;

      IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'slot_taken');
      END IF;

      UPDATE public.viewing_slots
      SET status = 'booked', booked_by = v_viewing.user_id, updated_at = now()
      WHERE id = p_slot_id;

      UPDATE public.viewings
      SET status = 'confirmed', slot_id = p_slot_id, updated_at = now()
      WHERE id = p_viewing_id;
    ELSE
      UPDATE public.viewings SET status = 'confirmed', updated_at = now() WHERE id = p_viewing_id;
    END IF;
  END IF;

  -- Notify the requester (keyed to the viewing so getUserEntityIds routes it).
  INSERT INTO public.platform_events (event_type, entity_type, entity_id, actor_id, metadata)
  VALUES (
    'viewing_request_responded', 'viewing', p_viewing_id, auth.uid(),
    jsonb_build_object('action', p_action, 'listing_id', v_viewing.listing_id)
  );

  RETURN jsonb_build_object('success', true, 'action', p_action);
END;
$$;

REVOKE ALL ON FUNCTION public.respond_viewing_request(uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_viewing_request(uuid, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.respond_viewing_request(uuid, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. is_estate_agent — lets the assign-agent API validate a target user holds
--    the 'agent' role WITHOUT exposing user_roles (whose SELECT RLS is
--    owner-only, so an owner querying another user's roles gets []). Returns
--    only a boolean, so no roles are leaked.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_estate_agent(p_user_id uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'agent'
  );
$$;

REVOKE ALL ON FUNCTION public.is_estate_agent(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_estate_agent(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_estate_agent(uuid) TO authenticated;
