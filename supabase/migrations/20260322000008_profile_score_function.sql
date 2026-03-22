CREATE OR REPLACE FUNCTION calculate_profile_score(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score integer := 0;
  v_profile profiles%ROWTYPE;
  v_agent agent_profiles%ROWTYPE;
  v_has_photo boolean;
  v_has_bio boolean;
  v_has_areas boolean;
  v_has_social boolean;
  v_ch_verified boolean;
  v_kyc_approved boolean;
  v_has_membership boolean;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT * INTO v_agent FROM agent_profiles WHERE id = p_user_id;

  v_has_photo := COALESCE(v_agent.photo_url, v_profile.avatar_url) IS NOT NULL;
  IF v_has_photo THEN v_score := v_score + 20; END IF;

  v_has_bio := v_agent.bio IS NOT NULL AND length(v_agent.bio) > 20;
  IF v_has_bio THEN v_score := v_score + 15; END IF;

  SELECT ch_verified_at IS NOT NULL INTO v_ch_verified
    FROM agencies WHERE owner_id = p_user_id;
  IF NOT FOUND THEN
    SELECT utr_number IS NOT NULL INTO v_ch_verified
      FROM business_verifications WHERE user_id = p_user_id;
  END IF;
  IF COALESCE(v_ch_verified, false) THEN v_score := v_score + 25; END IF;

  SELECT status = 'approved' INTO v_kyc_approved
    FROM kyc_verifications WHERE user_id = p_user_id;
  IF COALESCE(v_kyc_approved, false) THEN v_score := v_score + 20; END IF;

  SELECT EXISTS(SELECT 1 FROM service_areas WHERE user_id = p_user_id) INTO v_has_areas;
  IF v_has_areas THEN v_score := v_score + 10; END IF;

  SELECT EXISTS(
    SELECT 1 FROM provider_verifications
    WHERE user_id = p_user_id AND stage = 'qualifications' AND status = 'approved'
  ) INTO v_has_membership;
  IF v_has_membership THEN v_score := v_score + 10; END IF;

  UPDATE profiles SET profile_score = v_score WHERE id = p_user_id;

  RETURN v_score;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_profile_score TO authenticated;
