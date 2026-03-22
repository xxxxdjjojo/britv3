CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN (
    'website', 'linkedin', 'instagram', 'facebook', 'tiktok', 'rightmove', 'zoopla'
  )),
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own social links"
  ON social_links FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can read social links"
  ON social_links FOR SELECT
  USING (true);
