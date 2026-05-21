-- ============================================================================
-- Phase A remediation: billing idempotency and offer withdrawal safety
-- ============================================================================

-- billing_events.processed_at must represent successful completion, not insert
-- time. Existing rows were historically inserted after successful processing, so
-- keep their value and only change future semantics.
ALTER TABLE public.billing_events
  ALTER COLUMN processed_at DROP DEFAULT,
  ALTER COLUMN processed_at DROP NOT NULL;

ALTER TABLE public.billing_events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'processed', 'failed')),
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

CREATE INDEX IF NOT EXISTS billing_events_status_idx
  ON public.billing_events(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscriptions_user_id_unique'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS referral_rewards_unique_recipient_reward_idx
  ON public.referral_rewards(referral_id, recipient_id, reward_type);

CREATE OR REPLACE FUNCTION public.claim_billing_event(
  p_stripe_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(status TEXT, should_process BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    INSERT INTO public.billing_events (
      stripe_event_id,
      event_type,
      payload,
      processed_at,
      status,
      attempt_count,
      last_attempt_at
    )
    VALUES (
      p_stripe_event_id,
      p_event_type,
      COALESCE(p_payload, '{}'::jsonb),
      NULL,
      'processing',
      1,
      now()
    )
    ON CONFLICT (stripe_event_id) DO UPDATE
    SET
      attempt_count = public.billing_events.attempt_count + 1,
      last_attempt_at = now(),
      last_error = NULL,
      status = CASE
        WHEN public.billing_events.status = 'processed' THEN 'processed'
        ELSE 'processing'
      END,
      payload = COALESCE(EXCLUDED.payload, public.billing_events.payload)
    RETURNING public.billing_events.status AS event_status
  )
  SELECT claimed.event_status, claimed.event_status <> 'processed'
  FROM claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_billing_event(TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_billing_event(TEXT, TEXT, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_billing_event_processed(
  p_stripe_event_id TEXT,
  p_user_id UUID DEFAULT NULL,
  p_payload JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.billing_events
  SET
    user_id = p_user_id,
    payload = COALESCE(p_payload, payload),
    status = 'processed',
    processed_at = now(),
    last_error = NULL
  WHERE stripe_event_id = p_stripe_event_id;
$$;

REVOKE ALL ON FUNCTION public.mark_billing_event_processed(TEXT, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_billing_event_processed(TEXT, UUID, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_billing_event_failed(
  p_stripe_event_id TEXT,
  p_error TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.billing_events
  SET
    status = 'failed',
    last_error = p_error,
    last_attempt_at = now()
  WHERE stripe_event_id = p_stripe_event_id;
$$;

REVOKE ALL ON FUNCTION public.mark_billing_event_failed(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_billing_event_failed(TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.withdraw_offer(p_offer_id UUID)
RETURNS TABLE(success BOOLEAN, code TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_offer public.offers%ROWTYPE;
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    success := FALSE;
    code := 'UNAUTHORIZED';
    message := 'Unauthorized';
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT *
  INTO current_offer
  FROM public.offers
  WHERE id = p_offer_id
  FOR UPDATE;

  IF NOT FOUND OR current_offer.user_id <> current_user_id THEN
    success := FALSE;
    code := 'NOT_FOUND';
    message := 'Offer not found';
    RETURN NEXT;
    RETURN;
  END IF;

  IF current_offer.status = 'withdrawn' THEN
    success := TRUE;
    code := 'ALREADY_WITHDRAWN';
    message := 'Offer is already withdrawn';
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE public.offers
  SET status = 'withdrawn', updated_at = now()
  WHERE id = p_offer_id;

  INSERT INTO public.offer_status_history (
    offer_id,
    from_status,
    to_status,
    changed_by,
    notes
  )
  VALUES (
    p_offer_id,
    current_offer.status,
    'withdrawn',
    current_user_id,
    'Withdrawn by buyer'
  );

  success := TRUE;
  code := 'WITHDRAWN';
  message := 'Offer withdrawn';
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_offer(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.withdraw_offer(UUID) TO authenticated;
