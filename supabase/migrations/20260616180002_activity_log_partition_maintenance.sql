-- =============================================================================
-- BRIT-S009 — Auto-maintain activity_log monthly partitions.
--
-- 003_dashboards_communication.sql declares partitions inline only through
-- 2027-02. Past that the inserts fail (or fall into a default partition with
-- degraded performance). This adds an idempotent function that creates any
-- missing monthly partitions from the current month forward; an Inngest cron
-- (push-dispatch sibling) calls it monthly so the window always stays ahead.
--
-- pg_partman / pg_cron are not available without console access, so this is the
-- code-side equivalent. Local DB is broken — apply + verify in STAGING.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.ensure_activity_log_partitions(
  p_months_ahead INTEGER DEFAULT 12
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_month DATE := date_trunc('month', now())::date;
  m DATE;
  next_m DATE;
  part_name TEXT;
  created INTEGER := 0;
BEGIN
  FOR i IN 0..GREATEST(p_months_ahead, 0) LOOP
    m := (start_month + (i || ' months')::interval)::date;
    next_m := (m + INTERVAL '1 month')::date;
    part_name := format('activity_log_%s', to_char(m, 'YYYY_MM'));

    IF to_regclass('public.' || part_name) IS NULL THEN
      EXECUTE format(
        'CREATE TABLE public.%I PARTITION OF public.activity_log FOR VALUES FROM (%L) TO (%L)',
        part_name, m, next_m
      );
      created := created + 1;
    END IF;
  END LOOP;

  RETURN created;
END $$;

REVOKE ALL ON FUNCTION public.ensure_activity_log_partitions(INTEGER) FROM PUBLIC, anon, authenticated;

-- Backfill immediately so the gap from 2027-03 onward is closed on apply.
SELECT public.ensure_activity_log_partitions(12);

COMMIT;
