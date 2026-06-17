-- Composite indexes for buyer dashboard performance
-- Single-column indexes on these tables already exist; these composites
-- speed up the filtered queries used in dashboard aggregation and list pages.

CREATE INDEX IF NOT EXISTS idx_viewings_user_status
  ON public.viewings (user_id, status);

CREATE INDEX IF NOT EXISTS idx_offers_user_status
  ON public.offers (user_id, status);

CREATE INDEX IF NOT EXISTS idx_ai_match_results_user_expires
  ON public.ai_match_results (user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_moving_checklist_user_offer
  ON public.moving_checklist_items (user_id, offer_id);
