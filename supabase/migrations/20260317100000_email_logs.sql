CREATE TABLE IF NOT EXISTS email_logs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES profiles(id) ON DELETE SET NULL,
  template           text NOT NULL,
  recipient          text NOT NULL,
  resend_id          text,
  status             text DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'suppressed')),
  suppression_reason text,
  error_message      text,
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_logs_user_read" ON email_logs;
CREATE POLICY "email_logs_user_read" ON email_logs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "email_logs_admin_all" ON email_logs;
CREATE POLICY "email_logs_admin_all" ON email_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "email_logs_service_insert" ON email_logs;
CREATE POLICY "email_logs_service_insert" ON email_logs
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
