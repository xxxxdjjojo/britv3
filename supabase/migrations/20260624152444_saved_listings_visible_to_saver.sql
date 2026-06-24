-- Saved Properties: let a user see listings on their own shortlist regardless of status.
--
-- Problem: the listings SELECT policy `listings_select_active` only exposes
-- listings where status = 'active' AND deleted_at IS NULL to non-owners. When a
-- saved listing moves to under_offer / sold / withdrawn, RLS hides it, the
-- PostgREST embed in getSavedProperties() returns null, and the Saved Properties
-- page crashed (production "Something went wrong"). The application layer now
-- tolerates a null embed, but the correct product behaviour is for savers to keep
-- seeing the property they shortlisted, with its current status surfaced as a
-- badge (Under offer / Sold).
--
-- This adds a permissive SELECT policy: an authenticated user may read a listing
-- if it appears in their own saved_properties. It is OR-combined with the existing
-- permissive policies, so it only ever widens visibility for rows the user has
-- explicitly saved. It does not leak other users' shortlists (gated on
-- sp.user_id = auth.uid()) and is backed by the unique index
-- saved_properties_user_id_listing_id_key.

CREATE POLICY "listings_select_saved"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.saved_properties sp
      WHERE sp.listing_id = listings.id
        AND sp.user_id = auth.uid()
    )
  );
