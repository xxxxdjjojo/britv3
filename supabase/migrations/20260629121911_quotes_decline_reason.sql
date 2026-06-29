-- =============================================================================
-- Quotes: add decline_reason column
-- =============================================================================
-- The marketplace quote-service writes a decline_reason when an RFQ owner
-- declines a quote (src/services/marketplace/quote-service.ts → declineQuote).
-- The original quotes table (002_marketplace.sql) never had this column, so
-- the write silently dropped. Add it as a nullable text column. Idempotent.

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS decline_reason TEXT;

COMMENT ON COLUMN public.quotes.decline_reason IS
  'Optional free-text reason supplied by the RFQ owner when declining a quote. '
  'Null unless the quote was declined with a reason.';
