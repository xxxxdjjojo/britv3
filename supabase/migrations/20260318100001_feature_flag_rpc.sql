-- RPC function for public feature flag checks (returns only boolean, not internal details)
CREATE OR REPLACE FUNCTION check_feature_flag(p_key TEXT, p_user_id UUID DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
  v_flag feature_flags%ROWTYPE;
  v_user_role TEXT;
BEGIN
  SELECT * INTO v_flag FROM feature_flags WHERE key = p_key;
  IF NOT FOUND THEN RETURN false; END IF;
  IF NOT v_flag.enabled THEN RETURN false; END IF;

  -- Role restriction check
  IF v_flag.allowed_roles IS NOT NULL AND p_user_id IS NOT NULL THEN
    SELECT role INTO v_user_role FROM profiles WHERE id = p_user_id;
    IF v_user_role IS NULL OR NOT (v_user_role = ANY(v_flag.allowed_roles)) THEN
      RETURN false;
    END IF;
  END IF;

  -- Random rollout evaluation
  IF v_flag.rollout_pct < 100 THEN
    IF random() * 100 >= v_flag.rollout_pct THEN RETURN false; END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restrict direct table SELECT to admins only (non-admins use the RPC function above)
DROP POLICY IF EXISTS "feature_flags_select" ON feature_flags;
CREATE POLICY "feature_flags_admin_select" ON feature_flags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
