-- ROLLBACK:
--   DROP POLICY IF EXISTS "no_public_access" ON public.jwt_claims_errors;
--   DROP POLICY IF EXISTS "no_public_access" ON public.listing_moderation;

-- F22: Two tables (jwt_claims_errors, listing_moderation) have RLS enabled but
-- zero policies. Functionally this blocks all anon/authenticated access (correct),
-- but produces no documentation of the access posture. Add explicit
-- "no public access" policies so the intent is clear in the schema.

DROP POLICY IF EXISTS "no_public_access" ON public.jwt_claims_errors;
CREATE POLICY "no_public_access" ON public.jwt_claims_errors
  FOR ALL
  USING (false);

DROP POLICY IF EXISTS "no_public_access" ON public.listing_moderation;
CREATE POLICY "no_public_access" ON public.listing_moderation
  FOR ALL
  USING (false);
