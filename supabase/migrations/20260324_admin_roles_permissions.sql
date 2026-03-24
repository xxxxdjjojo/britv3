-- Add admin_role column to profiles for granular admin permissions.
-- Default: existing admins get 'super_admin' to preserve current access.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_role text
  CHECK (admin_role IN ('super_admin', 'moderation_admin', 'ops_admin', 'dev_admin'));

UPDATE profiles SET admin_role = 'super_admin' WHERE is_admin = true AND admin_role IS NULL;

CREATE INDEX IF NOT EXISTS profiles_admin_role_idx ON profiles(admin_role) WHERE is_admin = true;
