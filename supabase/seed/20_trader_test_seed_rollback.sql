-- =============================================================================
-- 20_trader_test_seed_rollback.sql — remove ALL trader test seed data
-- =============================================================================
-- Every seeded record traces back to an auth.users row whose email lives in the
-- seed domain. The LIKE '%@seed.%test' pattern matches the current
-- @seed.truedeed.test domain and any pre-rebrand seed domain.
--
-- NOTE: several child FKs into profiles/auth.users are RESTRICT / NO ACTION
-- (NOT cascade) — notably service_provider_details.user_id, provider_documents,
-- service_requests.user_id, bookings.user_id, reviews.reviewer_id. So a single
-- delete on auth.users is blocked. We delete children in dependency order first,
-- then the users (which cascades profiles + user_roles, and spd cascades its own
-- children: provider_services / badges / portfolio / rating_stats).
--
-- Run:  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed/20_trader_test_seed_rollback.sql
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _seed_uids ON COMMIT DROP AS
  SELECT id FROM auth.users
  WHERE email LIKE '%@seed.%test';

\echo 'Seed users to remove:'
SELECT count(*) AS seed_users FROM _seed_uids;

-- Children with RESTRICT/NO-ACTION FKs to profiles/auth.users (delete first).
DELETE FROM reviews
  WHERE reviewer_id IN (SELECT id FROM _seed_uids)
     OR provider_id  IN (SELECT id FROM _seed_uids);
DELETE FROM bookings
  WHERE user_id     IN (SELECT id FROM _seed_uids)
     OR provider_id IN (SELECT id FROM _seed_uids);
DELETE FROM service_requests   WHERE user_id IN (SELECT id FROM _seed_uids);
DELETE FROM provider_documents WHERE user_id IN (SELECT id FROM _seed_uids);
-- spd delete cascades provider_services / provider_badges /
-- provider_portfolio_items / provider_rating_stats.
DELETE FROM service_provider_details WHERE user_id IN (SELECT id FROM _seed_uids);

-- Finally the users — cascades profiles + user_roles.
DELETE FROM auth.users WHERE id IN (SELECT id FROM _seed_uids);

\echo 'Remaining seed providers (expect 0):'
SELECT count(*) AS remaining_providers FROM service_provider_details WHERE slug LIKE 'seed-%';
\echo 'Remaining seed users (expect 0):'
SELECT count(*) AS remaining_users FROM auth.users
  WHERE email LIKE '%@seed.%test';

COMMIT;
