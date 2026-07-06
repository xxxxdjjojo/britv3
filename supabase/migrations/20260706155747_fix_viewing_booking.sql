-- =============================================================================
-- Fix "Book a Viewing" end-to-end.
--
-- Root causes this migration addresses (see the buyer-facing modal error
-- "Could not load available slots"):
--
--  * RLS: viewing_slots SELECT was `USING (auth.uid() = agent_id)`, so buyers /
--    renters / anon could NEVER read a property's available slots. Rewritten so
--    anyone may read AVAILABLE slots; hosts and the booker keep full visibility.
--  * Missing RPC: the deployed book-viewing route calls `claim_viewing_slot`,
--    which existed only in a code comment. Created here to match that contract.
--  * Request-a-viewing fallback: when a property has no published slots, an
--    authenticated user can propose a time (a slot-less `viewings` row with
--    status 'pending'); the host confirms/declines from their dashboard.
--  * Host notifications: the claim/request RPCs emit platform_events so the
--    host's bell feed lights up (getUserEntityIds already includes owned
--    listings, so an event keyed to the listing reaches the host).
--
-- Backward-compatible: additive columns, widened CHECKs, an added FK (0 orphans
-- verified on prod), and a strictly-more-permissive SELECT policy. Safe to apply
-- BEFORE the code deploy — it part-fixes the currently-deployed (broken) code.
--
-- Constraint names below are the EXACT current prod names (the ledger was
-- baseline-squashed; do not trust migration-file names). DROP ... IF EXISTS
-- keeps re-runs idempotent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. viewing_slots: track who booked + optional note, and tie to a real listing
-- ---------------------------------------------------------------------------
ALTER TABLE public.viewing_slots
  ADD COLUMN IF NOT EXISTS booked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.viewing_slots
  DROP CONSTRAINT IF EXISTS viewing_slots_listing_id_fkey;
ALTER TABLE public.viewing_slots
  ADD CONSTRAINT viewing_slots_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 2. viewings: support slot-less "requested" viewings + a preferred time
-- ---------------------------------------------------------------------------
ALTER TABLE public.viewings ALTER COLUMN slot_id DROP NOT NULL;
ALTER TABLE public.viewings ADD COLUMN IF NOT EXISTS preferred_time timestamptz;

ALTER TABLE public.viewings DROP CONSTRAINT IF EXISTS viewings_status_check;
ALTER TABLE public.viewings ADD CONSTRAINT viewings_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'rescheduled', 'completed', 'declined'));

-- ---------------------------------------------------------------------------
-- 3. RLS rewrite on viewing_slots — the core audience fix
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "viewing_slots_select" ON public.viewing_slots;
DROP POLICY IF EXISTS "viewing_slots_insert" ON public.viewing_slots;
DROP POLICY IF EXISTS "viewing_slots_update" ON public.viewing_slots;

-- Anyone (incl. anon) may read AVAILABLE slots; hosts see all their slots and
-- the booker keeps sight of the slot they claimed.
CREATE POLICY "viewing_slots_select_public" ON public.viewing_slots
  FOR SELECT TO anon, authenticated
  USING (
    status = 'available'
    OR auth.uid() = agent_id
    OR auth.uid() = booked_by
  );

-- A host may publish slots only against a listing they own.
CREATE POLICY "viewing_slots_host_insert" ON public.viewing_slots
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = agent_id
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "viewing_slots_host_update" ON public.viewing_slots
  FOR UPDATE TO authenticated
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

-- A host may delete only an unbooked slot.
CREATE POLICY "viewing_slots_host_delete" ON public.viewing_slots
  FOR DELETE TO authenticated
  USING (auth.uid() = agent_id AND status = 'available');

-- ---------------------------------------------------------------------------
-- 4. platform_events: allow the 'viewing' entity type for request responses
-- ---------------------------------------------------------------------------
ALTER TABLE public.platform_events DROP CONSTRAINT IF EXISTS platform_events_entity_type_check;
ALTER TABLE public.platform_events ADD CONSTRAINT platform_events_entity_type_check
  CHECK (entity_type IN ('conversation', 'booking', 'listing', 'rfq', 'transaction', 'viewing'));

-- ---------------------------------------------------------------------------
-- 5. Unblock feedback on unified slots. agent_viewing_feedback historically FK'd
--    agent_viewing_slots; host availability now lives in viewing_slots, so a new
--    slot would violate that FK. Drop it (column kept for historical rows).
-- ---------------------------------------------------------------------------
ALTER TABLE public.agent_viewing_feedback
  DROP CONSTRAINT IF EXISTS agent_viewing_feedback_viewing_slot_id_fkey;

-- ---------------------------------------------------------------------------
-- 6. claim_viewing_slot — matches the DEPLOYED book-viewing route contract:
--    rpc("claim_viewing_slot", { p_slot_id, p_user_id }). Returns jsonb; the
--    route reads result.error === 'slot_taken' (409) and result.success (200).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_viewing_slot(p_slot_id uuid, p_user_id uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_slot    public.viewing_slots;
  v_viewing public.viewings;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT * INTO v_slot
  FROM public.viewing_slots
  WHERE id = p_slot_id AND status = 'available'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'slot_taken');
  END IF;

  UPDATE public.viewing_slots
  SET status = 'booked', booked_by = p_user_id, updated_at = now()
  WHERE id = p_slot_id;

  INSERT INTO public.viewings (user_id, slot_id, listing_id, status, type)
  VALUES (p_user_id, p_slot_id, v_slot.listing_id, 'confirmed', v_slot.type)
  RETURNING * INTO v_viewing;

  -- Notify the host (keyed to the listing so it reaches the owner's bell feed).
  INSERT INTO public.platform_events (event_type, entity_type, entity_id, actor_id, metadata)
  VALUES (
    'viewing_scheduled', 'listing', v_slot.listing_id, p_user_id,
    jsonb_build_object('viewing_id', v_viewing.id, 'slot_id', p_slot_id, 'start_time', v_slot.start_time)
  );

  RETURN jsonb_build_object('success', true, 'slot_id', p_slot_id, 'viewing_id', v_viewing.id);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_viewing_slot(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_viewing_slot(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_viewing_slot(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. request_viewing — fallback when a property has no published slots.
--    Inserts a slot-less pending viewing and notifies the host.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_viewing(
  p_listing_id uuid,
  p_user_id uuid,
  p_preferred_time timestamptz,
  p_notes text DEFAULT NULL
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_listing public.listings;
  v_viewing public.viewings;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'listing_not_found');
  END IF;

  IF v_listing.user_id = p_user_id THEN
    RETURN jsonb_build_object('error', 'own_listing');
  END IF;

  -- One open request/booking per user per listing.
  IF EXISTS (
    SELECT 1 FROM public.viewings
    WHERE listing_id = p_listing_id
      AND user_id = p_user_id
      AND status IN ('pending', 'confirmed', 'rescheduled')
  ) THEN
    RETURN jsonb_build_object('error', 'already_requested');
  END IF;

  INSERT INTO public.viewings (user_id, slot_id, listing_id, status, type, notes, preferred_time)
  VALUES (p_user_id, NULL, p_listing_id, 'pending', 'in_person', p_notes, p_preferred_time)
  RETURNING * INTO v_viewing;

  INSERT INTO public.platform_events (event_type, entity_type, entity_id, actor_id, metadata)
  VALUES (
    'viewing_requested', 'listing', p_listing_id, p_user_id,
    jsonb_build_object('viewing_id', v_viewing.id, 'preferred_time', p_preferred_time)
  );

  RETURN jsonb_build_object('success', true, 'viewing_id', v_viewing.id);
END;
$$;

REVOKE ALL ON FUNCTION public.request_viewing(uuid, uuid, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_viewing(uuid, uuid, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.request_viewing(uuid, uuid, timestamptz, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. respond_viewing_request — host confirms or declines a pending request.
--    Optional atomic slot attach on confirm. Notifies the requester.
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

  -- Only the listing owner may respond.
  IF NOT EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = v_viewing.listing_id AND l.user_id = auth.uid()
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
-- 9. Keep cancel/reschedule coherent with the new booked_by column so the
--    SELECT policy never leaks a freed slot to a stale booker.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_viewing(p_viewing_id uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_viewing public.viewings;
BEGIN
  SELECT * INTO v_viewing
  FROM public.viewings
  WHERE id = p_viewing_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
  END IF;

  UPDATE public.viewings
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_viewing_id;

  UPDATE public.viewing_slots
  SET status = 'available', booked_by = NULL, updated_at = now()
  WHERE id = v_viewing.slot_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.reschedule_viewing(p_viewing_id uuid, p_new_slot_id uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_viewing  public.viewings;
  v_new_slot public.viewing_slots;
BEGIN
  SELECT * INTO v_viewing
  FROM public.viewings
  WHERE id = p_viewing_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
  END IF;

  SELECT * INTO v_new_slot
  FROM public.viewing_slots
  WHERE id = p_new_slot_id
  FOR UPDATE;

  IF v_new_slot.status <> 'available' THEN
    RETURN jsonb_build_object('success', false, 'error', 'SLOT_UNAVAILABLE');
  END IF;

  UPDATE public.viewing_slots
  SET status = 'available', booked_by = NULL, updated_at = now()
  WHERE id = v_viewing.slot_id;

  UPDATE public.viewing_slots
  SET status = 'booked', booked_by = v_viewing.user_id, updated_at = now()
  WHERE id = p_new_slot_id;

  UPDATE public.viewings
  SET status = 'rescheduled', slot_id = p_new_slot_id, updated_at = now()
  WHERE id = p_viewing_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
