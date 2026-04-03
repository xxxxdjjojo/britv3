-- =============================================================================
-- Fix: Allow authenticated users to read any profile's display_name
-- =============================================================================
-- The original policy only allows users to read their own profile.
-- This blocks messaging from resolving sender/participant names.
-- The get_inbox_for_user RPC works (SECURITY DEFINER) but getMessages()
-- uses direct queries with RLS, so other users' names resolve to "Unknown User".
--
-- Solution: Add a permissive SELECT policy for authenticated users to read
-- any non-deleted profile. display_name is not sensitive data.
-- =============================================================================

CREATE POLICY "Authenticated users can view profiles"
  ON profiles
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
