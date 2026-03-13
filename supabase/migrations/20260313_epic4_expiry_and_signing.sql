-- =============================================================================
-- Epic 4 Hardening: pg_cron expiry jobs + quote signing column
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Function: expire stale RFQs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION expire_stale_rfqs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.service_requests
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    status IN ('open', 'quotes_received')
    AND expires_at < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- Function: expire stale quotes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION expire_stale_quotes()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.quotes
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    status IN ('sent', 'viewed')
    AND valid_until < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- Schedule expiry jobs via pg_cron
-- ---------------------------------------------------------------------------
SELECT cron.schedule(
  'expire-stale-rfqs',
  '0 1 * * *',
  'SELECT expire_stale_rfqs()'
);

SELECT cron.schedule(
  'expire-stale-quotes',
  '30 * * * *',
  'SELECT expire_stale_quotes()'
);

-- ---------------------------------------------------------------------------
-- Quote signature column
-- ---------------------------------------------------------------------------
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS quote_signature TEXT;

COMMENT ON COLUMN public.quotes.quote_signature IS
  'HMAC-SHA256 of (service_request_id||provider_id||total_amount||scope_of_work||line_items) '
  'computed server-side at quote submission time. Null for draft quotes.';
