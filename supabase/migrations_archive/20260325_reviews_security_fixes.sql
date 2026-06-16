-- =============================================================================
-- Reviews & Ratings Security Fixes (Wave 1)
-- 5 bug fixes from QA audit: CASCADE, RLS, self-flag, stats, constraints
-- =============================================================================

-- ---------------------------------------------------------------------------
-- FIX 1 — BUG-7: ON DELETE CASCADE destroys reviews on account deletion
-- Change reviewer_id FK to SET NULL so reviews survive as anonymised
-- ---------------------------------------------------------------------------
ALTER TABLE public.reviews ALTER COLUMN reviewer_id DROP NOT NULL;

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_reviewer_id_fkey
  FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- FIX 2 — BUG-9: Provider UPDATE RLS policy too permissive
-- Add BEFORE UPDATE trigger to restrict providers to response columns only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION restrict_provider_review_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If the updater is the provider (not the reviewer), only allow response changes
  IF OLD.provider_id = auth.uid() AND OLD.reviewer_id IS DISTINCT FROM auth.uid() THEN
    IF NEW.title IS DISTINCT FROM OLD.title
       OR NEW.review_text IS DISTINCT FROM OLD.review_text
       OR NEW.overall_rating IS DISTINCT FROM OLD.overall_rating
       OR NEW.punctuality_rating IS DISTINCT FROM OLD.punctuality_rating
       OR NEW.quality_rating IS DISTINCT FROM OLD.quality_rating
       OR NEW.value_rating IS DISTINCT FROM OLD.value_rating
       OR NEW.professionalism_rating IS DISTINCT FROM OLD.professionalism_rating
    THEN
      RAISE EXCEPTION 'Providers can only update their response';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_restrict_provider_update
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION restrict_provider_review_update();

-- Add reviewer UPDATE RLS policy (reviewers could not edit before)
CREATE POLICY "Reviewers can edit own reviews" ON reviews
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- FIX 3 — BUG-3: Provider self-flagging
-- The atomic_flag_review() RPC only checked reviewer_id = user_id but not
-- provider_id = user_id. A provider could flag negative reviews about themselves.
-- ---------------------------------------------------------------------------
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
  v_provider_id uuid;
  v_new_flag_count integer;
  v_flag_id uuid;
BEGIN
  SELECT reviewer_id, provider_id INTO v_reviewer_id, v_provider_id
  FROM public.reviews
  WHERE id = p_review_id;

  IF v_reviewer_id IS NULL AND v_provider_id IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  IF v_reviewer_id = p_user_id THEN
    RAISE EXCEPTION 'Cannot flag your own review';
  END IF;

  IF v_provider_id = p_user_id THEN
    RAISE EXCEPTION 'Cannot flag reviews about your own services';
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

-- ---------------------------------------------------------------------------
-- FIX 4 — BUG-10: Aggregate stats don't recalculate on review removal
-- The trigger only incremented when status changed TO 'approved'.
-- Now also decrements when status changes FROM 'approved' or soft-deleted.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_provider_rating_stats_incremental()
RETURNS TRIGGER AS $$
BEGIN
  -- Case 1: status changes TO 'approved' (increment)
  IF NEW.moderation_status = 'approved' AND (OLD IS NULL OR OLD.moderation_status != 'approved') THEN
    INSERT INTO provider_rating_stats (provider_id, average_rating, total_reviews, last_review_date)
    VALUES (NEW.provider_id, NEW.overall_rating, 1, NOW())
    ON CONFLICT (provider_id) DO UPDATE SET
      average_rating = (
        (provider_rating_stats.average_rating * provider_rating_stats.total_reviews + NEW.overall_rating)
        / (provider_rating_stats.total_reviews + 1)
      ),
      total_reviews = provider_rating_stats.total_reviews + 1,
      avg_punctuality = CASE
        WHEN NEW.punctuality_rating IS NOT NULL THEN
          (provider_rating_stats.avg_punctuality * provider_rating_stats.total_reviews + NEW.punctuality_rating)
          / (provider_rating_stats.total_reviews + 1)
        ELSE provider_rating_stats.avg_punctuality
      END,
      avg_quality = CASE
        WHEN NEW.quality_rating IS NOT NULL THEN
          (provider_rating_stats.avg_quality * provider_rating_stats.total_reviews + NEW.quality_rating)
          / (provider_rating_stats.total_reviews + 1)
        ELSE provider_rating_stats.avg_quality
      END,
      avg_value = CASE
        WHEN NEW.value_rating IS NOT NULL THEN
          (provider_rating_stats.avg_value * provider_rating_stats.total_reviews + NEW.value_rating)
          / (provider_rating_stats.total_reviews + 1)
        ELSE provider_rating_stats.avg_value
      END,
      avg_professionalism = CASE
        WHEN NEW.professionalism_rating IS NOT NULL THEN
          (provider_rating_stats.avg_professionalism * provider_rating_stats.total_reviews + NEW.professionalism_rating)
          / (provider_rating_stats.total_reviews + 1)
        ELSE provider_rating_stats.avg_professionalism
      END,
      count_5_star = provider_rating_stats.count_5_star + CASE WHEN NEW.overall_rating = 5 THEN 1 ELSE 0 END,
      count_4_star = provider_rating_stats.count_4_star + CASE WHEN NEW.overall_rating = 4 THEN 1 ELSE 0 END,
      count_3_star = provider_rating_stats.count_3_star + CASE WHEN NEW.overall_rating = 3 THEN 1 ELSE 0 END,
      count_2_star = provider_rating_stats.count_2_star + CASE WHEN NEW.overall_rating = 2 THEN 1 ELSE 0 END,
      count_1_star = provider_rating_stats.count_1_star + CASE WHEN NEW.overall_rating = 1 THEN 1 ELSE 0 END,
      last_review_date = NOW(),
      updated_at = NOW();
  END IF;

  -- Case 2: status changes FROM 'approved' to something else, OR soft-deleted (decrement)
  IF OLD IS NOT NULL
     AND OLD.moderation_status = 'approved'
     AND (
       NEW.moderation_status != 'approved'
       OR (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
     )
  THEN
    UPDATE provider_rating_stats SET
      average_rating = CASE
        WHEN total_reviews <= 1 THEN 0
        ELSE ((average_rating * total_reviews) - OLD.overall_rating) / (total_reviews - 1)
      END,
      total_reviews = GREATEST(total_reviews - 1, 0),
      avg_punctuality = CASE
        WHEN OLD.punctuality_rating IS NOT NULL AND total_reviews > 1 THEN
          ((avg_punctuality * total_reviews) - OLD.punctuality_rating) / (total_reviews - 1)
        WHEN total_reviews <= 1 THEN 0
        ELSE avg_punctuality
      END,
      avg_quality = CASE
        WHEN OLD.quality_rating IS NOT NULL AND total_reviews > 1 THEN
          ((avg_quality * total_reviews) - OLD.quality_rating) / (total_reviews - 1)
        WHEN total_reviews <= 1 THEN 0
        ELSE avg_quality
      END,
      avg_value = CASE
        WHEN OLD.value_rating IS NOT NULL AND total_reviews > 1 THEN
          ((avg_value * total_reviews) - OLD.value_rating) / (total_reviews - 1)
        WHEN total_reviews <= 1 THEN 0
        ELSE avg_value
      END,
      avg_professionalism = CASE
        WHEN OLD.professionalism_rating IS NOT NULL AND total_reviews > 1 THEN
          ((avg_professionalism * total_reviews) - OLD.professionalism_rating) / (total_reviews - 1)
        WHEN total_reviews <= 1 THEN 0
        ELSE avg_professionalism
      END,
      count_5_star = GREATEST(count_5_star - CASE WHEN OLD.overall_rating = 5 THEN 1 ELSE 0 END, 0),
      count_4_star = GREATEST(count_4_star - CASE WHEN OLD.overall_rating = 4 THEN 1 ELSE 0 END, 0),
      count_3_star = GREATEST(count_3_star - CASE WHEN OLD.overall_rating = 3 THEN 1 ELSE 0 END, 0),
      count_2_star = GREATEST(count_2_star - CASE WHEN OLD.overall_rating = 2 THEN 1 ELSE 0 END, 0),
      count_1_star = GREATEST(count_1_star - CASE WHEN OLD.overall_rating = 1 THEN 1 ELSE 0 END, 0),
      updated_at = NOW()
    WHERE provider_id = OLD.provider_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- FIX 5 — BUG-8: Text length constraints
-- Enforce min/max lengths on review_text and title
-- ---------------------------------------------------------------------------
ALTER TABLE public.reviews
  ADD CONSTRAINT review_text_min_length CHECK (char_length(review_text) >= 20),
  ADD CONSTRAINT review_text_max_length CHECK (char_length(review_text) <= 2000),
  ADD CONSTRAINT review_title_min_length CHECK (char_length(title) >= 3),
  ADD CONSTRAINT review_title_max_length CHECK (char_length(title) <= 200);
