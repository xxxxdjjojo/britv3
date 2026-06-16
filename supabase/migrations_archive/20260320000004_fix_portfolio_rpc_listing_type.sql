-- Fix get_landlord_portfolio_properties: listing_type enum value was 'rental'
-- but the listing_type enum only has 'sale' and 'rent'.
-- The wrong value caused a PostgreSQL error → Supabase returned 400 on any
-- page that calls getPortfolio / getPortfolioProperties.

CREATE OR REPLACE FUNCTION get_landlord_portfolio_properties(p_landlord_id UUID)
RETURNS TABLE (
  id UUID,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postcode TEXT,
  property_type TEXT,
  bedrooms INTEGER,
  listing_id UUID,
  tenant_name TEXT,
  tenancy_status TEXT,
  rent_amount NUMERIC,
  rent_frequency TEXT,
  lease_end_date DATE,
  open_maintenance_count BIGINT,
  expiring_documents_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.address_line1 AS address_line_1,
    p.address_line2 AS address_line_2,
    p.city,
    p.postcode,
    p.property_type::TEXT,
    p.bedrooms,
    l.id AS listing_id,
    -- Active tenancy: prefer 'active', then 'ending_soon'
    t_active.tenant_name,
    t_active.status::TEXT AS tenancy_status,
    t_active.rent_amount,
    t_active.rent_frequency,
    t_active.lease_end_date,
    -- Open maintenance count
    COALESCE(mc.cnt, 0) AS open_maintenance_count,
    -- Expiring documents count (within 30 days, active only)
    COALESCE(dc.cnt, 0) AS expiring_documents_count
  FROM listings l
  INNER JOIN properties p ON p.id = l.property_id
  -- Pick the best active tenancy per property using DISTINCT ON
  LEFT JOIN LATERAL (
    SELECT
      ten.tenant_name,
      ten.status,
      ten.rent_amount,
      ten.rent_frequency,
      ten.lease_end_date
    FROM tenancies ten
    WHERE ten.property_id = p.id
      AND ten.status IN ('active', 'ending_soon')
    ORDER BY
      CASE ten.status WHEN 'active' THEN 0 WHEN 'ending_soon' THEN 1 END
    LIMIT 1
  ) t_active ON TRUE
  -- Open maintenance aggregate
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM maintenance_requests mr
    WHERE mr.property_id = p.id
      AND mr.status IN ('new', 'acknowledged', 'assigned', 'in_progress')
  ) mc ON TRUE
  -- Expiring documents aggregate (active docs expiring within 30 days)
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM property_documents pd
    WHERE pd.property_id = p.id
      AND pd.is_active = TRUE
      AND pd.expiry_date >= NOW()
      AND pd.expiry_date <= NOW() + INTERVAL '30 days'
  ) dc ON TRUE
  WHERE l.user_id = p_landlord_id
    AND l.listing_type = 'rent'   -- fixed: was 'rental' (not a valid enum value)
    AND l.deleted_at IS NULL
  ORDER BY p.address_line1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
