-- ===========================================================================
-- Direct-to-trader quote requests: make target_provider_id ENFORCED and
-- support guest (logged-out) submissions.
--
-- 1. Guest contact columns + nullable user_id (guests have no account).
-- 2. RLS: a targeted RFQ is visible ONLY to its target provider; broadcast
--    RFQs (target_provider_id IS NULL) keep existing visibility.
-- 3. FK + index for target_provider_id (added bare in 20260630210216).
-- ===========================================================================

-- 1. Guest support -----------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

ALTER TABLE public.service_requests
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_owner_or_guest_check;
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_owner_or_guest_check
  CHECK (user_id IS NOT NULL OR contact_email IS NOT NULL);

COMMENT ON COLUMN public.service_requests.contact_email IS
  'Guest submissions only (user_id IS NULL): where quotes are emailed.';

-- 2. Targeting integrity -----------------------------------------------------
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_target_provider_fk;
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_target_provider_fk
  FOREIGN KEY (target_provider_id)
  REFERENCES public.service_provider_details(user_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS service_requests_target_provider_idx
  ON public.service_requests (target_provider_id)
  WHERE target_provider_id IS NOT NULL;

-- 3. RLS: targeted RFQs visible only to their target provider ----------------
-- Original policy body (002_marketplace.sql) reproduced exactly, with the
-- target_provider_id conjunct added. Guest rows (user_id IS NULL) are inserted
-- via service-role only — deliberately no anon INSERT policy.
DROP POLICY IF EXISTS "Verified providers can view open RFQs"
  ON public.service_requests;
CREATE POLICY "Verified providers can view open RFQs"
  ON public.service_requests FOR SELECT
  TO authenticated
  USING (
    status = 'open'
    AND (target_provider_id IS NULL OR target_provider_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND provider_verification_status = 'verified'
    )
  );
