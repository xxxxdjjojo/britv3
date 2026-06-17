-- B4 fix: Create landlord_profiles table for onboarding wizard
CREATE TABLE IF NOT EXISTS public.landlord_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_size INTEGER DEFAULT 1,
  portfolio_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own landlord profile"
  ON public.landlord_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
