-- Fix ISSUE-002: Emma Thompson's active_role was incorrectly set to 'landlord'.

-- Fix Emma specifically
UPDATE profiles
SET active_role = 'homebuyer'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'emma.thompson@test.britestate.co.uk'
)
AND active_role != 'homebuyer';

-- Ensure the homebuyer role exists in user_roles for Emma
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'homebuyer'
FROM auth.users u
WHERE u.email = 'emma.thompson@test.britestate.co.uk'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = 'homebuyer'
);
