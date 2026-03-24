-- Atomic offer acceptance: updates offer, listing, creates progression, rejects others
CREATE OR REPLACE FUNCTION public.accept_offer_cascade(
  p_offer_id uuid,
  p_seller_id uuid,
  p_solicitor_name text DEFAULT NULL,
  p_solicitor_email text DEFAULT NULL,
  p_solicitor_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_listing_id uuid;
  v_offer_status text;
  v_progression_id uuid;
  v_rejected_count integer;
BEGIN
  -- 1. Verify ownership + pending status
  SELECT listing_id, status INTO v_listing_id, v_offer_status
  FROM seller_offers
  WHERE id = p_offer_id AND seller_id = p_seller_id;

  IF v_listing_id IS NULL THEN
    RAISE EXCEPTION 'Offer not found or not owned by you';
  END IF;
  IF v_offer_status != 'pending' THEN
    RAISE EXCEPTION 'Offer has already been actioned';
  END IF;

  -- 2. Accept the offer
  UPDATE seller_offers
  SET status = 'accepted',
      solicitor_name = p_solicitor_name,
      solicitor_email = p_solicitor_email,
      solicitor_phone = p_solicitor_phone,
      responded_at = now()
  WHERE id = p_offer_id;

  -- 3. Update listing to under_offer
  UPDATE seller_listings SET status = 'under_offer' WHERE id = v_listing_id;

  -- 4. Create sale progression (stage 1 = offer accepted)
  INSERT INTO sale_progression_stages (
    offer_id, seller_id, current_stage,
    stage_dates, solicitor_name, solicitor_email, solicitor_phone
  )
  VALUES (
    p_offer_id, p_seller_id, 1,
    jsonb_build_object('1', to_char(now(), 'YYYY-MM-DD')),
    p_solicitor_name, p_solicitor_email, p_solicitor_phone
  )
  RETURNING id INTO v_progression_id;

  -- 5. Reject all other pending offers on this listing
  UPDATE seller_offers
  SET status = 'rejected', responded_at = now()
  WHERE listing_id = v_listing_id
    AND id != p_offer_id
    AND status = 'pending';
  GET DIAGNOSTICS v_rejected_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'progression_id', v_progression_id,
    'rejected_count', v_rejected_count,
    'listing_id', v_listing_id
  );
END;
$$;
