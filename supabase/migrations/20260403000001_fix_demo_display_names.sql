-- =============================================================================
-- Fix: Update demo user display_name values
-- =============================================================================
-- The on_auth_user_created trigger auto-creates profiles with email-prefix
-- display names. The seed's ON CONFLICT DO NOTHING didn't overwrite them.
-- This migration corrects the display_name for all 7 demo users.
-- =============================================================================

UPDATE profiles SET display_name = 'James Wilson'   WHERE id = '11111111-1111-1111-1111-111111111111' AND display_name != 'James Wilson';
UPDATE profiles SET display_name = 'Sophie Chen'    WHERE id = '22222222-2222-2222-2222-222222222222' AND display_name != 'Sophie Chen';
UPDATE profiles SET display_name = 'David Okonkwo'  WHERE id = '33333333-3333-3333-3333-333333333333' AND display_name != 'David Okonkwo';
UPDATE profiles SET display_name = 'Mike Thompson'  WHERE id = '44444444-4444-4444-4444-444444444444' AND display_name != 'Mike Thompson';
UPDATE profiles SET display_name = 'Sarah Mitchell' WHERE id = '55555555-5555-5555-5555-555555555555' AND display_name != 'Sarah Mitchell';
UPDATE profiles SET display_name = 'Tom Richards'   WHERE id = '66666666-6666-6666-6666-666666666666' AND display_name != 'Tom Richards';
UPDATE profiles SET display_name = 'Admin User'     WHERE id = '77777777-7777-7777-7777-777777777777' AND display_name != 'Admin User';
