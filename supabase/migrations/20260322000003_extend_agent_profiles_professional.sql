ALTER TABLE agent_profiles
  ADD COLUMN IF NOT EXISTS entity_type text
    CHECK (entity_type IN ('ltd_company', 'sole_trader')),
  ADD COLUMN IF NOT EXISTS professional_title text,
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS transactions_count text,
  ADD COLUMN IF NOT EXISTS languages_spoken text[],
  ADD COLUMN IF NOT EXISTS specialties text[],
  ADD COLUMN IF NOT EXISTS phone_uk text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS office_address jsonb,
  ADD COLUMN IF NOT EXISTS photo_url text;

COMMENT ON COLUMN agent_profiles.entity_type IS 'Ltd Company or Sole Trader — drives verification path';
COMMENT ON COLUMN agent_profiles.phone_uk IS 'UK phone in +44 format';
COMMENT ON COLUMN agent_profiles.office_address IS '{"line1", "line2", "city", "county", "postcode"}';
