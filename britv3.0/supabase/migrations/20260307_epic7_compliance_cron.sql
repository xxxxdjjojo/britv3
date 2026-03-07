-- =============================================================================
-- Epic 7: Compliance Reminder Cron Schedule
-- Runs daily at 9 AM UTC to check for expiring compliance documents
-- and trigger the compliance-reminders Edge Function.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily compliance reminder check at 9 AM UTC
-- This calls the compliance-reminders Edge Function via HTTP POST.
--
-- NOTE: The URL and Authorization header use Supabase config values.
-- If current_setting('app.settings.supabase_url') is not available in your
-- environment, replace with your project's actual URL:
--   url := 'https://<project-ref>.supabase.co/functions/v1/compliance-reminders'
-- For the service role key, you can also use Vault secrets:
--   current_setting('app.settings.service_role_key')
-- or reference it from supabase_functions.get_secret('service_role_key').
SELECT cron.schedule(
  'compliance-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/compliance-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
