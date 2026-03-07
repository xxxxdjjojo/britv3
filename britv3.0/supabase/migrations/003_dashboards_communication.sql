-- ============================================================================
-- Phase 3: Dashboards & Communication Migration
-- ============================================================================
-- Creates tables for messaging, notifications, milestones, market pricing,
-- and activity logging. All tables have RLS enabled.
--
-- Tables created:
--   1. conversations        (COM-01: contextual messaging)
--   2. messages              (COM-03: message threads)
--   3. conversation_read_status (COM-05: per-conversation read tracking)
--   4. platform_events       (COM-10: event-based notification feed)
--   5. market_pricing        (COM-09: market intelligence data)
--   6. transaction_milestones (COM-14: 8-step UK property pipeline)
--   7. service_job_milestones (COM-15: 5-step service job pipeline)
--   8. activity_log          (DASH-12: partitioned activity log)
--
-- Also alters profiles table to add notification preferences.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. conversations -- contextual messaging between two users
-- Serves COM-01: Contextual messaging from listings, bookings, RFQs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN ('listing', 'booking', 'rfq', 'general')),
  context_id UUID,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent self-conversations
  CONSTRAINT no_self_conversation CHECK (participant_1_id <> participant_2_id)
);

COMMENT ON TABLE public.conversations IS 'Direct message conversations between two users, optionally linked to a listing/booking/RFQ';

-- Index for fetching user's conversations sorted by recency
CREATE INDEX idx_conversations_participant_1 ON public.conversations (participant_1_id, last_message_at DESC);
CREATE INDEX idx_conversations_participant_2 ON public.conversations (participant_2_id, last_message_at DESC);

-- ---------------------------------------------------------------------------
-- 2. messages -- individual messages within conversations
-- Serves COM-03: Message thread with cursor-based pagination
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 5000),
  attachment_url TEXT,
  attachment_type TEXT CHECK (attachment_type IS NULL OR attachment_type IN ('image', 'pdf')),
  attachment_size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.messages IS 'Individual messages in a conversation, supports text + single attachment per message';

-- Primary query pattern: messages in a conversation, newest first (cursor pagination)
CREATE INDEX idx_messages_conversation_created ON public.messages (conversation_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. conversation_read_status -- tracks when each user last read a conversation
-- Serves COM-05: Per-conversation "last read" timestamp
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_read_status (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (conversation_id, user_id)
);

COMMENT ON TABLE public.conversation_read_status IS 'Tracks when each participant last read a conversation for unread count calculation';

-- ---------------------------------------------------------------------------
-- 4. platform_events -- event-based notification system
-- Serves COM-10: Event-based in-app notification feed
-- Uses O(1) writes per action (not per-recipient fan-out)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('conversation', 'booking', 'listing', 'rfq', 'transaction')),
  entity_id UUID NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.platform_events IS 'Event log for in-app notifications -- O(1) writes, filtered reads by entity ownership';

-- Query pattern: events for a specific entity, newest first
CREATE INDEX idx_platform_events_entity ON public.platform_events (entity_id, created_at DESC);

-- Query pattern: events by actor for activity feeds
CREATE INDEX idx_platform_events_actor ON public.platform_events (actor_id, created_at DESC);

-- Partial index for cleanup: events older than 90 days
CREATE INDEX idx_platform_events_cleanup ON public.platform_events (created_at)
  WHERE created_at < NOW() - INTERVAL '90 days';

-- ---------------------------------------------------------------------------
-- 5. market_pricing -- market intelligence for AI quote drafting
-- Serves COM-09: Market pricing intelligence data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.market_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category TEXT NOT NULL,
  region TEXT NOT NULL,
  price_low NUMERIC(10,2) NOT NULL,
  price_median NUMERIC(10,2) NOT NULL,
  price_high NUMERIC(10,2) NOT NULL,
  sample_size INTEGER NOT NULL DEFAULT 0,
  data_source TEXT NOT NULL CHECK (data_source IN ('seed', 'platform', 'blended')),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (service_category, region)
);

COMMENT ON TABLE public.market_pricing IS 'Regional market pricing data for service categories, used by AI quote drafting';

-- ---------------------------------------------------------------------------
-- 6. transaction_milestones -- 8-step UK property transaction pipeline
-- Serves COM-14: Transaction milestones tracking
-- No FK to transactions table yet (created in Phase 6)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transaction_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  milestone_key TEXT NOT NULL CHECK (milestone_key IN (
    'offer_accepted', 'mortgage_submitted', 'survey_instructed',
    'survey_completed', 'conveyancing_started', 'searches_completed',
    'contracts_exchanged', 'completion'
  )),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  completed_date DATE,

  UNIQUE (transaction_id, milestone_key)
);

COMMENT ON TABLE public.transaction_milestones IS '8-step UK property transaction pipeline. transaction_id FK deferred to Phase 6';

CREATE INDEX idx_transaction_milestones_txn ON public.transaction_milestones (transaction_id);

-- ---------------------------------------------------------------------------
-- 7. service_job_milestones -- 5-step service job lifecycle
-- Serves COM-15: Service job milestones tracking
-- No FK to bookings table yet (created in Phase 4)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_job_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  milestone_key TEXT NOT NULL CHECK (milestone_key IN (
    'quote_accepted', 'job_scheduled', 'work_started',
    'work_completed', 'payment_received'
  )),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,

  UNIQUE (booking_id, milestone_key)
);

COMMENT ON TABLE public.service_job_milestones IS '5-step service job lifecycle. booking_id FK deferred (bookings table in Phase 4)';

CREATE INDEX idx_service_job_milestones_booking ON public.service_job_milestones (booking_id);

-- ---------------------------------------------------------------------------
-- 8. activity_log -- partitioned by created_at for efficient pruning
-- Serves DASH-12: Activity log with cursor-based pagination
-- Uses native PostgreSQL range partitioning (not pg_partman)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_log (
  id BIGSERIAL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

COMMENT ON TABLE public.activity_log IS 'User activity feed, partitioned monthly for efficient pruning and cursor pagination';

-- Create partitions for the next 12 months (2026-03 through 2027-02)
CREATE TABLE public.activity_log_2026_03 PARTITION OF public.activity_log
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE public.activity_log_2026_04 PARTITION OF public.activity_log
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE public.activity_log_2026_05 PARTITION OF public.activity_log
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE public.activity_log_2026_06 PARTITION OF public.activity_log
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE public.activity_log_2026_07 PARTITION OF public.activity_log
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE public.activity_log_2026_08 PARTITION OF public.activity_log
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE public.activity_log_2026_09 PARTITION OF public.activity_log
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE public.activity_log_2026_10 PARTITION OF public.activity_log
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE public.activity_log_2026_11 PARTITION OF public.activity_log
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE public.activity_log_2026_12 PARTITION OF public.activity_log
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE public.activity_log_2027_01 PARTITION OF public.activity_log
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE public.activity_log_2027_02 PARTITION OF public.activity_log
  FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');

-- Index for cursor-based pagination: user's activity sorted by time
CREATE INDEX idx_activity_log_user_created ON public.activity_log (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 9. Alter profiles table -- add notification preferences columns
-- Serves DASH-13: Notification preferences per user
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notifications_read_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.preferences IS 'User notification preferences (per-type channels, quiet hours, digest frequency)';
COMMENT ON COLUMN public.profiles.notifications_read_at IS 'Timestamp of when user last viewed notifications -- for unread badge';


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- -- conversations RLS -------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_select ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY conversations_insert ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

-- -- messages RLS ------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    )
  );

CREATE POLICY messages_insert ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    )
  );

-- -- conversation_read_status RLS --------------------------------------------
ALTER TABLE public.conversation_read_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_status_all ON public.conversation_read_status
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -- platform_events RLS -----------------------------------------------------
ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;

-- Users can see events they triggered
CREATE POLICY events_select_actor ON public.platform_events
  FOR SELECT USING (actor_id = auth.uid());

-- Users can see events on entities they participate in (conversations they're in)
CREATE POLICY events_select_entity ON public.platform_events
  FOR SELECT USING (
    entity_type = 'conversation' AND entity_id IN (
      SELECT id FROM public.conversations
      WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    )
  );

CREATE POLICY events_insert ON public.platform_events
  FOR INSERT WITH CHECK (actor_id = auth.uid());

-- -- market_pricing RLS ------------------------------------------------------
ALTER TABLE public.market_pricing ENABLE ROW LEVEL SECURITY;

-- All authenticated and anonymous users can read market pricing (public data)
CREATE POLICY market_pricing_select ON public.market_pricing
  FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE for regular users -- admin only via service role

-- -- transaction_milestones RLS ----------------------------------------------
ALTER TABLE public.transaction_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY txn_milestones_select ON public.transaction_milestones
  FOR SELECT USING (updated_by = auth.uid());

CREATE POLICY txn_milestones_update ON public.transaction_milestones
  FOR UPDATE USING (updated_by = auth.uid())
  WITH CHECK (updated_by = auth.uid());

-- -- service_job_milestones RLS ----------------------------------------------
ALTER TABLE public.service_job_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_milestones_select ON public.service_job_milestones
  FOR SELECT USING (updated_by = auth.uid());

CREATE POLICY job_milestones_update ON public.service_job_milestones
  FOR UPDATE USING (updated_by = auth.uid())
  WITH CHECK (updated_by = auth.uid());

-- -- activity_log RLS --------------------------------------------------------
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_log_select ON public.activity_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY activity_log_insert ON public.activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid());
