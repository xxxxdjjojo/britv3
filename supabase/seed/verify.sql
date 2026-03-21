-- Britestate Demo Data Verification
-- Run after seeding to verify data is accessible

-- =========================================
-- Part 1: Raw row counts (bypasses RLS since run as postgres)
-- =========================================
SELECT '=== RAW ROW COUNTS ===' AS section;

SELECT 'auth.users (demo)' AS table_name,
  COUNT(*) AS row_count
FROM auth.users
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777'
);

-- Key table row counts
SELECT 'profiles' AS table_name, COUNT(*) FROM profiles WHERE id IN ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555','66666666-6666-6666-6666-666666666666','77777777-7777-7777-7777-777777777777')
UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles WHERE user_id IN ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555','66666666-6666-6666-6666-666666666666','77777777-7777-7777-7777-777777777777')
UNION ALL SELECT 'properties', COUNT(*) FROM properties
UNION ALL SELECT 'listings', COUNT(*) FROM listings
UNION ALL SELECT 'property_media', COUNT(*) FROM property_media
UNION ALL SELECT 'agent_leads', COUNT(*) FROM agent_leads
UNION ALL SELECT 'agent_viewing_slots', COUNT(*) FROM agent_viewing_slots
UNION ALL SELECT 'agent_offers', COUNT(*) FROM agent_offers
UNION ALL SELECT 'agent_sale_progressions', COUNT(*) FROM agent_sale_progressions
UNION ALL SELECT 'agent_crm_clients', COUNT(*) FROM agent_crm_clients
UNION ALL SELECT 'agent_commissions', COUNT(*) FROM agent_commissions
UNION ALL SELECT 'service_requests', COUNT(*) FROM service_requests
UNION ALL SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'provider_invoices', COUNT(*) FROM provider_invoices
UNION ALL SELECT 'provider_services', COUNT(*) FROM provider_services
UNION ALL SELECT 'provider_analytics_daily', COUNT(*) FROM provider_analytics_daily
UNION ALL SELECT 'provider_references', COUNT(*) FROM provider_references
UNION ALL SELECT 'provider_badges', COUNT(*) FROM provider_badges
UNION ALL SELECT 'provider_rating_stats', COUNT(*) FROM provider_rating_stats
UNION ALL SELECT 'seller_listings', COUNT(*) FROM seller_listings
UNION ALL SELECT 'seller_viewings', COUNT(*) FROM seller_viewings
UNION ALL SELECT 'seller_offers', COUNT(*) FROM seller_offers
UNION ALL SELECT 'listing_analytics_events', COUNT(*) FROM listing_analytics_events
UNION ALL SELECT 'tenancies', COUNT(*) FROM tenancies
UNION ALL SELECT 'tenant_applications', COUNT(*) FROM tenant_applications
UNION ALL SELECT 'maintenance_requests', COUNT(*) FROM maintenance_requests
UNION ALL SELECT 'financial_entries', COUNT(*) FROM financial_entries
UNION ALL SELECT 'deposit_registrations', COUNT(*) FROM deposit_registrations
UNION ALL SELECT 'inventory_reports', COUNT(*) FROM inventory_reports
UNION ALL SELECT 'property_documents', COUNT(*) FROM property_documents
UNION ALL SELECT 'saved_properties', COUNT(*) FROM saved_properties
UNION ALL SELECT 'saved_searches', COUNT(*) FROM saved_searches
UNION ALL SELECT 'viewings', COUNT(*) FROM viewings
UNION ALL SELECT 'offers', COUNT(*) FROM offers
UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL SELECT 'consent_records', COUNT(*) FROM consent_records
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
ORDER BY table_name;

-- =========================================
-- Part 2: Verification checks
-- =========================================
SELECT '=== VERIFICATION ===' AS section;

DO $$
DECLARE
  v_count INTEGER;
  v_pass BOOLEAN := TRUE;
BEGIN
  -- 1. Check demo users exist
  SELECT COUNT(*) INTO v_count FROM auth.users
  WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    '77777777-7777-7777-7777-777777777777'
  );
  IF v_count < 7 THEN RAISE WARNING 'FAIL: Only % demo users found (expected 7)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: All 7 demo users exist in auth.users';
  END IF;

  -- 2. Check Agent Sarah specifically
  SELECT COUNT(*) INTO v_count FROM auth.users WHERE id = '55555555-5555-5555-5555-555555555555';
  IF v_count = 0 THEN RAISE WARNING 'FAIL: Agent Sarah not found in auth.users'; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: Agent Sarah exists';
  END IF;

  -- 3. Check properties
  SELECT COUNT(*) INTO v_count FROM properties;
  IF v_count < 15 THEN RAISE WARNING 'FAIL: Only % properties found (expected 20+)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % properties found', v_count;
  END IF;

  -- 4. Check active listings
  SELECT COUNT(*) INTO v_count FROM listings WHERE status = 'active';
  IF v_count < 5 THEN RAISE WARNING 'FAIL: Only % active listings (expected 10+)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % active listings found', v_count;
  END IF;

  -- 5. Check agent leads
  SELECT COUNT(*) INTO v_count FROM agent_leads WHERE agent_id = '55555555-5555-5555-5555-555555555555';
  IF v_count < 5 THEN RAISE WARNING 'FAIL: Only % agent leads (expected 8+)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % agent leads found', v_count;
  END IF;

  -- 6. Check seller listings
  SELECT COUNT(*) INTO v_count FROM seller_listings WHERE seller_id = '33333333-3333-3333-3333-333333333333';
  IF v_count < 2 THEN RAISE WARNING 'FAIL: Only % seller listings (expected 3)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % seller listings found', v_count;
  END IF;

  -- 7. Check provider services
  SELECT COUNT(*) INTO v_count FROM provider_services WHERE provider_id = '66666666-6666-6666-6666-666666666666';
  IF v_count < 3 THEN RAISE WARNING 'FAIL: Only % provider services (expected 5+)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % provider services found', v_count;
  END IF;

  -- 8. Check tenancies for landlord
  SELECT COUNT(*) INTO v_count FROM tenancies WHERE landlord_id = '44444444-4444-4444-4444-444444444444';
  IF v_count < 2 THEN RAISE WARNING 'FAIL: Only % tenancies (expected 3+)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % tenancies found', v_count;
  END IF;

  -- 9. Check maintenance requests
  SELECT COUNT(*) INTO v_count FROM maintenance_requests;
  IF v_count < 3 THEN RAISE WARNING 'FAIL: Only % maintenance requests (expected 5+)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % maintenance requests found', v_count;
  END IF;

  -- 10. Check conversations
  SELECT COUNT(*) INTO v_count FROM conversations;
  IF v_count < 2 THEN RAISE WARNING 'FAIL: Only % conversations (expected 3)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % conversations found', v_count;
  END IF;

  -- 11. Check messages in conversations
  SELECT COUNT(*) INTO v_count FROM messages;
  IF v_count < 5 THEN RAISE WARNING 'FAIL: Only % messages (expected 8+)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % messages found', v_count;
  END IF;

  -- 12. Check saved properties for buyer
  SELECT COUNT(*) INTO v_count FROM saved_properties WHERE user_id = '11111111-1111-1111-1111-111111111111';
  IF v_count < 2 THEN RAISE WARNING 'FAIL: Only % saved properties for buyer (expected 3+)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % saved properties for buyer', v_count;
  END IF;

  -- 13. Check consent records (GDPR compliance)
  SELECT COUNT(*) INTO v_count FROM consent_records;
  IF v_count < 5 THEN RAISE WARNING 'FAIL: Only % consent records (expected 7+)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % consent records found', v_count;
  END IF;

  -- 14. Check subscriptions
  SELECT COUNT(*) INTO v_count FROM subscriptions;
  IF v_count < 2 THEN RAISE WARNING 'FAIL: Only % subscriptions (expected 3+)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % subscriptions found', v_count;
  END IF;

  -- 15. Check reviews
  SELECT COUNT(*) INTO v_count FROM reviews;
  IF v_count < 1 THEN RAISE WARNING 'FAIL: Only % reviews (expected 1+)', v_count; v_pass := FALSE;
  ELSE RAISE NOTICE 'PASS: % reviews found', v_count;
  END IF;

  -- Final result
  IF v_pass THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  ALL 15 VERIFICATIONS PASSED';
    RAISE NOTICE '========================================';
  ELSE
    RAISE WARNING '';
    RAISE WARNING '========================================';
    RAISE WARNING '  SOME VERIFICATIONS FAILED';
    RAISE WARNING '  Check warnings above for details';
    RAISE WARNING '========================================';
  END IF;
END $$;
