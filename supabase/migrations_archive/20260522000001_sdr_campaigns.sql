-- 20260522000001_sdr_campaigns.sql
-- Memo Pivot v2 — outbound SDR campaign tables.

CREATE TABLE IF NOT EXISTS sdr_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  audience        TEXT NOT NULL CHECK (audience IN ('trade', 'agent', 'developer')),
  persona         TEXT NOT NULL,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed'))
);

CREATE TABLE IF NOT EXISTS sdr_targets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID REFERENCES sdr_campaigns(id) ON DELETE CASCADE,
  external_id     TEXT NOT NULL,
  contact         TEXT NOT NULL,
  audience        TEXT NOT NULL,
  postcode        TEXT,
  meta            JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (campaign_id, external_id)
);

CREATE TABLE IF NOT EXISTS sdr_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID REFERENCES sdr_campaigns(id) ON DELETE CASCADE,
  target_id       UUID REFERENCES sdr_targets(id) ON DELETE CASCADE,
  job_id          TEXT NOT NULL UNIQUE,
  body            TEXT,
  status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','skipped','failed')),
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,
  enqueued_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sdr_messages_status_idx ON sdr_messages(status);
CREATE INDEX IF NOT EXISTS sdr_targets_campaign_idx ON sdr_targets(campaign_id);

ALTER TABLE sdr_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_targets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_messages  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only — campaigns"     ON sdr_campaigns;
DROP POLICY IF EXISTS "Admins only — targets"       ON sdr_targets;
DROP POLICY IF EXISTS "Admins only — messages"      ON sdr_messages;

CREATE POLICY "Admins only — campaigns" ON sdr_campaigns
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins only — targets" ON sdr_targets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins only — messages" ON sdr_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
