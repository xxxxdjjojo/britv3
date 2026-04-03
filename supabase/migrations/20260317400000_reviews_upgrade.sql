-- 1. Add missing flag_count column (referenced in service but missing from table)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS flag_count integer DEFAULT 0;

-- 2. Add edit-tracking columns for 17.3
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS original_text text,
  ADD COLUMN IF NOT EXISTS edit_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edit_history jsonb DEFAULT '[]'::jsonb;

-- 3. Prevent duplicate flags per user per review
CREATE UNIQUE INDEX IF NOT EXISTS review_flags_user_review_unique
  ON public.review_flags (review_id, user_id);

-- 4. Atomic vote increment RPC (replaces race-condition-prone read-modify-write)
CREATE OR REPLACE FUNCTION public.atomic_vote_review(
  p_review_id uuid,
  p_user_id uuid,
  p_is_helpful boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_vote boolean;
  v_result jsonb;
BEGIN
  SELECT is_helpful INTO v_existing_vote
  FROM public.review_helpfulness
  WHERE review_id = p_review_id AND user_id = p_user_id;

  IF v_existing_vote IS NOT NULL THEN
    IF v_existing_vote != p_is_helpful THEN
      UPDATE public.review_helpfulness
      SET is_helpful = p_is_helpful, created_at = now()
      WHERE review_id = p_review_id AND user_id = p_user_id;

      IF p_is_helpful THEN
        UPDATE public.reviews
        SET helpful_count = helpful_count + 1,
            not_helpful_count = GREATEST(not_helpful_count - 1, 0)
        WHERE id = p_review_id;
      ELSE
        UPDATE public.reviews
        SET not_helpful_count = not_helpful_count + 1,
            helpful_count = GREATEST(helpful_count - 1, 0)
        WHERE id = p_review_id;
      END IF;
    END IF;
  ELSE
    INSERT INTO public.review_helpfulness (review_id, user_id, is_helpful)
    VALUES (p_review_id, p_user_id, p_is_helpful);

    IF p_is_helpful THEN
      UPDATE public.reviews
      SET helpful_count = helpful_count + 1
      WHERE id = p_review_id;
    ELSE
      UPDATE public.reviews
      SET not_helpful_count = not_helpful_count + 1
      WHERE id = p_review_id;
    END IF;
  END IF;

  SELECT jsonb_build_object(
    'helpful_count', r.helpful_count,
    'not_helpful_count', r.not_helpful_count
  ) INTO v_result
  FROM public.reviews r
  WHERE r.id = p_review_id;

  RETURN COALESCE(v_result, '{"helpful_count":0,"not_helpful_count":0}'::jsonb);
END;
$$;

-- 5. Atomic flag increment + moderation escalation RPC
CREATE OR REPLACE FUNCTION public.atomic_flag_review(
  p_review_id uuid,
  p_user_id uuid,
  p_reason text,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reviewer_id uuid;
  v_new_flag_count integer;
  v_flag_id uuid;
BEGIN
  SELECT reviewer_id INTO v_reviewer_id
  FROM public.reviews
  WHERE id = p_review_id;

  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  IF v_reviewer_id = p_user_id THEN
    RAISE EXCEPTION 'Cannot flag your own review';
  END IF;

  INSERT INTO public.review_flags (review_id, user_id, reason, description, admin_status)
  VALUES (p_review_id, p_user_id, p_reason, p_description, 'pending')
  RETURNING id INTO v_flag_id;

  UPDATE public.reviews
  SET flag_count = flag_count + 1
  WHERE id = p_review_id
  RETURNING flag_count INTO v_new_flag_count;

  IF v_new_flag_count >= 3 THEN
    UPDATE public.moderation_queue
    SET priority_score = priority_score + 5
    WHERE review_id = p_review_id;
  END IF;

  RETURN jsonb_build_object('flag_id', v_flag_id, 'flag_count', v_new_flag_count);
END;
$$;

-- 6. Create area_rating_stats materialized view for 17.5
CREATE MATERIALIZED VIEW IF NOT EXISTS public.area_rating_stats AS
SELECT
  SPLIT_PART(pc.val, ' ', 1) AS area_code,
  svc.val::text AS trade_category,
  AVG(prs.average_rating)::numeric(3,2) AS avg_rating,
  SUM(prs.total_reviews)::bigint AS total_reviews,
  COUNT(DISTINCT prs.provider_id)::integer AS total_providers,
  (ARRAY_AGG(prs.provider_id ORDER BY prs.average_rating DESC))[1] AS top_provider_id
FROM public.provider_rating_stats prs
JOIN public.service_provider_details spd ON spd.user_id = prs.provider_id
CROSS JOIN LATERAL unnest(spd.service_postcodes) AS pc(val)
CROSS JOIN LATERAL unnest(spd.services) AS svc(val)
WHERE prs.total_reviews > 0
  AND spd.service_postcodes IS NOT NULL
  AND array_length(spd.service_postcodes, 1) > 0
GROUP BY area_code, trade_category;

CREATE UNIQUE INDEX IF NOT EXISTS idx_area_rating_stats_pk
  ON public.area_rating_stats (area_code, trade_category);

-- 7. Schedule materialized view refresh via pg_cron (every 6 hours)
-- NOTE: pg_cron must be enabled in Supabase dashboard (Extensions > pg_cron)
SELECT cron.schedule(
  'refresh-area-rating-stats',
  '0 */6 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.area_rating_stats;'
);

-- 8. Grant RPC execute to authenticated users
GRANT EXECUTE ON FUNCTION public.atomic_vote_review TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_flag_review TO authenticated;
GRANT SELECT ON public.area_rating_stats TO anon, authenticated;
