CREATE TABLE IF NOT EXISTS public.ai_match_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('dismissed', 'interested')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);
ALTER TABLE public.ai_match_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own feedback" ON public.ai_match_feedback FOR ALL USING (user_id = auth.uid());
CREATE INDEX idx_ai_match_feedback_user ON public.ai_match_feedback(user_id);
