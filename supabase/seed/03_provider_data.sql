-- =============================================================================
-- 03_provider_data.sql — Provider Dashboard Seed Data
-- =============================================================================
-- Populates all provider/tradesperson-specific tables for Provider Tom's dashboard.
-- Depends on: 00_demo_users.sql (users + service_provider_details)
--
-- Provider Tom:  66666666-6666-6666-6666-666666666666
-- Buyer James:   11111111-1111-1111-1111-111111111111
-- Seller David:  33333333-3333-3333-3333-333333333333
-- Landlord Mike: 44444444-4444-4444-4444-444444444444
--
-- UUID pattern for this file: dddddddd-NNNN-0004-NNNN-dddddddddddd
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING).
-- =============================================================================

DO $$
DECLARE
  v_provider_id  UUID := '66666666-6666-6666-6666-666666666666';
  v_buyer_id     UUID := '11111111-1111-1111-1111-111111111111';
  v_seller_id    UUID := '33333333-3333-3333-3333-333333333333';
  v_landlord_id  UUID := '44444444-4444-4444-4444-444444444444';
  v_now          TIMESTAMPTZ := NOW();
BEGIN

  RAISE NOTICE '=== Provider Dashboard Seed: Starting ===';

  -- ===========================================================================
  -- 1. PROVIDER SERVICES (5 services offered)
  -- ===========================================================================
  RAISE NOTICE 'Inserting provider_services...';

  INSERT INTO provider_services (
    id, provider_id, name, category, description,
    pricing_type, price_amount, created_at, updated_at
  ) VALUES
    (
      'dddddddd-0101-0004-0101-dddddddddddd',
      v_provider_id, 'Boiler Installation', 'plumber',
      'Full boiler installation including removal of old unit, fitting of new A-rated condensing boiler, and system flush. Includes 5-year warranty on workmanship.',
      'fixed', 2500.00,
      v_now - INTERVAL '6 months', v_now - INTERVAL '1 month'
    ),
    (
      'dddddddd-0102-0004-0102-dddddddddddd',
      v_provider_id, 'Emergency Plumbing', 'plumber',
      'Rapid response for burst pipes, blocked drains, leaks, and water heater failures. Available 24/7 with a typical response time under 2 hours.',
      'hourly', 85.00,
      v_now - INTERVAL '6 months', v_now - INTERVAL '2 months'
    ),
    (
      'dddddddd-0103-0004-0103-dddddddddddd',
      v_provider_id, 'Bathroom Renovation', 'plumber',
      'Complete bathroom renovation including design consultation, plumbing, tiling, and fixture installation. Free site survey and detailed quote provided.',
      'quote_on_request', NULL,
      v_now - INTERVAL '5 months', v_now - INTERVAL '3 months'
    ),
    (
      'dddddddd-0104-0004-0104-dddddddddddd',
      v_provider_id, 'Central Heating Service', 'plumber',
      'Annual gas boiler service and safety check. Includes full system inspection, pressure test, flue analysis, and Gas Safety Certificate.',
      'fixed', 120.00,
      v_now - INTERVAL '6 months', v_now - INTERVAL '1 month'
    ),
    (
      'dddddddd-0105-0004-0105-dddddddddddd',
      v_provider_id, 'Pipe Repair', 'plumber',
      'Repair and replacement of damaged, corroded, or leaking pipes. Copper, plastic, and lead pipe work. Minimal disruption guaranteed.',
      'hourly', 75.00,
      v_now - INTERVAL '4 months', v_now - INTERVAL '2 months'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Provider services inserted (5 rows).';

  -- ===========================================================================
  -- 2. SERVICE REQUESTS / RFQs (5 requests from various users)
  -- ===========================================================================
  RAISE NOTICE 'Inserting service_requests...';

  INSERT INTO service_requests (
    id, user_id, service_category, title, description,
    property_address, property_postcode,
    preferred_start_date, urgency_level,
    budget_min, budget_max,
    status, expires_at, view_count, quote_count,
    created_at, updated_at
  ) VALUES
    -- RFQ 1: Landlord Mike — boiler replacement (open)
    (
      'dddddddd-0201-0004-0201-dddddddddddd',
      v_landlord_id, 'plumber',
      'Boiler Replacement — Rental Property',
      'Old boiler in ground-floor flat has failed its annual service. Need a new A-rated condensing boiler installed ASAP. Current boiler is a 15-year-old Worcester. Gas supply is mains. Easy access in utility cupboard.',
      '14 Westbourne Grove', 'W2 5RH',
      (CURRENT_DATE + INTERVAL '5 days')::date, 'high',
      2000.00, 3000.00,
      'open', v_now + INTERVAL '14 days', 12, 0,
      v_now - INTERVAL '2 days', v_now - INTERVAL '2 days'
    ),

    -- RFQ 2: Landlord Mike — bathroom leak (quotes_received)
    (
      'dddddddd-0202-0004-0202-dddddddddddd',
      v_landlord_id, 'plumber',
      'Persistent Bathroom Leak — Tenant Reported',
      'Tenant has reported a persistent leak from the bathroom on the first floor, which is causing a damp patch on the ground-floor ceiling. Suspected issue with bath seal or waste pipe. Need diagnosis and repair.',
      '8 Maida Vale', 'W9 1RS',
      (CURRENT_DATE + INTERVAL '3 days')::date, 'high',
      100.00, 500.00,
      'quotes_received', v_now + INTERVAL '10 days', 18, 2,
      v_now - INTERVAL '5 days', v_now - INTERVAL '1 day'
    ),

    -- RFQ 3: Buyer James — central heating service (open)
    (
      'dddddddd-0203-0004-0203-dddddddddddd',
      v_buyer_id, 'plumber',
      'Full Central Heating Service — New Home',
      'Just purchased a Victorian terrace and want the entire heating system checked before winter. 3-bed property with combi boiler (approx 8 years old) and 10 radiators. Want service, power flush, and gas safety cert.',
      '27 Kensington Church Street', 'W8 4LL',
      (CURRENT_DATE + INTERVAL '14 days')::date, 'normal',
      200.00, 600.00,
      'open', v_now + INTERVAL '21 days', 8, 0,
      v_now - INTERVAL '1 day', v_now - INTERVAL '1 day'
    ),

    -- RFQ 4: Buyer James — pipe work (awarded)
    (
      'dddddddd-0204-0004-0204-dddddddddddd',
      v_buyer_id, 'plumber',
      'Kitchen Pipe Replacement',
      'Moving into a new property and the kitchen cold water pipe is old lead piping. Need it replaced with copper. Approx 8 metres of pipework from the mains stopcock to the kitchen sink and dishwasher.',
      '27 Kensington Church Street', 'W8 4LL',
      (CURRENT_DATE - INTERVAL '7 days')::date, 'normal',
      300.00, 800.00,
      'awarded', v_now + INTERVAL '7 days', 22, 3,
      v_now - INTERVAL '3 weeks', v_now - INTERVAL '1 week'
    ),

    -- RFQ 5: Seller David — pre-sale plumbing fix (expired)
    (
      'dddddddd-0205-0004-0205-dddddddddddd',
      v_seller_id, 'plumber',
      'Pre-Sale Plumbing Repairs',
      'Selling my property and the survey flagged two issues: a slow-draining bath (suspected partial blockage) and a dripping radiator valve in the master bedroom. Need both fixed before exchange.',
      '52 Lewisham Way', 'SE13 7EQ',
      (CURRENT_DATE - INTERVAL '21 days')::date, 'low',
      100.00, 350.00,
      'expired', v_now - INTERVAL '7 days', 15, 1,
      v_now - INTERVAL '4 weeks', v_now - INTERVAL '7 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Service requests inserted (5 rows).';

  -- ===========================================================================
  -- 3. QUOTES (5 quotes from Tom on RFQs)
  -- ===========================================================================
  RAISE NOTICE 'Inserting quotes...';

  INSERT INTO quotes (
    id, service_request_id, provider_id, quote_number,
    total_amount, vat_included, line_items, scope_of_work,
    estimated_duration, payment_terms, warranty_info,
    validity_date, status, version,
    created_at, updated_at
  ) VALUES
    -- Quote 1: On Landlord Mike's boiler replacement (sent, awaiting response)
    (
      'dddddddd-0301-0004-0301-dddddddddddd',
      'dddddddd-0201-0004-0201-dddddddddddd',
      v_provider_id, 'QT-2026-0047',
      2650.00, true,
      '[
        {"description": "Worcester Bosch Greenstar 30i (A-rated combi)", "quantity": 1, "unit_price": 1450.00},
        {"description": "Old boiler removal and disposal", "quantity": 1, "unit_price": 250.00},
        {"description": "Installation labour (1.5 days)", "quantity": 1, "unit_price": 600.00},
        {"description": "Magnetic filter and system flush", "quantity": 1, "unit_price": 200.00},
        {"description": "Gas Safety Certificate", "quantity": 1, "unit_price": 150.00}
      ]'::jsonb,
      'Full boiler replacement: remove existing unit, install new Worcester Bosch Greenstar 30i combi boiler, fit magnetic system filter, perform full system power flush, and issue Gas Safety Certificate.',
      '1.5 days', '50% deposit, balance on completion',
      '5-year workmanship warranty. 10-year manufacturer warranty on boiler.',
      (CURRENT_DATE + INTERVAL '14 days')::date, 'sent', 1,
      v_now - INTERVAL '1 day', v_now - INTERVAL '1 day'
    ),

    -- Quote 2: On Landlord Mike's bathroom leak (viewed by client)
    (
      'dddddddd-0302-0004-0302-dddddddddddd',
      'dddddddd-0202-0004-0202-dddddddddddd',
      v_provider_id, 'QT-2026-0044',
      285.00, true,
      '[
        {"description": "Diagnostic inspection and leak detection", "quantity": 1, "unit_price": 85.00},
        {"description": "Bath waste pipe repair/replacement", "quantity": 1, "unit_price": 120.00},
        {"description": "Re-seal bath surround", "quantity": 1, "unit_price": 80.00}
      ]'::jsonb,
      'Inspect bathroom to diagnose source of leak. Replace waste pipe section if faulty. Re-seal bath surround. Test for 24 hours to confirm fix. Note: does not include ceiling repair — recommend a plasterer for that work.',
      '3-4 hours', 'Payment on completion',
      '12-month workmanship warranty.',
      (CURRENT_DATE + INTERVAL '10 days')::date, 'viewed', 1,
      v_now - INTERVAL '4 days', v_now - INTERVAL '2 days'
    ),

    -- Quote 3: On Buyer James's heating service (draft, not yet sent)
    (
      'dddddddd-0303-0004-0303-dddddddddddd',
      'dddddddd-0203-0004-0203-dddddddddddd',
      v_provider_id, 'QT-2026-0048',
      480.00, true,
      '[
        {"description": "Annual boiler service and inspection", "quantity": 1, "unit_price": 120.00},
        {"description": "Power flush (10 radiators)", "quantity": 1, "unit_price": 280.00},
        {"description": "Gas Safety Certificate (CP12)", "quantity": 1, "unit_price": 80.00}
      ]'::jsonb,
      'Full central heating system service: boiler inspection and test, power flush all 10 radiators, bleed and balance system, issue Gas Safety Certificate (CP12).',
      '1 day', 'Payment on completion',
      '12-month workmanship warranty on flush.',
      (CURRENT_DATE + INTERVAL '21 days')::date, 'draft', 1,
      v_now - INTERVAL '6 hours', v_now - INTERVAL '6 hours'
    ),

    -- Quote 4: On Buyer James's pipe replacement (accepted — this won the job)
    (
      'dddddddd-0304-0004-0304-dddddddddddd',
      'dddddddd-0204-0004-0204-dddddddddddd',
      v_provider_id, 'QT-2026-0038',
      620.00, true,
      '[
        {"description": "Lead pipe removal (8m)", "quantity": 1, "unit_price": 150.00},
        {"description": "15mm copper pipe supply and fit (8m)", "quantity": 8, "unit_price": 35.00},
        {"description": "Isolation valve and fittings", "quantity": 3, "unit_price": 20.00},
        {"description": "Labour (1 day)", "quantity": 1, "unit_price": 150.00}
      ]'::jsonb,
      'Remove existing lead cold water pipe from mains stopcock to kitchen. Install new 15mm copper pipework with isolation valves at stopcock, under sink, and dishwasher connection. Test for leaks and restore supply.',
      '1 day', '50% deposit, balance on completion',
      '2-year workmanship warranty.',
      (CURRENT_DATE - INTERVAL '14 days')::date, 'accepted', 1,
      v_now - INTERVAL '3 weeks', v_now - INTERVAL '1 week'
    ),

    -- Quote 5: On Seller David's pre-sale fix (expired with the RFQ)
    (
      'dddddddd-0305-0004-0305-dddddddddddd',
      'dddddddd-0205-0004-0205-dddddddddddd',
      v_provider_id, 'QT-2026-0033',
      195.00, true,
      '[
        {"description": "Clear partial bath drain blockage", "quantity": 1, "unit_price": 85.00},
        {"description": "Replace radiator valve (TRV)", "quantity": 1, "unit_price": 65.00},
        {"description": "Materials and sundries", "quantity": 1, "unit_price": 45.00}
      ]'::jsonb,
      'Clear bath drain blockage using mechanical rodding. Replace dripping thermostatic radiator valve in master bedroom. Test both repairs.',
      '2-3 hours', 'Payment on completion',
      '6-month workmanship warranty.',
      (CURRENT_DATE - INTERVAL '21 days')::date, 'expired', 1,
      v_now - INTERVAL '3 weeks 4 days', v_now - INTERVAL '7 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Quotes inserted (5 rows).';

  -- ===========================================================================
  -- 4. BOOKINGS (4 bookings)
  -- ===========================================================================
  RAISE NOTICE 'Inserting bookings...';

  INSERT INTO bookings (
    id, service_request_id, quote_id, user_id, provider_id,
    booking_reference, scheduled_start_date, scheduled_end_date,
    actual_start_date, actual_end_date,
    status, cancellation_reason,
    created_at, updated_at
  ) VALUES
    -- Booking 1: Completed — pipe replacement for Buyer James
    (
      'dddddddd-0401-0004-0401-dddddddddddd',
      'dddddddd-0204-0004-0204-dddddddddddd',
      'dddddddd-0304-0004-0304-dddddddddddd',
      v_buyer_id, v_provider_id,
      'BK-2026-0091',
      (CURRENT_DATE - INTERVAL '10 days')::date,
      (CURRENT_DATE - INTERVAL '10 days')::date,
      (CURRENT_DATE - INTERVAL '10 days')::date,
      (CURRENT_DATE - INTERVAL '10 days')::date,
      'completed', NULL,
      v_now - INTERVAL '2 weeks', v_now - INTERVAL '10 days'
    ),

    -- Booking 2: In progress — bathroom leak fix for Landlord Mike
    (
      'dddddddd-0402-0004-0402-dddddddddddd',
      'dddddddd-0202-0004-0202-dddddddddddd',
      'dddddddd-0302-0004-0302-dddddddddddd',
      v_landlord_id, v_provider_id,
      'BK-2026-0098',
      CURRENT_DATE::date,
      CURRENT_DATE::date,
      CURRENT_DATE::date,
      NULL,
      'in_progress', NULL,
      v_now - INTERVAL '2 days', v_now - INTERVAL '4 hours'
    ),

    -- Booking 3: Confirmed — upcoming boiler installation for Landlord Mike
    (
      'dddddddd-0403-0004-0403-dddddddddddd',
      'dddddddd-0201-0004-0201-dddddddddddd',
      'dddddddd-0301-0004-0301-dddddddddddd',
      v_landlord_id, v_provider_id,
      'BK-2026-0102',
      (CURRENT_DATE + INTERVAL '5 days')::date,
      (CURRENT_DATE + INTERVAL '6 days')::date,
      NULL, NULL,
      'confirmed', NULL,
      v_now - INTERVAL '1 day', v_now - INTERVAL '1 day'
    ),

    -- Booking 4: Pending confirmation — heating service for Buyer James
    (
      'dddddddd-0404-0004-0404-dddddddddddd',
      'dddddddd-0203-0004-0203-dddddddddddd',
      'dddddddd-0303-0004-0303-dddddddddddd',
      v_buyer_id, v_provider_id,
      'BK-2026-0105',
      (CURRENT_DATE + INTERVAL '14 days')::date,
      (CURRENT_DATE + INTERVAL '14 days')::date,
      NULL, NULL,
      'pending_confirmation', NULL,
      v_now - INTERVAL '4 hours', v_now - INTERVAL '4 hours'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Bookings inserted (4 rows).';

  -- ===========================================================================
  -- 5. PROVIDER INVOICES (3 invoices)
  -- ===========================================================================
  RAISE NOTICE 'Inserting provider_invoices...';

  INSERT INTO provider_invoices (
    id, provider_id, booking_id, client_id,
    invoice_number, line_items, subtotal, vat_amount, total_amount,
    currency, status, due_date, paid_at, notes,
    created_at, updated_at
  ) VALUES
    -- Invoice 1: Paid — pipe replacement for Buyer James
    (
      'dddddddd-0501-0004-0501-dddddddddddd',
      v_provider_id,
      'dddddddd-0401-0004-0401-dddddddddddd',
      v_buyer_id,
      'INV-2026-0034',
      '[
        {"description": "Lead pipe removal (8m)", "quantity": 1, "unit_price": 150.00},
        {"description": "15mm copper pipe supply and fit (8m)", "quantity": 8, "unit_price": 35.00},
        {"description": "Isolation valve and fittings", "quantity": 3, "unit_price": 20.00},
        {"description": "Labour (1 day)", "quantity": 1, "unit_price": 150.00}
      ]'::jsonb,
      516.67, 103.33, 620.00, 'GBP',
      'paid',
      (CURRENT_DATE - INTERVAL '3 days')::date,
      v_now - INTERVAL '5 days',
      'Payment received via bank transfer. Thank you.',
      v_now - INTERVAL '9 days', v_now - INTERVAL '5 days'
    ),

    -- Invoice 2: Sent — bathroom leak for Landlord Mike (in-progress job)
    (
      'dddddddd-0502-0004-0502-dddddddddddd',
      v_provider_id,
      'dddddddd-0402-0004-0402-dddddddddddd',
      v_landlord_id,
      'INV-2026-0039',
      '[
        {"description": "Diagnostic inspection and leak detection", "quantity": 1, "unit_price": 85.00},
        {"description": "Bath waste pipe repair/replacement", "quantity": 1, "unit_price": 120.00},
        {"description": "Re-seal bath surround", "quantity": 1, "unit_price": 80.00}
      ]'::jsonb,
      237.50, 47.50, 285.00, 'GBP',
      'sent',
      (CURRENT_DATE + INTERVAL '14 days')::date,
      NULL,
      'Invoice sent upon completion of works. Due within 14 days.',
      v_now - INTERVAL '2 hours', v_now - INTERVAL '2 hours'
    ),

    -- Invoice 3: Draft — boiler installation for Landlord Mike (upcoming)
    (
      'dddddddd-0503-0004-0503-dddddddddddd',
      v_provider_id,
      'dddddddd-0403-0004-0403-dddddddddddd',
      v_landlord_id,
      'INV-2026-0041',
      '[
        {"description": "Worcester Bosch Greenstar 30i (A-rated combi)", "quantity": 1, "unit_price": 1450.00},
        {"description": "Old boiler removal and disposal", "quantity": 1, "unit_price": 250.00},
        {"description": "Installation labour (1.5 days)", "quantity": 1, "unit_price": 600.00},
        {"description": "Magnetic filter and system flush", "quantity": 1, "unit_price": 200.00},
        {"description": "Gas Safety Certificate", "quantity": 1, "unit_price": 150.00}
      ]'::jsonb,
      2208.33, 441.67, 2650.00, 'GBP',
      'draft',
      (CURRENT_DATE + INTERVAL '21 days')::date,
      NULL,
      'Draft — to be finalised and sent after job completion.',
      v_now - INTERVAL '1 day', v_now - INTERVAL '1 day'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Provider invoices inserted (3 rows).';

  -- ===========================================================================
  -- 6. PROVIDER REFERENCES (3 references: 2 client, 1 peer)
  -- ===========================================================================
  RAISE NOTICE 'Inserting provider_references...';

  INSERT INTO provider_references (
    id, provider_id, reference_type, referee_name, referee_email,
    referee_phone, relationship, status, reference_text,
    requested_at, submitted_at, verified_at
  ) VALUES
    -- Reference 1: Client reference (verified)
    (
      'dddddddd-0601-0004-0601-dddddddddddd',
      v_provider_id, 'client',
      'Margaret Thornton', 'm.thornton@btinternet.com',
      '07700 900550', 'Residential client — full bathroom renovation',
      'verified',
      'Tom and his team did an outstanding job on our bathroom renovation. They were punctual, tidy, and the workmanship was excellent. The project was completed on time and within budget. We would highly recommend Richards Plumbing & Heating to anyone.',
      v_now - INTERVAL '3 months', v_now - INTERVAL '2 months 20 days', v_now - INTERVAL '2 months 15 days'
    ),

    -- Reference 2: Client reference (submitted, pending verification)
    (
      'dddddddd-0602-0004-0602-dddddddddddd',
      v_provider_id, 'client',
      'Alan Bridges', 'a.bridges@gmail.com',
      '07700 900661', 'Landlord — boiler installation across 3 properties',
      'submitted',
      'We have used Richards Plumbing for boiler installations in three of our rental properties over the past year. Each job was completed professionally and to a high standard. Tom provides clear quotes with no hidden costs. Very reliable.',
      v_now - INTERVAL '6 weeks', v_now - INTERVAL '5 weeks', NULL
    ),

    -- Reference 3: Peer reference (verified)
    (
      'dddddddd-0603-0004-0603-dddddddddddd',
      v_provider_id, 'peer',
      'Steve Hargreaves', 's.hargreaves@hargreaves-electrical.co.uk',
      '07700 900772', 'Fellow tradesperson — electrician, frequent collaborator',
      'verified',
      'I have worked alongside Tom on numerous residential projects over the past 5 years. His plumbing work is always to the highest standard, and he is a pleasure to work with. He communicates well with other trades on site and is always considerate of shared work spaces.',
      v_now - INTERVAL '4 months', v_now - INTERVAL '3 months 25 days', v_now - INTERVAL '3 months 20 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Provider references inserted (3 rows).';

  -- ===========================================================================
  -- 7. PROVIDER BADGES (3 badges)
  -- ===========================================================================
  RAISE NOTICE 'Inserting provider_badges...';

  INSERT INTO provider_badges (
    id, provider_id, badge_type, badge_label, description,
    earned_at, expires_at, is_active
  ) VALUES
    (
      'dddddddd-0701-0004-0701-dddddddddddd',
      v_provider_id, 'gas_safe_registered', 'Gas Safe Registered',
      'Verified Gas Safe Register member. Legally qualified to work on gas appliances and installations.',
      v_now - INTERVAL '11 months', v_now + INTERVAL '1 month', true
    ),
    (
      'dddddddd-0702-0004-0702-dddddddddddd',
      v_provider_id, '5_star_rated', '5-Star Rated',
      'Maintained a 4.5+ star average rating across 25 or more verified reviews.',
      v_now - INTERVAL '3 months', NULL, true
    ),
    (
      'dddddddd-0703-0004-0703-dddddddddddd',
      v_provider_id, 'quick_responder', 'Quick Responder',
      'Consistently responds to new enquiries within 2 hours during business hours.',
      v_now - INTERVAL '2 months', NULL, true
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Provider badges inserted (3 rows).';

  -- ===========================================================================
  -- 8. PROVIDER ANALYTICS DAILY (30 days of data)
  -- ===========================================================================
  RAISE NOTICE 'Inserting provider_analytics_daily (30 days)...';

  INSERT INTO provider_analytics_daily (
    id, provider_id, date, profile_views, enquiries_received,
    quotes_sent, bookings_won, earnings_pence, created_at
  )
  SELECT
    -- Deterministic UUID: hash based on date offset for reproducibility
    ('dddddddd-1' || LPAD((ROW_NUMBER() OVER (ORDER BY d))::text, 3, '0') || '-0004-1' || LPAD((ROW_NUMBER() OVER (ORDER BY d))::text, 3, '0') || '-dddddddddddd')::uuid,
    v_provider_id,
    d::date,
    -- Profile views: 5-15 range with weekly pattern (higher mid-week)
    GREATEST(5, LEAST(15, (10 + (3 * sin(EXTRACT(DOW FROM d) * 0.9))  + (random() * 4 - 2))::integer)),
    -- Enquiries: 1-4 range
    GREATEST(1, LEAST(4, (2.5 + sin(EXTRACT(DOW FROM d) * 1.1) + (random() * 1.5 - 0.75))::integer)),
    -- Quotes sent: 0-2 range
    GREATEST(0, LEAST(2, (1 + sin(EXTRACT(DOW FROM d) * 0.7) * 0.8 + (random() * 1 - 0.5))::integer)),
    -- Bookings won: 0-1 range (roughly every 3 days)
    CASE WHEN random() < 0.35 THEN 1 ELSE 0 END,
    -- Earnings: 0-50000 pence (£0-£500), correlated with bookings
    CASE WHEN random() < 0.35
      THEN (15000 + (random() * 35000))::bigint
      ELSE 0
    END,
    v_now
  FROM generate_series(CURRENT_DATE - 30, CURRENT_DATE, '1 day'::interval) AS d
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Provider analytics daily inserted (31 rows).';

  -- ===========================================================================
  -- 9. PROVIDER AVAILABILITY (3 entries)
  -- ===========================================================================
  RAISE NOTICE 'Inserting provider_availability...';

  INSERT INTO provider_availability (
    id, provider_id, start_date, end_date, reason,
    recurring_rules, created_at, updated_at
  ) VALUES
    -- Holiday block
    (
      'dddddddd-0901-0004-0901-dddddddddddd',
      v_provider_id,
      (CURRENT_DATE + INTERVAL '30 days')::date,
      (CURRENT_DATE + INTERVAL '37 days')::date,
      'Annual family holiday — Lake District',
      '[]'::jsonb,
      v_now - INTERVAL '2 weeks', v_now - INTERVAL '2 weeks'
    ),

    -- Regular working hours (recurring Mon-Fri)
    (
      'dddddddd-0902-0004-0902-dddddddddddd',
      v_provider_id,
      CURRENT_DATE::date,
      (CURRENT_DATE + INTERVAL '6 months')::date,
      'Regular working hours: Mon-Fri 8am-6pm',
      '[{"days": ["monday","tuesday","wednesday","thursday","friday"], "start_time": "08:00", "end_time": "18:00"}]'::jsonb,
      v_now - INTERVAL '1 month', v_now - INTERVAL '1 month'
    ),

    -- Saturday emergency-only availability
    (
      'dddddddd-0903-0004-0903-dddddddddddd',
      v_provider_id,
      CURRENT_DATE::date,
      (CURRENT_DATE + INTERVAL '6 months')::date,
      'Saturdays: emergency calls only',
      '[{"days": ["saturday"], "start_time": "09:00", "end_time": "14:00", "emergency_only": true}]'::jsonb,
      v_now - INTERVAL '1 month', v_now - INTERVAL '1 month'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Provider availability inserted (3 rows).';

  -- ===========================================================================
  -- 10. PROVIDER RATING STATS (1 aggregate row)
  -- ===========================================================================
  RAISE NOTICE 'Inserting provider_rating_stats...';

  INSERT INTO provider_rating_stats (
    provider_id, average_rating, total_reviews,
    avg_punctuality, avg_quality, avg_value, avg_professionalism,
    count_5_star, count_4_star, count_3_star, count_2_star, count_1_star,
    total_helpful_votes, reviews_with_responses, response_rate,
    last_review_date, updated_at
  ) VALUES (
    v_provider_id,
    4.60, 28,
    4.70, 4.65, 4.50, 4.75,
    16, 8, 3, 1, 0,
    42, 24, 85.71,
    v_now - INTERVAL '3 days', v_now
  )
  ON CONFLICT (provider_id) DO NOTHING;

  RAISE NOTICE 'Provider rating stats inserted (1 row).';

  -- ===========================================================================
  RAISE NOTICE '=== Provider Dashboard Seed: Complete ===';
  RAISE NOTICE 'Summary: 5 services, 5 service requests, 5 quotes,';
  RAISE NOTICE '         4 bookings, 3 invoices, 3 references,';
  RAISE NOTICE '         3 badges, 31 analytics days, 3 availability,';
  RAISE NOTICE '         1 rating stats row.';

END $$;
