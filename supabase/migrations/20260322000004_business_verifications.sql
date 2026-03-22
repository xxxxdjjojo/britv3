CREATE TABLE IF NOT EXISTS business_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  utr_number char(10),
  trading_name text,
  trading_address jsonb,
  vat_number text,
  hmrc_aml_reference text,
  hmrc_aml_verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE business_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own business verification"
  ON business_verifications FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_bv_user ON business_verifications(user_id);

CREATE TRIGGER set_bv_updated_at
  BEFORE UPDATE ON business_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
