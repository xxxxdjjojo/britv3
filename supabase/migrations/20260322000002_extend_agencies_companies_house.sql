CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  address text,
  registration_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users manage own agency" ON agencies FOR ALL USING (owner_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Anyone can read agencies" ON agencies FOR SELECT USING (true);

ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS companies_house_no char(8),
  ADD COLUMN IF NOT EXISTS company_status text,
  ADD COLUMN IF NOT EXISTS company_sic_codes text[],
  ADD COLUMN IF NOT EXISTS director_name text,
  ADD COLUMN IF NOT EXISTS ch_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS hmrc_aml_reference text,
  ADD COLUMN IF NOT EXISTS hmrc_aml_verified boolean DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agencies_companies_house_no
  ON agencies(companies_house_no)
  WHERE companies_house_no IS NOT NULL;

COMMENT ON COLUMN agencies.companies_house_no IS '8-char alphanumeric Companies House number (e.g. 01234567, SC123456)';
COMMENT ON COLUMN agencies.hmrc_aml_reference IS 'HMRC Money Laundering Regulations reference — mandatory for estate/letting agents';
