-- Renter preferences (mirrors buyer_preferences for rental-specific fields)
CREATE TABLE IF NOT EXISTS public.renter_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_locations TEXT[] DEFAULT '{}',
  min_monthly_rent INTEGER DEFAULT 500,
  max_monthly_rent INTEGER DEFAULT 2000,
  property_types TEXT[] DEFAULT '{}',
  min_bedrooms INTEGER DEFAULT 1,
  requirements TEXT[] DEFAULT '{}',
  notification_frequency TEXT DEFAULT 'daily',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.renter_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own renter preferences"
  ON public.renter_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own renter preferences"
  ON public.renter_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own renter preferences"
  ON public.renter_preferences FOR UPDATE
  USING (auth.uid() = user_id);
