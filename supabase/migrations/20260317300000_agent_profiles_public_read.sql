-- Allow public (anonymous) read access to agent_agency_profiles.
-- The existing "agent_agency_profiles_select" policy restricts SELECT to
-- agent_id = auth.uid(), which means only the owning agent can see their
-- own profile. Public visitors (marketplace, /agents) get zero rows.
--
-- This adds a separate public-read policy so the agents directory works.

DROP POLICY IF EXISTS "agent_agency_profiles_public_read" ON agent_agency_profiles;
CREATE POLICY "agent_agency_profiles_public_read"
  ON agent_agency_profiles FOR SELECT
  USING (true);
