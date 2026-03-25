CREATE OR REPLACE FUNCTION public.cancel_viewing(p_viewing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_viewing public.viewings;
BEGIN
  SELECT * INTO v_viewing
  FROM public.viewings
  WHERE id = p_viewing_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
  END IF;

  IF v_viewing.status NOT IN ('confirmed', 'rescheduled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATUS');
  END IF;

  UPDATE public.viewings SET status = 'cancelled', updated_at = now() WHERE id = p_viewing_id;
  UPDATE public.viewing_slots SET status = 'available', updated_at = now() WHERE id = v_viewing.slot_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
