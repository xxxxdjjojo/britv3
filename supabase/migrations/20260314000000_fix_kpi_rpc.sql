-- Fix get_landlord_portfolio_kpis RPC
-- Previous version incorrectly queried p.landlord_id which doesn't exist on
-- the properties table. Landlord ownership is via listings.user_id (rental listings).
-- Also adds occupancy_rate to the returned JSON.

CREATE OR REPLACE FUNCTION get_landlord_portfolio_kpis(p_landlord_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_properties',   COUNT(DISTINCT l.id),
    'occupied',           COUNT(DISTINCT l.id) FILTER (WHERE t.status IN ('active', 'ending_soon')),
    'vacant',             COUNT(DISTINCT l.id) - COUNT(DISTINCT l.id) FILTER (WHERE t.status IN ('active', 'ending_soon')),
    'occupancy_rate',     CASE
                            WHEN COUNT(DISTINCT l.id) = 0 THEN 0
                            ELSE ROUND(
                              COUNT(DISTINCT l.id) FILTER (WHERE t.status IN ('active', 'ending_soon'))::NUMERIC
                              * 100.0 / COUNT(DISTINCT l.id),
                              1
                            )
                          END,
    'total_monthly_rent', COALESCE(
                            SUM(t.rent_amount) FILTER (
                              WHERE t.status = 'active' AND t.rent_frequency = 'monthly'
                            ),
                            0
                          ),
    'compliance_alerts',  COUNT(pd.id) FILTER (
                            WHERE pd.expiry_date IS NOT NULL
                              AND pd.expiry_date >= CURRENT_DATE
                              AND pd.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
                          ),
    'open_maintenance',   COUNT(mr.id) FILTER (
                            WHERE mr.status IN ('new', 'acknowledged', 'assigned', 'in_progress')
                          ),
    'expired_compliance', COUNT(pd.id) FILTER (
                            WHERE pd.expiry_date IS NOT NULL
                              AND pd.expiry_date < CURRENT_DATE
                          )
  ) INTO result
  FROM listings l
  JOIN properties p ON p.id = l.property_id
  LEFT JOIN tenancies t ON t.property_id = p.id
  LEFT JOIN property_documents pd
    ON pd.property_id = p.id
   AND pd.category IN ('gas_safety', 'electrical_eicr', 'epc')
  LEFT JOIN maintenance_requests mr ON mr.property_id = p.id
  WHERE l.user_id = p_landlord_id
    AND l.listing_type = 'rent';

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
