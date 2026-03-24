-- =============================================================================
-- Wave 2: Review Verification Sources
-- Extends the review system to support tenancy and agent transaction reviews
-- in addition to the existing booking-based reviews.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add verification columns to reviews table
-- ---------------------------------------------------------------------------
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS verification_type TEXT DEFAULT 'booking'
    CHECK (verification_type IN ('booking', 'tenancy', 'agent_transaction', 'interaction', 'unverified')),
  ADD COLUMN IF NOT EXISTS verification_source_id UUID,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'unverified')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 2. Make booking_id nullable (reviews via tenancy/agent paths won't have one)
-- ---------------------------------------------------------------------------
ALTER TABLE public.reviews ALTER COLUMN booking_id DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Prevent duplicate reviews per verification interaction
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_verification_unique
  ON public.reviews (verification_type, verification_source_id, reviewer_id)
  WHERE verification_source_id IS NOT NULL AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 4. Auto-verify existing reviews linked to completed bookings
-- ---------------------------------------------------------------------------
UPDATE public.reviews
SET verification_status = 'verified', verified_at = created_at
WHERE booking_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. Update INSERT RLS policy to support all verification sources
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create reviews for own completed bookings" ON reviews;

CREATE POLICY "Users can create verified reviews" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND (
      -- Booking-based reviews (existing flow)
      (verification_type = 'booking' AND EXISTS (
        SELECT 1 FROM bookings
        WHERE id = reviews.booking_id
          AND user_id = auth.uid()
          AND status = 'completed'
      ))
      OR
      -- Tenancy-based reviews (tenant reviews landlord or vice versa)
      (verification_type = 'tenancy' AND EXISTS (
        SELECT 1 FROM tenancies
        WHERE id = reviews.verification_source_id
          AND (tenant_user_id = auth.uid() OR landlord_id = auth.uid())
          AND status IN ('active', 'ended', 'ending_soon')
      ))
      OR
      -- Agent transaction reviews (buyer reviews agent after sale progression)
      -- Note: agent_offers lacks buyer_user_id; uses lead_id -> agent_leads for
      -- user matching. The RLS checks that the user's lead is linked to the offer.
      (verification_type = 'agent_transaction' AND EXISTS (
        SELECT 1 FROM agent_sale_progressions asp
        JOIN agent_offers ao ON ao.id = asp.offer_id
        JOIN agent_leads al ON al.id = ao.lead_id
        JOIN agent_crm_clients acc ON acc.agent_id = ao.agent_id
          AND acc.user_id = auth.uid()
        WHERE asp.id = reviews.verification_source_id
      ))
    )
  );
