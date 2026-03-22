-- ============================================================================
-- RPC: get_compliance_matrix
-- Returns one row per (property × compliance category) for the matrix grid.
-- Uses CROSS JOIN with a VALUES list of requirement categories,
-- then LEFT JOINs to find matching active documents.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_compliance_matrix(p_landlord_id UUID)
RETURNS TABLE (
  property_id UUID,
  property_address TEXT,
  is_hmo BOOLEAN,
  category TEXT,
  doc_id UUID,
  expiry_date DATE,
  status TEXT  -- 'valid', 'expiring', 'expired', 'missing'
) AS $$
BEGIN
  RETURN QUERY
  WITH landlord_properties AS (
    SELECT p.id, p.address_line1 || ', ' || p.city AS address, p.is_hmo
    FROM properties p
    JOIN listings l ON l.property_id = p.id
    WHERE l.user_id = p_landlord_id
      AND l.listing_type = 'rental'
      AND l.deleted_at IS NULL
  ),
  categories AS (
    SELECT unnest(ARRAY[
      'gas_safety', 'electrical_eicr', 'epc',
      'deposit_protection', 'smoke_co_alarms',
      'hmo_licence', 'fire_safety'
    ]) AS cat
  ),
  -- Cross join properties × categories, filtering HMO-only categories
  matrix AS (
    SELECT lp.id AS prop_id, lp.address, lp.is_hmo, c.cat
    FROM landlord_properties lp
    CROSS JOIN categories c
    WHERE c.cat NOT IN ('hmo_licence', 'fire_safety')
       OR lp.is_hmo = TRUE
  ),
  -- Find the most recent active document per property × category
  latest_docs AS (
    SELECT DISTINCT ON (pd.property_id, pd.category)
      pd.property_id,
      pd.category,
      pd.id AS doc_id,
      pd.expiry_date
    FROM property_documents pd
    WHERE pd.is_active = TRUE
    ORDER BY pd.property_id, pd.category, pd.created_at DESC
  )
  SELECT
    m.prop_id AS property_id,
    m.address AS property_address,
    m.is_hmo,
    m.cat AS category,
    ld.doc_id,
    ld.expiry_date,
    CASE
      WHEN ld.doc_id IS NULL THEN 'missing'
      WHEN ld.expiry_date IS NULL THEN 'valid'  -- no expiry = always valid (e.g. smoke alarms)
      WHEN ld.expiry_date < NOW() THEN 'expired'
      WHEN ld.expiry_date <= NOW() + INTERVAL '30 days' THEN 'expiring'
      ELSE 'valid'
    END AS status
  FROM matrix m
  LEFT JOIN latest_docs ld ON ld.property_id = m.prop_id AND ld.category = m.cat
  ORDER BY m.address, m.cat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: get_key_dates
-- Returns upcoming dates (next 60 days) for the key dates ticker.
-- Sources: tenancy end dates, compliance expiry, deposit deadlines.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_key_dates(p_landlord_id UUID)
RETURNS TABLE (
  event_date DATE,
  event_type TEXT,  -- 'tenancy_end', 'compliance_expiry', 'deposit_deadline'
  title TEXT,
  property_address TEXT,
  property_id UUID,
  urgency TEXT  -- 'critical', 'warning', 'info'
) AS $$
BEGIN
  RETURN QUERY
  -- Tenancy endings
  SELECT
    t.lease_end_date AS event_date,
    'tenancy_end'::TEXT AS event_type,
    ('Tenancy ending: ' || t.tenant_name)::TEXT AS title,
    (p.address_line1 || ', ' || p.city)::TEXT AS property_address,
    p.id AS property_id,
    CASE
      WHEN t.lease_end_date <= NOW() + INTERVAL '14 days' THEN 'critical'
      WHEN t.lease_end_date <= NOW() + INTERVAL '30 days' THEN 'warning'
      ELSE 'info'
    END AS urgency
  FROM tenancies t
  JOIN properties p ON p.id = t.property_id
  JOIN listings l ON l.property_id = p.id
  WHERE t.landlord_id = p_landlord_id
    AND t.status IN ('active', 'ending_soon')
    AND t.lease_end_date IS NOT NULL
    AND t.lease_end_date <= NOW() + INTERVAL '60 days'
    AND l.deleted_at IS NULL

  UNION ALL

  -- Compliance expiry
  SELECT
    pd.expiry_date AS event_date,
    'compliance_expiry'::TEXT AS event_type,
    (pd.category || ' expires')::TEXT AS title,
    (p.address_line1 || ', ' || p.city)::TEXT AS property_address,
    p.id AS property_id,
    CASE
      WHEN pd.expiry_date <= NOW() THEN 'critical'
      WHEN pd.expiry_date <= NOW() + INTERVAL '14 days' THEN 'warning'
      ELSE 'info'
    END AS urgency
  FROM property_documents pd
  JOIN properties p ON p.id = pd.property_id
  JOIN listings l ON l.property_id = p.id
  WHERE l.user_id = p_landlord_id
    AND pd.is_active = TRUE
    AND pd.expiry_date IS NOT NULL
    AND pd.expiry_date <= NOW() + INTERVAL '60 days'
    AND l.deleted_at IS NULL

  ORDER BY event_date ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
