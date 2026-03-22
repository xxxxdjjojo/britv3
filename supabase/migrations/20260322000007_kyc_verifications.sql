CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('yoti', 'onfido', 'mock')),
  check_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'approved', 'declined'
  )),
  document_type text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own KYC"
  ON kyc_verifications FOR SELECT
  USING (user_id = auth.uid());

CREATE TRIGGER set_kyc_updated_at
  BEFORE UPDATE ON kyc_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
