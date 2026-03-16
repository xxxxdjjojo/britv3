-- ============================================================================
-- RPC: get_landlord_health_score
-- Returns a 0-100 health score for a landlord based on 4 weighted dimensions:
--   Compliance freshness (40pts), Rent collection (30pts),
--   Maintenance response (20pts), Deposit registration (10pts).
-- ============================================================================

CREATE OR REPLACE FUNCTION get_landlord_health_score(p_landlord_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_compliance_score NUMERIC;
  v_rent_score NUMERIC;
  v_maintenance_score NUMERIC;
  v_deposit_score NUMERIC;
  v_total_certs INTEGER;
  v_expired_certs INTEGER;
  v_expiring_certs INTEGER;
  v_total_rent INTEGER;
  v_paid_rent INTEGER;
  v_active_tenancies INTEGER;
  v_registered_deposits INTEGER;
  v_avg_response_days NUMERIC;
BEGIN
  -- ========================================================================
  -- 1. Compliance freshness (40pts)
  -- Count active compliance certs across all landlord properties.
  -- Deduct proportionally for expired; half-deduct for expiring within 30 days.
  -- ========================================================================
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE pd.expiry_date < NOW()),
    COUNT(*) FILTER (WHERE pd.expiry_date >= NOW() AND pd.expiry_date <= NOW() + INTERVAL '30 days')
  INTO v_total_certs, v_expired_certs, v_expiring_certs
  FROM property_documents pd
  JOIN properties p ON p.id = pd.property_id
  JOIN listings l ON l.property_id = p.id
  WHERE l.user_id = p_landlord_id
    AND pd.category IN ('gas_safety', 'electrical_eicr', 'epc')
    AND pd.is_active = TRUE;

  IF v_total_certs = 0 THEN
    v_compliance_score := 40;
  ELSE
    v_compliance_score := 40.0 * (1.0
      - (v_expired_certs::NUMERIC / v_total_certs)
      - (v_expiring_certs::NUMERIC / v_total_certs * 0.5));
  END IF;
  IF v_compliance_score < 0 THEN v_compliance_score := 0; END IF;

  -- ========================================================================
  -- 2. Rent collection rate (30pts)
  -- Uses financial_entries with type='income', category='rent' for current month.
  -- payment_status = 'paid' counts as collected.
  -- ========================================================================
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE fe.payment_status = 'paid')
  INTO v_total_rent, v_paid_rent
  FROM financial_entries fe
  JOIN tenancies t ON t.id = fe.tenancy_id
  WHERE t.landlord_id = p_landlord_id
    AND fe.type = 'income'
    AND fe.category = 'rent'
    AND fe.entry_date >= date_trunc('month', NOW())::DATE
    AND fe.entry_date < (date_trunc('month', NOW()) + INTERVAL '1 month')::DATE;

  IF v_total_rent = 0 THEN
    v_rent_score := 30;
  ELSE
    v_rent_score := 30.0 * v_paid_rent::NUMERIC / v_total_rent;
  END IF;

  -- ========================================================================
  -- 3. Maintenance response time (20pts)
  -- Avg days from created_at to updated_at for open requests (new/acknowledged).
  -- <2 days = 20, <7 = 15, <14 = 10, else = 5, no open = 20.
  -- ========================================================================
  SELECT AVG(
    EXTRACT(EPOCH FROM (COALESCE(mr.updated_at, NOW()) - mr.created_at)) / 86400
  )
  INTO v_avg_response_days
  FROM maintenance_requests mr
  JOIN properties p ON p.id = mr.property_id
  JOIN listings l ON l.property_id = p.id
  WHERE l.user_id = p_landlord_id
    AND mr.status IN ('new', 'acknowledged');

  IF v_avg_response_days IS NULL THEN v_maintenance_score := 20;
  ELSIF v_avg_response_days < 2 THEN v_maintenance_score := 20;
  ELSIF v_avg_response_days < 7 THEN v_maintenance_score := 15;
  ELSIF v_avg_response_days < 14 THEN v_maintenance_score := 10;
  ELSE v_maintenance_score := 5;
  END IF;

  -- ========================================================================
  -- 4. Deposit registration completeness (10pts)
  -- registered_deposits / active_tenancies * 10
  -- ========================================================================
  SELECT COUNT(DISTINCT t.id)
  INTO v_active_tenancies
  FROM tenancies t
  WHERE t.landlord_id = p_landlord_id AND t.status = 'active';

  SELECT COUNT(DISTINCT dr.tenancy_id)
  INTO v_registered_deposits
  FROM deposit_registrations dr
  JOIN tenancies t ON t.id = dr.tenancy_id
  WHERE t.landlord_id = p_landlord_id
    AND t.status = 'active'
    AND dr.status = 'registered';

  IF v_active_tenancies = 0 THEN
    v_deposit_score := 10;
  ELSE
    v_deposit_score := 10.0 * v_registered_deposits::NUMERIC / v_active_tenancies;
  END IF;

  -- ========================================================================
  -- Build result JSON
  -- ========================================================================
  SELECT json_build_object(
    'total_score', ROUND(v_compliance_score + v_rent_score + v_maintenance_score + v_deposit_score),
    'compliance_score', ROUND(v_compliance_score),
    'compliance_max', 40,
    'rent_score', ROUND(v_rent_score),
    'rent_max', 30,
    'maintenance_score', ROUND(v_maintenance_score),
    'maintenance_max', 20,
    'deposit_score', ROUND(v_deposit_score),
    'deposit_max', 10,
    'weakest_area', CASE
      WHEN v_compliance_score / 40.0 <= v_rent_score / 30.0
        AND v_compliance_score / 40.0 <= v_maintenance_score / 20.0
        AND v_compliance_score / 40.0 <= v_deposit_score / 10.0
      THEN 'compliance'
      WHEN v_rent_score / 30.0 <= v_maintenance_score / 20.0
        AND v_rent_score / 30.0 <= v_deposit_score / 10.0
      THEN 'rent'
      WHEN v_maintenance_score / 20.0 <= v_deposit_score / 10.0
      THEN 'maintenance'
      ELSE 'deposits'
    END
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
