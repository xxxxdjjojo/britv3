-- =============================================================================
-- v3.1 Buyer Dashboard Foundation
-- Migration: 20260313100000_v3_1_buyer_dashboard_foundation.sql
-- Creates 10 new tables, RLS policies, RPCs, indexes, and the buyer-documents
-- private storage bucket. All objects in one atomic migration — if any step
-- fails the entire migration rolls back.
-- =============================================================================

-- =============================================================================
-- Section 1: Storage bucket (private buyer-documents)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'buyer-documents',
  'buyer-documents',
  false,
  52428800, -- 50 MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload to their own path
CREATE POLICY "buyer_documents_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'buyer-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: users can only read their own documents
CREATE POLICY "buyer_documents_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'buyer-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: users can delete their own documents
CREATE POLICY "buyer_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'buyer-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================================
-- Section 2: 10 new tables (in FK-dependency order)
-- =============================================================================

-- 1. viewing_slots — created by agents, booked by buyers
CREATE TABLE public.viewing_slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL,
  agent_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time  timestamptz NOT NULL,
  end_time    timestamptz NOT NULL,
  type        text NOT NULL CHECK (type IN ('in_person', 'virtual')),
  status      text NOT NULL DEFAULT 'available'
                CHECK (status IN ('available', 'booked', 'cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.viewing_slots ENABLE ROW LEVEL SECURITY;

-- 2. viewings — buyer's booked viewing (references viewing_slots)
CREATE TABLE public.viewings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_id     uuid NOT NULL REFERENCES public.viewing_slots(id),
  listing_id  uuid NOT NULL,
  status      text NOT NULL DEFAULT 'confirmed'
                CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'completed')),
  type        text NOT NULL CHECK (type IN ('in_person', 'virtual')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.viewings ENABLE ROW LEVEL SECURITY;

-- 3. offers — buyer's offer on a listing
CREATE TABLE public.offers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id          uuid NOT NULL,
  agent_id            uuid NOT NULL REFERENCES auth.users(id),
  amount              integer NOT NULL CHECK (amount > 0), -- stored in pence
  conditions          text,
  solicitor_name      text,
  solicitor_email     text,
  solicitor_phone     text,
  solicitor_id        uuid REFERENCES auth.users(id),
  aip_document_path   text,
  status              text NOT NULL DEFAULT 'submitted'
                        CHECK (status IN (
                          'submitted', 'solicitors_instructed', 'searches',
                          'survey', 'mortgage_approved', 'exchange',
                          'completion', 'withdrawn'
                        )),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 4. offer_status_history — immutable audit trail for offer state machine
-- No updated_at — append-only log
CREATE TABLE public.offer_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id    uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  changed_by  uuid REFERENCES auth.users(id),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offer_status_history ENABLE ROW LEVEL SECURITY;

-- 5. user_documents — buyer's uploaded identity/funds/AIP documents
CREATE TABLE public.user_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id        uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  document_type   text NOT NULL CHECK (document_type IN (
                    'id_proof', 'proof_of_funds', 'aip_letter', 'other'
                  )),
  storage_path    text NOT NULL,
  file_name       text NOT NULL,
  file_size_bytes integer NOT NULL CHECK (file_size_bytes > 0),
  mime_type       text NOT NULL,
  status          text NOT NULL DEFAULT 'uploaded'
                    CHECK (status IN ('uploaded', 'pending_review', 'verified', 'rejected')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- 6. ai_match_preferences — buyer's AI match criteria (one row per user, UNIQUE on user_id)
CREATE TABLE public.ai_match_preferences (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  location            text,
  budget_min          integer,
  budget_max          integer,
  bedrooms_min        integer,
  bedrooms_max        integer,
  must_haves          text[],
  lifestyle_factors   jsonb DEFAULT '{}',
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_match_preferences ENABLE ROW LEVEL SECURITY;

-- 7. ai_match_results — cached AI match scores, expire after 24 hours
CREATE TABLE public.ai_match_results (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id      uuid NOT NULL,
  match_score     numeric(4,3) NOT NULL CHECK (match_score BETWEEN 0 AND 1),
  match_reasons   jsonb DEFAULT '[]',
  computed_at     timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
ALTER TABLE public.ai_match_results ENABLE ROW LEVEL SECURITY;

-- 8. moving_checklist_items — per-user per-offer checklist items
CREATE TABLE public.moving_checklist_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id        uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  offer_stage     text, -- the offer status stage this item relates to
  is_completed    boolean NOT NULL DEFAULT false,
  completed_at    timestamptz,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.moving_checklist_items ENABLE ROW LEVEL SECURITY;

-- 9. referral_codes — one permanent code per user (UNIQUE on user_id AND code)
CREATE TABLE public.referral_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code        text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- 10. referral_conversions — tracks who signed up via which code
CREATE TABLE public.referral_conversions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code_used       text NOT NULL,
  converted_at    timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'converted'))
);
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Section 3: RLS policies
-- =============================================================================

-- ---- viewing_slots ----------------------------------------------------------

CREATE POLICY "viewing_slots_select" ON public.viewing_slots
  FOR SELECT TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "viewing_slots_insert" ON public.viewing_slots
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "viewing_slots_update" ON public.viewing_slots
  FOR UPDATE TO authenticated
  USING (auth.uid() = agent_id);

-- ---- viewings ---------------------------------------------------------------
-- Buyer sees their own bookings; listing owner sees viewings on their listing.
-- INSERT and UPDATE go through the book_viewing_slot SECURITY DEFINER RPC only.

CREATE POLICY "viewings_select" ON public.viewings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT user_id FROM public.listings WHERE id = listing_id
    )
  );

-- ---- offers -----------------------------------------------------------------
-- Buyer can submit their own offer; UPDATE blocked entirely (API route only).

CREATE POLICY "offers_select" ON public.offers
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT user_id FROM public.listings WHERE id = listing_id
    )
  );

CREATE POLICY "offers_insert" ON public.offers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "offers_update_blocked" ON public.offers
  FOR UPDATE TO authenticated
  USING (false);

-- ---- offer_status_history ---------------------------------------------------
-- No INSERT policy — service role bypasses RLS; client INSERT is blocked by default-deny.
-- Both buyer and listing owner can SELECT their relevant rows.

CREATE POLICY "offer_status_history_select_buyer" ON public.offer_status_history
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.offers WHERE id = offer_id
    )
  );

CREATE POLICY "offer_status_history_select_agent" ON public.offer_status_history
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.listings
      WHERE id = (SELECT listing_id FROM public.offers WHERE id = offer_id)
    )
  );

-- ---- user_documents ---------------------------------------------------------
-- Buyer can CRUD their own documents.
-- Buyer + instructed solicitor/agent (via offers table) can SELECT.

CREATE POLICY "user_documents_select" ON public.user_documents
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT agent_id FROM public.offers WHERE id = offer_id AND agent_id IS NOT NULL
    )
    OR auth.uid() IN (
      SELECT solicitor_id FROM public.offers WHERE id = offer_id AND solicitor_id IS NOT NULL
    )
  );

CREATE POLICY "user_documents_insert" ON public.user_documents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_documents_update" ON public.user_documents
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_documents_delete" ON public.user_documents
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---- ai_match_preferences ---------------------------------------------------

CREATE POLICY "ai_match_preferences_select" ON public.ai_match_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ai_match_preferences_insert" ON public.ai_match_preferences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_match_preferences_update" ON public.ai_match_preferences
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ai_match_preferences_delete" ON public.ai_match_preferences
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---- ai_match_results -------------------------------------------------------

CREATE POLICY "ai_match_results_select" ON public.ai_match_results
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ai_match_results_insert" ON public.ai_match_results
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_match_results_update" ON public.ai_match_results
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ai_match_results_delete" ON public.ai_match_results
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---- moving_checklist_items -------------------------------------------------

CREATE POLICY "moving_checklist_items_select" ON public.moving_checklist_items
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "moving_checklist_items_insert" ON public.moving_checklist_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "moving_checklist_items_update" ON public.moving_checklist_items
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "moving_checklist_items_delete" ON public.moving_checklist_items
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---- referral_codes ---------------------------------------------------------
-- Codes are permanent — no UPDATE or DELETE policies.

CREATE POLICY "referral_codes_select" ON public.referral_codes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "referral_codes_insert" ON public.referral_codes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ---- referral_conversions ---------------------------------------------------
-- INSERT via service role only (no client INSERT policy).

CREATE POLICY "referral_conversions_select" ON public.referral_conversions
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- =============================================================================
-- Section 4: Indexes
-- =============================================================================

-- Viewings
CREATE INDEX idx_viewings_user_id ON public.viewings (user_id);
CREATE INDEX idx_viewings_listing_id ON public.viewings (listing_id);
CREATE INDEX idx_viewings_slot_id ON public.viewings (slot_id);

-- Viewing slots
CREATE INDEX idx_viewing_slots_listing_id ON public.viewing_slots (listing_id);
CREATE INDEX idx_viewing_slots_agent_id ON public.viewing_slots (agent_id);
CREATE INDEX idx_viewing_slots_start_time ON public.viewing_slots (start_time);

-- Offers
CREATE INDEX idx_offers_user_id ON public.offers (user_id);
CREATE INDEX idx_offers_listing_id ON public.offers (listing_id);
CREATE INDEX idx_offers_status ON public.offers (status);

-- Offer status history
CREATE INDEX idx_offer_status_history_offer_id ON public.offer_status_history (offer_id);

-- User documents
CREATE INDEX idx_user_documents_user_id ON public.user_documents (user_id);
CREATE INDEX idx_user_documents_offer_id ON public.user_documents (offer_id);

-- AI match results (expiry-aware queries)
CREATE INDEX idx_ai_match_results_user_id ON public.ai_match_results (user_id);
CREATE INDEX idx_ai_match_results_expires_at ON public.ai_match_results (expires_at);

-- Moving checklist
CREATE INDEX idx_moving_checklist_items_user_id ON public.moving_checklist_items (user_id);
CREATE INDEX idx_moving_checklist_items_offer_id ON public.moving_checklist_items (offer_id);

-- Referral
CREATE INDEX idx_referral_conversions_referrer_id ON public.referral_conversions (referrer_id);

-- =============================================================================
-- Section 5: RPCs (SECURITY DEFINER functions)
-- =============================================================================

-- book_viewing_slot: atomically locks a slot and inserts a viewing record
CREATE OR REPLACE FUNCTION public.book_viewing_slot(
  p_slot_id    uuid,
  p_user_id    uuid,
  p_listing_id uuid,
  p_type       text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot    public.viewing_slots;
  v_viewing public.viewings;
BEGIN
  -- Security check: caller must be the user they claim to be
  IF p_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  -- Lock the slot row for the duration of this transaction
  SELECT * INTO v_slot
  FROM public.viewing_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  -- Check availability
  IF v_slot.status <> 'available' THEN
    RETURN jsonb_build_object('success', false, 'error', 'SLOT_UNAVAILABLE');
  END IF;

  -- Mark slot as booked
  UPDATE public.viewing_slots
  SET status = 'booked', updated_at = now()
  WHERE id = p_slot_id;

  -- Create the viewing record
  INSERT INTO public.viewings (user_id, slot_id, listing_id, type)
  VALUES (p_user_id, p_slot_id, p_listing_id, p_type)
  RETURNING * INTO v_viewing;

  RETURN jsonb_build_object('success', true, 'viewing_id', v_viewing.id);
END;
$$;

-- cancel_viewing: frees the slot and cancels the viewing atomically
CREATE OR REPLACE FUNCTION public.cancel_viewing(
  p_viewing_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_viewing public.viewings;
BEGIN
  -- Lock and fetch the viewing, ensuring ownership
  SELECT * INTO v_viewing
  FROM public.viewings
  WHERE id = p_viewing_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
  END IF;

  -- Update viewing status
  UPDATE public.viewings
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_viewing_id;

  -- Free the slot
  UPDATE public.viewing_slots
  SET status = 'available', updated_at = now()
  WHERE id = v_viewing.slot_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- reschedule_viewing: books new slot and frees old slot atomically
CREATE OR REPLACE FUNCTION public.reschedule_viewing(
  p_viewing_id  uuid,
  p_new_slot_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_viewing  public.viewings;
  v_new_slot public.viewing_slots;
BEGIN
  -- Lock and fetch the viewing, ensuring ownership
  SELECT * INTO v_viewing
  FROM public.viewings
  WHERE id = p_viewing_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
  END IF;

  -- Lock the new slot
  SELECT * INTO v_new_slot
  FROM public.viewing_slots
  WHERE id = p_new_slot_id
  FOR UPDATE;

  -- Check new slot availability
  IF v_new_slot.status <> 'available' THEN
    RETURN jsonb_build_object('success', false, 'error', 'SLOT_UNAVAILABLE');
  END IF;

  -- Free the old slot
  UPDATE public.viewing_slots
  SET status = 'available', updated_at = now()
  WHERE id = v_viewing.slot_id;

  -- Book the new slot
  UPDATE public.viewing_slots
  SET status = 'booked', updated_at = now()
  WHERE id = p_new_slot_id;

  -- Update the viewing record
  UPDATE public.viewings
  SET status = 'rescheduled', slot_id = p_new_slot_id, updated_at = now()
  WHERE id = p_viewing_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
