-- New columns on provider_references for token tracking and reminders
ALTER TABLE provider_references
  ADD COLUMN IF NOT EXISTS submission_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Server-side trust score for marketplace filtering
ALTER TABLE service_provider_details
  ADD COLUMN IF NOT EXISTS trust_score INTEGER NOT NULL DEFAULT 0;

-- Index for auto-reminder cron query
CREATE INDEX IF NOT EXISTS idx_provider_references_pending_reminders
  ON provider_references (status, cancelled_at, last_reminded_at)
  WHERE status = 'pending' AND cancelled_at IS NULL;
