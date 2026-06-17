-- Performance indexes (intent originally from the archived
-- 202603190_backend_blueprint_indexes.sql). Created CONCURRENTLY on prod
-- out-of-band; declared here as idempotent IF NOT EXISTS so a fresh
-- `supabase db reset` reproduces them and `db push` is a no-op on prod.
--
-- Corrections vs the original draft (which assumed columns that do not exist
-- on this schema):
--   * price_history uses the real columns (listing_id, changed_at), not the
--     draft's non-existent (property_id, created_at).
--   * The two properties(price)/properties.status indexes were DROPPED — this
--     schema has no price/status column on `properties` (price and listing
--     status live on listing tables); those need a real index design against
--     the listing tables, not a blind port.

CREATE INDEX IF NOT EXISTS idx_service_requests_expires_open
  ON public.service_requests (expires_at) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_referrals_converted_rewarded
  ON public.referrals (converted_at) WHERE status = 'rewarded';

CREATE INDEX IF NOT EXISTS idx_bookings_provider_created
  ON public.bookings (provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_created
  ON public.email_logs (recipient, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_listing_changed
  ON public.price_history (listing_id, changed_at DESC);
