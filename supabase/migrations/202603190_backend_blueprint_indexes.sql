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

-- price + status live on listings, not properties (schema-drift fix).
-- The original idx_properties_(price|beds_price)_active referenced
-- properties.price / properties.status, neither of which exist. bedrooms is on
-- properties while price/status are on listings, so the composite beds+price
-- index cannot exist on a single table; collapsed to the listings price index.
CREATE INDEX IF NOT EXISTS idx_listings_price_active
  ON public.listings (price)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_bookings_provider_created
  ON public.bookings (provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_created
  ON public.email_logs (recipient, created_at DESC);

-- price_history is keyed by listing_id/changed_at, not property_id/created_at
-- (schema-drift fix).
CREATE INDEX IF NOT EXISTS idx_price_history_listing_date
  ON public.price_history (listing_id, changed_at DESC);
