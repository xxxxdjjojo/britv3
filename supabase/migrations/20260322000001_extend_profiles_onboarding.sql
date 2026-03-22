ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_score integer DEFAULT 0
    CHECK (profile_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_incomplete
  ON profiles(onboarding_step)
  WHERE onboarding_complete = false;

COMMENT ON COLUMN profiles.profile_score IS 'Weighted completeness score 0-100, recalculated by trigger';
COMMENT ON COLUMN profiles.onboarding_step IS 'Current step in professional onboarding (1-12)';
