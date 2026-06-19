-- Public read access for the property detail page.
--
-- ROOT CAUSE: 003001_property_portal.sql granted `listings` and
-- `property_media` public SELECT (gated by active status), but `properties`
-- and `price_history` SELECT were restricted to the `authenticated` role.
-- While the site served mock data (search_live_data=false) this never
-- mattered. Once prod switched to live data, every logged-out visit to
-- /properties/[slug] joined listing -> property, got an empty property row
-- under RLS, and rendered "Property not found" — making the whole
-- property-detail path (and its renovation/EPC/planning sections) unreachable.
--
-- FIX: add public SELECT policies that expose ONLY rows belonging to an
-- active, non-deleted listing — mirroring listings_select_active and
-- property_media_select. Drafts/withdrawn properties stay private. These are
-- additive (OR'd with the existing authenticated policies), so logged-in
-- behaviour is unchanged.

-- Properties: public can read a property that has an active listing.
DROP POLICY IF EXISTS properties_select_public ON properties;
CREATE POLICY properties_select_public ON properties
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.property_id = properties.id
        AND l.status = 'active'
        AND l.deleted_at IS NULL
    )
  );

-- Price history: public can read history for an active listing
-- (surfaced in the PriceHistorySection of the detail page).
DROP POLICY IF EXISTS price_history_select_public ON price_history;
CREATE POLICY price_history_select_public ON price_history
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = price_history.listing_id
        AND l.status = 'active'
        AND l.deleted_at IS NULL
    )
  );
