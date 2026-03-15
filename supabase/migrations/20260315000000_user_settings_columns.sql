-- Add privacy and notification preference JSONB columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
    "visibility": "public",
    "search_indexing": true,
    "anonymous_analytics": true,
    "third_party_marketing": false,
    "active_status": true,
    "last_viewed_visible": false
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "email_messages": true,
    "email_listings": true,
    "email_viewings": true,
    "email_marketing": false,
    "push_messages": true,
    "push_listings": true,
    "sms_alerts": false
  }'::jsonb;

-- Backup codes table for TOTP recovery
CREATE TABLE IF NOT EXISTS user_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_backup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own backup codes"
  ON user_backup_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users cannot directly insert/delete via client — only server-side API routes
-- (No INSERT/DELETE RLS policies — use service role in API routes)

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_backup_codes_user_id
  ON user_backup_codes(user_id);

-- Supabase Storage: create avatars bucket
-- Run this via Supabase dashboard OR use the JS client in a seed script:
-- supabase.storage.createBucket('avatars', { public: true, fileSizeLimit: 819200 })
--
-- Then set Storage RLS policies:
-- Allow users to upload to their own folder:
--   CREATE POLICY "Users upload own avatar"
--     ON storage.objects FOR INSERT
--     WITH CHECK (
--       bucket_id = 'avatars'
--       AND auth.uid()::text = (storage.foldername(name))[1]
--     );
-- Allow users to update/delete their own avatar:
--   CREATE POLICY "Users update own avatar"
--     ON storage.objects FOR UPDATE
--     USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
--   CREATE POLICY "Users delete own avatar"
--     ON storage.objects FOR DELETE
--     USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
