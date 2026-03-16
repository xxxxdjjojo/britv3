-- ============================================================================
-- Estate Agent Dashboard — Phase 15 Supplements
-- ============================================================================
-- Supplements the base agent dashboard migration (20260313_agent_dashboard.sql)
-- with three additions:
--
--   1. Trigger: auto-insert into agent_lead_activities on stage change
--   2. Table:   agent_feed_sync_log (CRM feed webhook ingestion log)
--   3. Index:   composite index on agent_lead_activities (agent_id, created_at)
--
-- pg_cron setup instructions at the bottom of this file.
-- ============================================================================

-- ============================================================================
-- 1. TRIGGER: Log lead stage changes into agent_lead_activities
-- ============================================================================

CREATE OR REPLACE FUNCTION log_lead_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO agent_lead_activities (lead_id, agent_id, activity_type, old_value, new_value, created_at)
    VALUES (NEW.id, NEW.agent_id, 'stage_changed', OLD.stage, NEW.stage, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_log_lead_stage_change
  AFTER UPDATE ON agent_leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_stage_change();

-- ============================================================================
-- 2. TABLE: agent_feed_sync_log
-- ============================================================================
-- Records every inbound CRM feed webhook payload (Reapit, Alto, Jupix) so
-- that payloads can be processed asynchronously and retried on failure.

CREATE TABLE IF NOT EXISTS agent_feed_sync_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider     TEXT        NOT NULL CHECK (provider IN ('reapit', 'alto', 'jupix')),
  raw_payload  JSONB       NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE agent_feed_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_feed_sync_log_own" ON agent_feed_sync_log
  FOR ALL USING (agent_id = auth.uid());

-- ============================================================================
-- 3. INDEX: Composite index on agent_lead_activities for timeline queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_agent_lead_activities_agent_created
  ON agent_lead_activities (agent_id, created_at DESC);

-- ============================================================================
-- pg_cron setup (run in Supabase SQL editor after enabling pg_cron extension):
-- SELECT cron.schedule('process-feed-sync-log', '*/5 * * * *',
--   $$UPDATE agent_feed_sync_log SET status = 'processed', processed_at = NOW()
--     WHERE status = 'pending' AND received_at < NOW() - INTERVAL '30 seconds'$$);
-- Note: Replace with actual processing logic in production.
-- ============================================================================
