CREATE TABLE IF NOT EXISTS service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  postcode_district text NOT NULL,
  display_name text,
  latitude double precision,
  longitude double precision,
  market_types text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, postcode_district)
);

ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own service areas"
  ON service_areas FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can read service areas"
  ON service_areas FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_sa_user ON service_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_sa_district ON service_areas(postcode_district);
