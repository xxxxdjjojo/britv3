-- =============================================================================
-- 04_seller_data.sql — Seller Dashboard Seed Data
-- =============================================================================
-- Populates all seller-specific tables for Seller David's dashboard.
-- Depends on: 00_demo_users.sql, 01_properties_listings.sql
--
-- Seller David: 33333333-3333-3333-3333-333333333333
-- Agent Sarah:  55555555-5555-5555-5555-555555555555
-- Buyer James:  11111111-1111-1111-1111-111111111111
--
-- UUID pattern for this file: eeeeeeee-NNNN-0005-NNNN-eeeeeeeeeeee
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING).
-- =============================================================================

DO $$
DECLARE
  v_seller_id   UUID := '33333333-3333-3333-3333-333333333333';
  v_agent_id    UUID := '55555555-5555-5555-5555-555555555555';
  v_buyer_id    UUID := '11111111-1111-1111-1111-111111111111';
  v_now         TIMESTAMPTZ := NOW();

  -- Seller listing IDs
  v_sl1_id      UUID := 'eeeeeeee-0001-0005-0001-eeeeeeeeeeee'; -- Islington townhouse (active)
  v_sl2_id      UUID := 'eeeeeeee-0002-0005-0002-eeeeeeeeeeee'; -- Battersea flat (under_offer)
  v_sl3_id      UUID := 'eeeeeeee-0003-0005-0003-eeeeeeeeeeee'; -- Dulwich cottage (sold)

  -- Offer IDs
  v_offer_accepted UUID := 'eeeeeeee-0101-0005-0101-eeeeeeeeeeee';
  v_offer_pending  UUID := 'eeeeeeee-0102-0005-0102-eeeeeeeeeeee';
  v_offer_rejected UUID := 'eeeeeeee-0103-0005-0103-eeeeeeeeeeee';
  v_offer_counter  UUID := 'eeeeeeee-0104-0005-0104-eeeeeeeeeeee';

  v_day         DATE;
  v_hour        INTEGER;
  v_i           INTEGER;
  v_event_type  TEXT;
  v_base_views  INTEGER;
  v_is_weekend  BOOLEAN;
BEGIN

  RAISE NOTICE '=== Seller Dashboard Seed: Starting ===';

  -- ===========================================================================
  -- 1. SELLER LISTINGS (3 listings)
  -- ===========================================================================
  RAISE NOTICE 'Inserting seller_listings...';

  INSERT INTO seller_listings (
    id, seller_id, postcode, address_line_1, address_line_2, city,
    property_type, tenure, leasehold_years_remaining, bedrooms, bathrooms,
    features, council_tax_band, epc_band, photos, floor_plan_url,
    description, description_tone, key_selling_points,
    asking_price, listing_type, price_qualifier,
    ai_valuation_estimate, managed_by_agent_id,
    status, published_at, created_at, updated_at
  ) VALUES
    -- Listing 1: Islington townhouse — active, managed by Agent Sarah
    (
      v_sl1_id, v_seller_id, 'N1 2XD',
      '42 Arlington Square', NULL, 'London',
      'terraced', 'freehold', NULL, 3, 2,
      ARRAY['Period features', 'Private garden', 'Open-plan kitchen', 'Roof terrace', 'Original fireplaces'],
      'E', 'C',
      '[{"url": "/demo/islington-1.jpg", "caption": "Front elevation"}, {"url": "/demo/islington-2.jpg", "caption": "Open-plan living area"}, {"url": "/demo/islington-3.jpg", "caption": "Private garden"}]'::jsonb,
      '/demo/islington-floorplan.pdf',
      'A beautifully presented three-bedroom Georgian townhouse on one of Islington''s most desirable garden squares. The property has been lovingly restored to blend original period features with contemporary design, featuring an open-plan kitchen-diner, two reception rooms, and a private south-facing garden.',
      'professional',
      ARRAY['Grade II listed garden square', 'South-facing private garden', 'Walking distance to Angel tube', 'Excellent local schools catchment'],
      925000, 'for_sale', 'guide_price',
      910000, v_agent_id,
      'active', v_now - INTERVAL '3 weeks',
      v_now - INTERVAL '4 weeks', v_now
    ),

    -- Listing 2: Battersea flat — under_offer
    (
      v_sl2_id, v_seller_id, 'SW11 3TN',
      'Flat 8, Battersea Reach', '23 Juniper Drive', 'London',
      'flat', 'leasehold', 112, 2, 1,
      ARRAY['Balcony', 'Concierge', 'Gym access', 'Underfloor heating', 'Allocated parking'],
      'D', 'B',
      '[{"url": "/demo/battersea-1.jpg", "caption": "Living room"}, {"url": "/demo/battersea-2.jpg", "caption": "Balcony view"}]'::jsonb,
      '/demo/battersea-floorplan.pdf',
      'A stylish two-bedroom apartment in the sought-after Battersea Reach development with river glimpses from the private balcony. The apartment benefits from underfloor heating throughout, a sleek integrated kitchen, and access to residents'' gym and concierge services.',
      'warm',
      ARRAY['River glimpses from balcony', 'Residents gym & concierge', '112 years remaining on lease', 'One allocated parking space'],
      475000, 'for_sale', 'offers_over',
      460000, NULL,
      'under_offer', v_now - INTERVAL '6 weeks',
      v_now - INTERVAL '7 weeks', v_now - INTERVAL '5 days'
    ),

    -- Listing 3: Dulwich cottage — sold
    (
      v_sl3_id, v_seller_id, 'SE21 7LH',
      '8 Calton Avenue', NULL, 'London',
      'detached', 'freehold', NULL, 3, 2,
      ARRAY['Walled garden', 'Log burner', 'Wine cellar', 'Driveway parking', 'Period features'],
      'F', 'D',
      '[{"url": "/demo/dulwich-1.jpg", "caption": "Cottage exterior"}, {"url": "/demo/dulwich-2.jpg", "caption": "Walled garden"}, {"url": "/demo/dulwich-3.jpg", "caption": "Living room with log burner"}]'::jsonb,
      '/demo/dulwich-floorplan.pdf',
      'A charming detached cottage nestled in the heart of Dulwich Village with a beautiful walled garden and period features throughout. This three-bedroom home includes a wine cellar, log burner, and off-street parking — a rare find in this highly sought-after conservation area.',
      'luxury',
      ARRAY['Dulwich Village conservation area', 'Mature walled garden', 'Walking distance to Dulwich Picture Gallery', 'Catchment for top-rated schools'],
      680000, 'for_sale', 'fixed_price',
      695000, NULL,
      'sold', v_now - INTERVAL '12 weeks',
      v_now - INTERVAL '14 weeks', v_now - INTERVAL '2 weeks'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'seller_listings: 3 rows inserted';

  -- ===========================================================================
  -- 2. LISTING ANALYTICS EVENTS (30 days time-series)
  -- ===========================================================================
  RAISE NOTICE 'Inserting listing_analytics_events (30-day time series)...';

  -- Generate realistic analytics for the active Islington listing
  FOR v_day IN
    SELECT d::date FROM generate_series(
      (CURRENT_DATE - INTERVAL '30 days')::date,
      CURRENT_DATE,
      '1 day'::interval
    ) AS d
  LOOP
    v_is_weekend := EXTRACT(DOW FROM v_day) IN (0, 6);

    -- Views: 10-30 per day, more on weekends
    IF v_is_weekend THEN
      v_base_views := 18 + floor(random() * 13)::integer; -- 18-30
    ELSE
      v_base_views := 10 + floor(random() * 11)::integer; -- 10-20
    END IF;

    FOR v_i IN 1..v_base_views LOOP
      v_hour := 7 + floor(random() * 15)::integer; -- 7am-10pm
      INSERT INTO listing_analytics_events (
        id, listing_id, event_type, occurred_at, visitor_fingerprint
      ) VALUES (
        gen_random_uuid(), v_sl1_id, 'view',
        v_day + (v_hour || ' hours')::interval + (floor(random() * 60) || ' minutes')::interval,
        'fp_' || md5(v_day::text || v_i::text || 'view')
      ) ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- Saves: 2-5 per day
    FOR v_i IN 1..(2 + floor(random() * 4)::integer) LOOP
      v_hour := 8 + floor(random() * 14)::integer;
      INSERT INTO listing_analytics_events (
        id, listing_id, event_type, occurred_at, visitor_fingerprint
      ) VALUES (
        gen_random_uuid(), v_sl1_id, 'save',
        v_day + (v_hour || ' hours')::interval + (floor(random() * 60) || ' minutes')::interval,
        'fp_' || md5(v_day::text || v_i::text || 'save')
      ) ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- Enquiries: 1-3 per day
    FOR v_i IN 1..(1 + floor(random() * 3)::integer) LOOP
      v_hour := 9 + floor(random() * 12)::integer;
      INSERT INTO listing_analytics_events (
        id, listing_id, event_type, occurred_at, visitor_fingerprint
      ) VALUES (
        gen_random_uuid(), v_sl1_id, 'enquiry',
        v_day + (v_hour || ' hours')::interval + (floor(random() * 60) || ' minutes')::interval,
        'fp_' || md5(v_day::text || v_i::text || 'enquiry')
      ) ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- Phone clicks: 0-2 per day
    FOR v_i IN 1..(floor(random() * 3)::integer) LOOP
      v_hour := 9 + floor(random() * 10)::integer;
      INSERT INTO listing_analytics_events (
        id, listing_id, event_type, occurred_at, visitor_fingerprint
      ) VALUES (
        gen_random_uuid(), v_sl1_id, 'phone_click',
        v_day + (v_hour || ' hours')::interval + (floor(random() * 60) || ' minutes')::interval,
        'fp_' || md5(v_day::text || v_i::text || 'phone')
      ) ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- Email clicks: 0-1 per day
    IF random() > 0.4 THEN
      v_hour := 10 + floor(random() * 8)::integer;
      INSERT INTO listing_analytics_events (
        id, listing_id, event_type, occurred_at, visitor_fingerprint
      ) VALUES (
        gen_random_uuid(), v_sl1_id, 'email_click',
        v_day + (v_hour || ' hours')::interval + (floor(random() * 60) || ' minutes')::interval,
        'fp_' || md5(v_day::text || 'email')
      ) ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Also add some events for the under_offer listing (lower volume, tapers off)
    IF v_day < (CURRENT_DATE - INTERVAL '5 days') THEN
      FOR v_i IN 1..(5 + floor(random() * 8)::integer) LOOP
        v_hour := 8 + floor(random() * 14)::integer;
        INSERT INTO listing_analytics_events (
          id, listing_id, event_type, occurred_at, visitor_fingerprint
        ) VALUES (
          gen_random_uuid(), v_sl2_id, 'view',
          v_day + (v_hour || ' hours')::interval + (floor(random() * 60) || ' minutes')::interval,
          'fp_' || md5(v_day::text || v_i::text || 'sl2view')
        ) ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE 'listing_analytics_events: ~600+ rows inserted across 30 days';

  -- ===========================================================================
  -- 3. SELLER VIEWINGS (6 viewings)
  -- ===========================================================================
  RAISE NOTICE 'Inserting seller_viewings...';

  INSERT INTO seller_viewings (
    id, listing_id, seller_id, buyer_name, buyer_email,
    viewing_datetime, viewing_type, status, feedback, notes,
    created_at, updated_at
  ) VALUES
    -- Completed viewing 1 (past, with positive feedback)
    (
      'eeeeeeee-0201-0005-0201-eeeeeeeeeeee',
      v_sl1_id, v_seller_id,
      'Emma Richardson', 'emma.richardson@email.com',
      v_now - INTERVAL '12 days', 'in_person', 'completed',
      'Loved the garden and period features. Concerned about the council tax band. Will discuss with partner and come back within the week.',
      'First-time buyer, works in tech. Seemed very enthusiastic.',
      v_now - INTERVAL '14 days', v_now - INTERVAL '12 days'
    ),

    -- Completed viewing 2 (past, with lukewarm feedback)
    (
      'eeeeeeee-0202-0005-0202-eeeeeeeeeeee',
      v_sl1_id, v_seller_id,
      'Robert & Claire Chen', 'r.chen@gmail.com',
      v_now - INTERVAL '9 days', 'in_person', 'completed',
      'Nice property but felt the bedrooms were smaller than expected from photos. Kitchen is excellent. Unlikely to make an offer at asking price.',
      'Couple relocating from Manchester. Currently renting in Hackney.',
      v_now - INTERVAL '11 days', v_now - INTERVAL '9 days'
    ),

    -- Confirmed viewing 1 (upcoming)
    (
      'eeeeeeee-0203-0005-0203-eeeeeeeeeeee',
      v_sl1_id, v_seller_id,
      'Oliver Bennett', 'o.bennett@lawfirm.co.uk',
      v_now + INTERVAL '2 days' + INTERVAL '14 hours', 'in_person', 'confirmed',
      NULL,
      'Solicitor, budget confirmed at £1m. Cash buyer. Specifically interested in the garden square location.',
      v_now - INTERVAL '3 days', v_now - INTERVAL '1 day'
    ),

    -- Confirmed viewing 2 (upcoming, virtual)
    (
      'eeeeeeee-0204-0005-0204-eeeeeeeeeeee',
      v_sl1_id, v_seller_id,
      'Priya Sharma', 'priya.sharma@outlook.com',
      v_now + INTERVAL '4 days' + INTERVAL '11 hours', 'virtual', 'confirmed',
      NULL,
      'Currently based in Dubai, relocating to London. Wants a virtual tour before flying in for second viewing.',
      v_now - INTERVAL '2 days', v_now - INTERVAL '2 days'
    ),

    -- Pending viewing (awaiting confirmation)
    (
      'eeeeeeee-0205-0005-0205-eeeeeeeeeeee',
      v_sl1_id, v_seller_id,
      'Aisha Patel', 'aisha.p@techstartup.io',
      v_now + INTERVAL '6 days' + INTERVAL '10 hours', 'in_person', 'pending',
      NULL,
      'First-time buyer. Requested Saturday morning slot.',
      v_now - INTERVAL '1 day', v_now - INTERVAL '1 day'
    ),

    -- Cancelled viewing
    (
      'eeeeeeee-0206-0005-0206-eeeeeeeeeeee',
      v_sl2_id, v_seller_id,
      'Marcus Williams', 'marcus.w@outlook.com',
      v_now - INTERVAL '3 days', 'in_person', 'cancelled',
      NULL,
      'Cancelled — buyer purchased another property.',
      v_now - INTERVAL '8 days', v_now - INTERVAL '3 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'seller_viewings: 6 rows inserted';

  -- ===========================================================================
  -- 4. SELLER OFFERS (4 offers)
  -- ===========================================================================
  RAISE NOTICE 'Inserting seller_offers...';

  INSERT INTO seller_offers (
    id, listing_id, seller_id, buyer_name, buyer_email,
    amount, buyer_type, chain_status, chain_length, is_verified,
    conditions, solicitor_name, solicitor_email,
    status, counter_amount, counter_message,
    offered_at, responded_at, created_at, updated_at
  ) VALUES
    -- Accepted offer on the under_offer Battersea flat
    (
      v_offer_accepted, v_sl2_id, v_seller_id,
      'James Wilson', 'james.wilson@email.com',
      465000, 'mortgage', 'chain_free', 0, true,
      'Subject to mortgage approval and satisfactory survey.',
      'Helen Clarke', 'h.clarke@clarkelegal.co.uk',
      'accepted', NULL, NULL,
      v_now - INTERVAL '5 days', v_now - INTERVAL '4 days',
      v_now - INTERVAL '5 days', v_now - INTERVAL '4 days'
    ),

    -- Pending offer on the active Islington listing
    (
      v_offer_pending, v_sl1_id, v_seller_id,
      'Emma Richardson', 'emma.richardson@email.com',
      895000, 'mortgage', 'in_chain', 2, true,
      'Subject to sale of current property in Stoke Newington (under offer, expected to complete in 8 weeks).',
      'David Frost', 'd.frost@frostlaw.co.uk',
      'pending', NULL, NULL,
      v_now - INTERVAL '1 day', NULL,
      v_now - INTERVAL '1 day', v_now - INTERVAL '1 day'
    ),

    -- Rejected offer on the active Islington listing (too low)
    (
      v_offer_rejected, v_sl1_id, v_seller_id,
      'Marcus Williams', 'marcus.w@outlook.com',
      820000, 'cash', 'chain_free', 0, false,
      NULL, NULL, NULL,
      'rejected', NULL, NULL,
      v_now - INTERVAL '10 days', v_now - INTERVAL '9 days',
      v_now - INTERVAL '10 days', v_now - INTERVAL '9 days'
    ),

    -- Countered offer on the active Islington listing
    (
      v_offer_counter, v_sl1_id, v_seller_id,
      'Robert & Claire Chen', 'r.chen@gmail.com',
      880000, 'mortgage', 'in_chain', 1, true,
      'Subject to mortgage approval. Chain of one (sale of flat in Hackney, already exchanged).',
      'Sarah Nguyen', 's.nguyen@nguyenpartners.co.uk',
      'countered', 910000,
      'Thank you for your offer. Given the property''s location on Arlington Square and recent comparable sales, we would be willing to accept £910,000. The chain position is acceptable given your Hackney sale has already exchanged.',
      v_now - INTERVAL '3 days', v_now - INTERVAL '2 days',
      v_now - INTERVAL '3 days', v_now - INTERVAL '2 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'seller_offers: 4 rows inserted';

  -- ===========================================================================
  -- 5. SALE PROGRESSION STAGES (1 active sale for accepted offer)
  -- ===========================================================================
  RAISE NOTICE 'Inserting sale_progression_stages...';

  INSERT INTO sale_progression_stages (
    id, offer_id, seller_id,
    current_stage, stage_dates, expected_dates, documents,
    solicitor_name, solicitor_email, solicitor_phone,
    buyer_solicitor_name, notes,
    created_at, updated_at
  ) VALUES (
    'eeeeeeee-0301-0005-0301-eeeeeeeeeeee',
    v_offer_accepted, v_seller_id,
    3,
    jsonb_build_object(
      '1', (v_now - INTERVAL '4 days')::text,
      '2', (v_now - INTERVAL '3 days')::text,
      '3', (v_now - INTERVAL '1 day')::text
    ),
    jsonb_build_object(
      '4', (v_now + INTERVAL '7 days')::text,
      '5', (v_now + INTERVAL '14 days')::text,
      '6', (v_now + INTERVAL '21 days')::text,
      '7', (v_now + INTERVAL '28 days')::text,
      '8', (v_now + INTERVAL '42 days')::text
    ),
    '[
      {"name": "Memorandum of Sale", "type": "memo_of_sale", "uploaded_at": "2026-03-14", "status": "completed"},
      {"name": "Title Deeds", "type": "title_deeds", "uploaded_at": "2026-03-15", "status": "completed"},
      {"name": "Property Information Form (TA6)", "type": "ta6", "uploaded_at": "2026-03-15", "status": "completed"},
      {"name": "Fixtures & Fittings Form (TA10)", "type": "ta10", "uploaded_at": "2026-03-16", "status": "in_progress"},
      {"name": "Leasehold Information Pack", "type": "leasehold_pack", "uploaded_at": "2026-03-16", "status": "in_progress"}
    ]'::jsonb,
    'Michael Osei', 'm.osei@oseisolicitors.co.uk', '020 7946 0123',
    'Helen Clarke',
    'Buyer is chain-free, mortgage AIP in place. Searches ordered on 17th March. Leasehold management pack requested from freeholder — expected within 5 working days.',
    v_now - INTERVAL '4 days', v_now
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'sale_progression_stages: 1 row inserted';

  -- ===========================================================================
  -- 6. AGENT ENQUIRIES (3 enquiries from Agent Sarah)
  -- ===========================================================================
  RAISE NOTICE 'Inserting agent_enquiries...';

  INSERT INTO agent_enquiries (
    id, seller_id, agent_id, listing_id, message, status, created_at
  ) VALUES
    (
      'eeeeeeee-0401-0005-0401-eeeeeeeeeeee',
      v_seller_id, v_agent_id, v_sl1_id,
      'Hi David, I noticed your Islington townhouse has been on the market for a few weeks. I specialise in the N1 area and currently have several qualified buyers looking for period properties on garden squares. I''d love to discuss how we could help accelerate your sale — would you be free for a quick call this week?',
      'responded',
      v_now - INTERVAL '2 weeks'
    ),
    (
      'eeeeeeee-0402-0005-0402-eeeeeeeeeeee',
      v_seller_id, v_agent_id, v_sl2_id,
      'David, congratulations on accepting an offer on the Battersea flat! If you need any support with the sale progression or are considering selling your Islington property through an agent, I''m here to help. We offer a competitive 1.2% fee with no tie-in period.',
      'sent',
      v_now - INTERVAL '4 days'
    ),
    (
      'eeeeeeee-0403-0005-0403-eeeeeeeeeeee',
      v_seller_id, v_agent_id, NULL,
      'Hi David, just a quick note to let you know we''ve recently achieved record prices for two properties in Dulwich Village — both above asking price within 10 days. If you''re ever considering selling again in SE21, we''d be delighted to provide a free market appraisal.',
      'sent',
      v_now - INTERVAL '1 day'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'agent_enquiries: 3 rows inserted';

  -- ===========================================================================
  RAISE NOTICE '=== Seller Dashboard Seed: Complete ===';

END $$;
