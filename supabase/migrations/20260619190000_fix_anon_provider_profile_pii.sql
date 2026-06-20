-- ============================================================================
-- Security fix: lock down anonymous read of public.profiles to safe columns.
--
-- 20260617000000_public_provider_profile_visibility added a row-level policy
-- ("Anon can view verified provider profiles") so logged-out visitors can see
-- the public provider directory. But RLS is ROW-level, not column-level, and
-- anon held a table-wide SELECT grant — so anon could read EVERY column of a
-- verified provider's profile row, including phone, is_admin, admin_role,
-- ban_reason, banned_at, suspended_until, and the *_preferences/privacy_settings
-- JSON. (Flagged HIGH by security review.)
--
-- Fix: keep the verified-row policy (the public marketplace policies on
-- service_provider_details / provider_services / provider_badges /
-- provider_portfolio_items depend on an EXISTS check against profiles, so anon
-- must still be able to read the verification columns), but REVOKE the blanket
-- SELECT and re-grant ONLY the safe public-directory columns. PII and internal
-- fields are no longer reachable. A public_provider_profiles view gives the app
-- an explicit, sanctioned anon read surface for directory cards.
--
-- NOTE: anon also holds INSERT/UPDATE/DELETE/TRUNCATE grants on profiles
-- (latent — no permissive anon write policy exists today). Out of scope here;
-- recommend revoking those separately after confirming no anon write flow.
-- ============================================================================

-- Column-scoped anon SELECT: safe directory fields + the columns the dependent
-- verified-provider policies read (id, provider_verification_status, deleted_at).
revoke select on public.profiles from anon;
grant select (
  id,
  display_name,
  avatar_url,
  provider_verification_status,
  verification_level,
  deleted_at
) on public.profiles to anon;

-- Sanctioned public read surface for provider directory cards. security_invoker
-- so it respects the caller's RLS + column grants (no privilege escalation);
-- it can only ever expose the safe columns selected here.
create or replace view public.public_provider_profiles
  with (security_invoker = true) as
  select
    id,
    display_name,
    avatar_url,
    provider_verification_status,
    verification_level
  from public.profiles
  where provider_verification_status = 'verified'::provider_verification_status
    and deleted_at is null;

grant select on public.public_provider_profiles to anon, authenticated;
