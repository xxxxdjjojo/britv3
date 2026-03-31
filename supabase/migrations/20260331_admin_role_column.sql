-- Add admin_role column to profiles for RBAC admin dashboard access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT NULL;

-- Set existing admin user to super_admin
UPDATE profiles SET admin_role = 'super_admin' WHERE is_admin = true AND admin_role IS NULL;
