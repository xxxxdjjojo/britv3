-- Add the missing FK from listing_moderation.listing_id to listings(id).
--
-- The column was created (010_admin.sql) as `listing_id UUID NOT NULL` with no
-- REFERENCES clause, so PostgREST cannot embed listing_moderation from listings
-- (the admin moderation queue needs `listings?select=...,listing_moderation(...)`).
-- Adding the FK also enforces referential integrity for moderation rows.
-- (schema-reconciliation: enables the corrected getListingQueue embed.)

CREATE INDEX IF NOT EXISTS idx_listing_moderation_listing_id
  ON public.listing_moderation (listing_id);

ALTER TABLE public.listing_moderation
  ADD CONSTRAINT listing_moderation_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES public.listings (id) ON DELETE CASCADE;
