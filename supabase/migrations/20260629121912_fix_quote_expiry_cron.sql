-- =============================================================================
-- Fix expire_stale_quotes(): use validity_date, not the non-existent valid_until
-- =============================================================================
-- Migration 202603130_epic4_expiry_and_signing.sql created expire_stale_quotes()
-- referencing public.quotes.valid_until, a column that never existed on the
-- real quotes table (002_marketplace.sql uses validity_date). The scheduled
-- pg_cron job 'expire-stale-quotes' therefore errors at run time. This recreates
-- the function with the correct column, preserving all other behaviour. The cron
-- schedule itself is unchanged and is not touched here. Idempotent.

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
    AND validity_date < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
