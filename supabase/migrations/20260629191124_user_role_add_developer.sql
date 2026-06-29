-- Add 'developer' to the user_role enum so housebuilders/developers are a
-- first-class dashboard role (drives /dashboard landing, sidebar chrome, and
-- proxy role routing). developer_members still scopes data via RLS.
-- ADD VALUE is non-transactional-use-safe: the value is not used in this file.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'developer';
