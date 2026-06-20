-- =============================================================================
-- verify_trader_seed.sql — assert the trader test seed loaded correctly.
-- Exits non-zero (ON_ERROR_STOP) on any failed invariant. Run AFTER seeding:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed/verify_trader_seed.sql
-- =============================================================================

\echo '--- Seed provider count per category (expect 10 each, 20 categories) ---'
SELECT unnest(services)::text AS category, count(*)
FROM service_provider_details WHERE slug LIKE 'seed-%'
GROUP BY 1 ORDER BY 1;

\echo '--- Verification-state spread (expect all 5 states present) ---'
SELECT p.provider_verification_status, count(*)
FROM profiles p JOIN service_provider_details s ON s.user_id = p.id
WHERE s.slug LIKE 'seed-%'
GROUP BY 1 ORDER BY 2 DESC;

\echo '--- Invariants (each must report ok) ---'
DO $$
DECLARE n INT;
BEGIN
  SELECT count(*) INTO n FROM service_provider_details WHERE slug LIKE 'seed-%';
  ASSERT n = 200, format('expected 200 seed providers, got %s', n);

  SELECT count(DISTINCT unnest_cat) INTO n FROM (
    SELECT unnest(services)::text AS unnest_cat FROM service_provider_details WHERE slug LIKE 'seed-%') t;
  ASSERT n = 20, format('expected 20 categories, got %s', n);

  SELECT count(DISTINCT provider_verification_status) INTO n
  FROM profiles p JOIN service_provider_details s ON s.user_id = p.id WHERE s.slug LIKE 'seed-%';
  ASSERT n = 5, format('expected 5 verification states, got %s', n);

  -- at least some providers cross the >5-review marketplace gate
  SELECT count(*) INTO n FROM provider_rating_stats r
  JOIN service_provider_details s ON s.user_id = r.provider_id
  WHERE s.slug LIKE 'seed-%' AND r.total_reviews > 5;
  ASSERT n >= 20, format('expected >=20 providers with >5 reviews, got %s', n);

  -- documents exist in all three review states
  SELECT count(DISTINCT verification_status) INTO n FROM provider_documents d
  JOIN service_provider_details s ON s.user_id = d.user_id WHERE s.slug LIKE 'seed-%';
  ASSERT n >= 3, format('expected >=3 document states, got %s', n);

  -- open leads exist
  SELECT count(*) INTO n FROM service_requests WHERE id IN (SELECT md5('seed:rfq:'||g)::uuid FROM generate_series(1,40) g);
  ASSERT n = 40, format('expected 40 seed leads, got %s', n);

  RAISE NOTICE 'ALL INVARIANTS OK: 200 providers, 20 categories, 5 states, review-gate met, docs+leads present.';
END $$;
