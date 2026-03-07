-- Admin infrastructure migration
-- Adds is_admin column, push_subscriptions, content_reports, and listing_moderation tables

-- ============================================================
-- 1. Add is_admin column to profiles
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- 2. Push subscriptions table (for PWA push notifications)
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 3. Content reports table
-- ============================================================

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('listing', 'review')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) <= 500),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES auth.users(id),
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(reporter_id, entity_type, entity_id)
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own reports
CREATE POLICY "Users can report content"
  ON content_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Admins can view and manage all reports (via service_role / RLS bypass)
-- service_role bypasses RLS by default so no additional policy needed

-- Index for admin moderation queue
CREATE INDEX IF NOT EXISTS idx_content_reports_status_entity
  ON content_reports (status, entity_type)
  WHERE status = 'open';

-- ============================================================
-- 4. Listing moderation table
-- ============================================================

CREATE TABLE IF NOT EXISTS listing_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  flags JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE listing_moderation ENABLE ROW LEVEL SECURITY;

-- Admin access only via service_role (no authenticated user policies)
-- service_role bypasses RLS by default

-- Index for moderation queue
CREATE INDEX IF NOT EXISTS idx_listing_moderation_status
  ON listing_moderation (status)
  WHERE status = 'pending';
