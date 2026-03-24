-- Wave 5: UK legal compliance for reviews
-- Consumer Protection from Unfair Trading Regulations 2008
-- Digital Markets, Competition and Consumers Act 2024
-- Defamation Act 2013

-- 1. Add incentivised review labelling
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_incentivised BOOLEAN DEFAULT false;

-- 2. Add defamation to the flag reasons CHECK constraint
-- First drop the existing constraint, then recreate with the new value
ALTER TABLE public.review_flags DROP CONSTRAINT IF EXISTS review_flags_reason_check;
ALTER TABLE public.review_flags
  ADD CONSTRAINT review_flags_reason_check CHECK (reason IN (
    'spam', 'inappropriate', 'fake', 'off_topic',
    'contact_info', 'promotional', 'duplicate', 'defamation'
  ));

-- 3. Boost moderation priority for defamation flags
-- Defamation complaints require 48h acknowledgement per our review policy,
-- so they get an automatic +10 priority bump in the moderation queue.
CREATE OR REPLACE FUNCTION public.boost_defamation_flag_priority()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reason = 'defamation' THEN
    UPDATE public.moderation_queue
    SET priority_score = priority_score + 10
    WHERE review_id = NEW.review_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_flags_defamation_boost ON public.review_flags;
CREATE TRIGGER review_flags_defamation_boost
  AFTER INSERT ON public.review_flags
  FOR EACH ROW EXECUTE FUNCTION boost_defamation_flag_priority();
