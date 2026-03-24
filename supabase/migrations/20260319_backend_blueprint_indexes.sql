-- ==========================================================================
-- Backend Data Layer Blueprint — Indexes
-- ==========================================================================
-- Separated from main migration because CREATE INDEX CONCURRENTLY
-- cannot run inside a transaction. Using regular CREATE INDEX here.
-- For production with large tables, run with CONCURRENTLY via SQL Editor.
-- ==========================================================================

CREATE INDEX IF NOT EXISTS idx_service_requests_expires_open
  ON public.service_requests (expires_at)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_referrals_converted_rewarded
  ON public.referrals (converted_at)
  WHERE status = 'rewarded';

CREATE INDEX IF NOT EXISTS idx_properties_price_active
  ON public.properties (price)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_properties_beds_price_active
  ON public.properties (bedrooms, price)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_bookings_provider_created
  ON public.bookings (provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_created
  ON public.email_logs (recipient, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_prop_date
  ON public.price_history (property_id, created_at DESC);
