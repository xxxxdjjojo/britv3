-- Compliance cron audit log table
-- Records each run of the compliance-reminders Edge Function
CREATE TABLE IF NOT EXISTS compliance_cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  properties_checked INTEGER NOT NULL DEFAULT 0,
  emails_queued INTEGER NOT NULL DEFAULT 0,
  emails_skipped_already_sent INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  error_details JSONB
);

-- RLS: admins can read, service_role can write
ALTER TABLE compliance_cron_runs ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so no INSERT policy needed.
-- Admin read policy: uses is_admin flag on profiles table.
DROP POLICY IF EXISTS "Admins can read cron audit logs" ON compliance_cron_runs;
CREATE POLICY "Admins can read cron audit logs"
  ON compliance_cron_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );
