-- ============================================================================
-- Phase 18: Payments & Billing tables
-- Creates: subscriptions, billing_events, refund_requests
-- All tables have RLS enabled from day one.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. subscriptions
--    Supabase-side cache of Stripe subscription state.
--    Written exclusively by the webhook handler (service_role).
--    Read by authenticated users scoped to their own record.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT       UNIQUE,
  stripe_customer_id    TEXT,
  status                TEXT        NOT NULL DEFAULT 'inactive',
  -- statuses: inactive | active | trialing | past_due | canceled | unpaid
  plan_name             TEXT,
  price_amount          INTEGER,    -- pence
  currency              TEXT        NOT NULL DEFAULT 'gbp',
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN     NOT NULL DEFAULT FALSE,
  role                  TEXT,       -- which role this subscription is for (agent|landlord|provider)
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Only service_role can write (webhook uses SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "subscriptions_service_role_all" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 2. billing_events
--    Append-only audit log of every Stripe webhook event processed.
--    stripe_event_id UNIQUE constraint provides idempotency.
--    No user RLS — admin / service_role only.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id  TEXT        UNIQUE NOT NULL, -- idempotency key
  event_type       TEXT        NOT NULL,
  user_id          UUID        REFERENCES auth.users(id),
  payload          JSONB,
  processed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_events_stripe_event_id_idx ON public.billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS billing_events_user_id_idx ON public.billing_events(user_id);
CREATE INDEX IF NOT EXISTS billing_events_event_type_idx ON public.billing_events(event_type);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- No user-facing RLS — service_role / admin only
CREATE POLICY "billing_events_service_role_all" ON public.billing_events
  FOR ALL USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 3. refund_requests
--    User-submitted refund requests. Users can create and read their own.
--    Admin processes them; status updated via service_role.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id   TEXT,
  stripe_charge_id           TEXT,
  amount                     INTEGER,    -- pence requested for refund
  reason                     TEXT        NOT NULL,
  status                     TEXT        NOT NULL DEFAULT 'pending',
  -- statuses: pending | under_review | approved | rejected | processed
  admin_notes                TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refund_requests_user_id_idx ON public.refund_requests(user_id);
CREATE INDEX IF NOT EXISTS refund_requests_status_idx ON public.refund_requests(status);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "refund_requests_select_own" ON public.refund_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "refund_requests_insert_own" ON public.refund_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin / service_role can update (process refund requests)
CREATE POLICY "refund_requests_service_role_all" ON public.refund_requests
  FOR ALL USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
