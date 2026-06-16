-- Schedule weekly digest edge function every Monday at 08:00 UTC
-- Requires pg_cron and net extensions enabled in Supabase

-- Check if the cron job already exists; delete if it does to avoid duplication
SELECT cron.unschedule('weekly-digest-monday') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'weekly-digest-monday'
);

-- Schedule the job: Every Monday at 08:00 UTC
SELECT cron.schedule(
  'weekly-digest-monday',
  '0 8 * * 1',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/weekly-digest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
