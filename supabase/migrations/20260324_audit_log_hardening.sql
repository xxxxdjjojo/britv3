-- Route all audit inserts through a SECURITY DEFINER function
-- that validates the caller and prevents direct table manipulation.
-- Depends on: 20260318100000_admin_audit_success.sql (adds success/error_message columns)

CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id uuid,
  p_action text,
  p_target_type text,
  p_target_id text,
  p_metadata jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_success boolean DEFAULT NULL,
  p_error_message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Caller is not an admin';
  END IF;

  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, metadata, ip_address, success, error_message)
  VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_metadata, p_ip_address, p_success, p_error_message)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
