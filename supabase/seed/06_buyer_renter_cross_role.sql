-- =============================================================================
-- 06_buyer_renter_cross_role.sql — Buyer/Renter + Cross-Role Seed Data
-- =============================================================================
-- Populates buyer/renter dashboard tables AND cross-role tables:
--   saved_properties, saved_searches, viewing_history, viewing_slots,
--   viewings, offers, moving_checklist_items, conversations, messages,
--   conversation_read_status, subscriptions, consent_records, reviews
--
-- Depends on: 00_demo_users.sql, 01_properties_listings.sql,
--             02_agent_data.sql, 03_provider_data.sql
--
-- Demo Users:
--   Buyer James:   11111111-1111-1111-1111-111111111111
--   Renter Sophie: 22222222-2222-2222-2222-222222222222
--   Seller David:  33333333-3333-3333-3333-333333333333
--   Landlord Mike: 44444444-4444-4444-4444-444444444444
--   Agent Sarah:   55555555-5555-5555-5555-555555555555
--   Provider Tom:  66666666-6666-6666-6666-666666666666
--   Admin:         77777777-7777-7777-7777-777777777777
--
-- UUID pattern for this file: 99999999-NNNN-0007-NNNN-999999999999
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING).
-- =============================================================================

DO $$
DECLARE
  v_buyer_id     UUID := '11111111-1111-1111-1111-111111111111';
  v_renter_id    UUID := '22222222-2222-2222-2222-222222222222';
  v_seller_id    UUID := '33333333-3333-3333-3333-333333333333';
  v_landlord_id  UUID := '44444444-4444-4444-4444-444444444444';
  v_agent_id     UUID := '55555555-5555-5555-5555-555555555555';
  v_provider_id  UUID := '66666666-6666-6666-6666-666666666666';
  v_admin_id     UUID := '77777777-7777-7777-7777-777777777777';
  v_now          TIMESTAMPTZ := NOW();

  -- Listing IDs (from 01_properties_listings.sql)
  v_listing1     UUID := 'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb';
  v_listing2     UUID := 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb';
  v_listing3     UUID := 'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb';
  v_listing9     UUID := 'bbbbbbbb-0009-0009-0009-bbbbbbbbbbbb';
  v_listing10    UUID := 'bbbbbbbb-0010-0010-0010-bbbbbbbbbbbb';
  v_listing14    UUID := 'bbbbbbbb-0014-0014-0014-bbbbbbbbbbbb';
  v_listing15    UUID := 'bbbbbbbb-0015-0015-0015-bbbbbbbbbbbb';

  -- Offer IDs
  v_offer1       UUID := '99999999-0101-0007-0101-999999999999';
  v_offer2       UUID := '99999999-0102-0007-0102-999999999999';

  -- Conversation IDs
  v_conv1        UUID := '99999999-0301-0007-0301-999999999999';
  v_conv2        UUID := '99999999-0302-0007-0302-999999999999';
  v_conv3        UUID := '99999999-0303-0007-0303-999999999999';

  -- Viewing slot IDs
  v_slot1        UUID := '99999999-0201-0007-0201-999999999999';
  v_slot2        UUID := '99999999-0202-0007-0202-999999999999';
  v_slot3        UUID := '99999999-0203-0007-0203-999999999999';
  v_slot4        UUID := '99999999-0204-0007-0204-999999999999';

  -- Completed booking from 03_provider_data.sql (pipe replacement for Buyer James)
  v_completed_booking UUID := 'dddddddd-0401-0004-0401-dddddddddddd';
BEGIN

  RAISE NOTICE '=== Buyer/Renter + Cross-Role Seed: Starting ===';

  -- ===========================================================================
  -- 1. SAVED PROPERTIES (6 saves)
  -- ===========================================================================
  RAISE NOTICE 'Inserting saved_properties...';

  INSERT INTO saved_properties (
    id, user_id, listing_id, notes, created_at
  ) VALUES
    -- Buyer James saves 4 listings
    (
      '99999999-0001-0007-0001-999999999999',
      v_buyer_id, v_listing1,
      'Dream home — Victorian in Kensington. Made an offer!',
      v_now - INTERVAL '3 weeks'
    ),
    (
      '99999999-0002-0007-0002-999999999999',
      v_buyer_id, v_listing2,
      'Beautiful Primrose Hill flat, great location but slightly over budget.',
      v_now - INTERVAL '2 weeks'
    ),
    (
      '99999999-0003-0007-0003-999999999999',
      v_buyer_id, v_listing3,
      'Clapham semi — good for the family, needs viewing.',
      v_now - INTERVAL '10 days'
    ),
    (
      '99999999-0004-0007-0004-999999999999',
      v_buyer_id, v_listing14,
      'Shoreditch loft — stylish but might be too small.',
      v_now - INTERVAL '5 days'
    ),

    -- Renter Sophie saves 2 rental listings
    (
      '99999999-0005-0007-0005-999999999999',
      v_renter_id, v_listing9,
      'Canary Riverside — lovely 2-bed, river views. Top pick.',
      v_now - INTERVAL '1 week'
    ),
    (
      '99999999-0006-0007-0006-999999999999',
      v_renter_id, v_listing10,
      'Whitechapel 2-bed — good value, close to work.',
      v_now - INTERVAL '4 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Saved properties inserted (6 rows).';

  -- ===========================================================================
  -- 2. SAVED SEARCHES (3 searches)
  -- ===========================================================================
  RAISE NOTICE 'Inserting saved_searches...';

  INSERT INTO saved_searches (
    id, user_id, name, filters, alerts_enabled, alert_frequency,
    new_results_count, created_at, updated_at
  ) VALUES
    (
      '99999999-0011-0007-0011-999999999999',
      v_buyer_id, '3-bed Kensington',
      '{
        "location": "Kensington, London",
        "min_bedrooms": 3,
        "max_price": 2500000,
        "property_type": ["detached", "semi_detached"],
        "radius_miles": 2
      }'::jsonb,
      true, 'daily', 3,
      v_now - INTERVAL '4 weeks', v_now - INTERVAL '1 day'
    ),
    (
      '99999999-0012-0007-0012-999999999999',
      v_buyer_id, 'Family homes under £1M',
      '{
        "location": "South London",
        "min_bedrooms": 3,
        "max_price": 1000000,
        "property_type": ["semi_detached", "terraced"],
        "has_garden": true
      }'::jsonb,
      true, 'weekly', 7,
      v_now - INTERVAL '2 weeks', v_now - INTERVAL '3 days'
    ),
    (
      '99999999-0013-0007-0013-999999999999',
      v_renter_id, '2-bed flats Notting Hill',
      '{
        "location": "Notting Hill, London",
        "min_bedrooms": 2,
        "max_bedrooms": 2,
        "max_price_pcm": 2500,
        "property_type": ["flat"],
        "listing_type": "rent"
      }'::jsonb,
      true, 'instant', 1,
      v_now - INTERVAL '10 days', v_now - INTERVAL '2 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Saved searches inserted (3 rows).';

  -- ===========================================================================
  -- 3. VIEWING HISTORY (5 viewed properties for Buyer James)
  -- ===========================================================================
  RAISE NOTICE 'Inserting viewing_history...';

  -- Note: id is BIGSERIAL, so we do NOT provide it. ON CONFLICT on unique pair.
  INSERT INTO viewing_history (user_id, listing_id, viewed_at) VALUES
    (v_buyer_id, v_listing1,  v_now - INTERVAL '4 weeks'),
    (v_buyer_id, v_listing2,  v_now - INTERVAL '3 weeks'),
    (v_buyer_id, v_listing3,  v_now - INTERVAL '2 weeks'),
    (v_buyer_id, v_listing14, v_now - INTERVAL '1 week'),
    (v_buyer_id, v_listing15, v_now - INTERVAL '3 days')
  ON CONFLICT (user_id, listing_id) DO NOTHING;

  RAISE NOTICE 'Viewing history inserted (5 rows).';

  -- ===========================================================================
  -- 4. VIEWING SLOTS (4 slots by Agent Sarah)
  -- ===========================================================================
  -- Note: This is the buyer-facing viewing_slots table, separate from
  -- agent_viewing_slots in 02_agent_data.sql.
  RAISE NOTICE 'Inserting viewing_slots...';

  INSERT INTO viewing_slots (
    id, listing_id, agent_id, start_time, end_time, type, status,
    created_at, updated_at
  ) VALUES
    -- Slot 1: Past completed in-person viewing of Property 1
    (
      v_slot1, v_listing1, v_agent_id,
      v_now - INTERVAL '5 weeks' + INTERVAL '10 hours',
      v_now - INTERVAL '5 weeks' + INTERVAL '11 hours',
      'in_person', 'booked',
      v_now - INTERVAL '6 weeks', v_now - INTERVAL '5 weeks'
    ),
    -- Slot 2: Past completed virtual viewing of Property 3
    (
      v_slot2, v_listing3, v_agent_id,
      v_now - INTERVAL '2 weeks' + INTERVAL '14 hours',
      v_now - INTERVAL '2 weeks' + INTERVAL '15 hours',
      'virtual', 'booked',
      v_now - INTERVAL '3 weeks', v_now - INTERVAL '2 weeks'
    ),
    -- Slot 3: Upcoming in-person viewing of Property 2 (next week)
    (
      v_slot3, v_listing2, v_agent_id,
      v_now + INTERVAL '5 days' + INTERVAL '10 hours',
      v_now + INTERVAL '5 days' + INTERVAL '11 hours',
      'in_person', 'booked',
      v_now - INTERVAL '2 days', v_now - INTERVAL '2 days'
    ),
    -- Slot 4: Available slot on Property 14 (open for booking)
    (
      v_slot4, v_listing14, v_agent_id,
      v_now + INTERVAL '7 days' + INTERVAL '15 hours',
      v_now + INTERVAL '7 days' + INTERVAL '16 hours',
      'in_person', 'available',
      v_now - INTERVAL '1 day', v_now - INTERVAL '1 day'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Viewing slots inserted (4 rows).';

  -- ===========================================================================
  -- 5. VIEWINGS (2 viewings for Buyer James)
  -- ===========================================================================
  RAISE NOTICE 'Inserting viewings...';

  INSERT INTO viewings (
    id, user_id, slot_id, listing_id, status, type, notes,
    created_at, updated_at
  ) VALUES
    -- Viewing 1: Completed — Kensington Gardens (Property 1)
    (
      '99999999-0211-0007-0211-999999999999',
      v_buyer_id, v_slot1, v_listing1,
      'completed', 'in_person',
      'Loved the property. Original features outstanding. Garden a real bonus. Made an offer afterwards.',
      v_now - INTERVAL '5 weeks', v_now - INTERVAL '5 weeks'
    ),
    -- Viewing 2: Confirmed — upcoming Primrose Hill (Property 2)
    (
      '99999999-0212-0007-0212-999999999999',
      v_buyer_id, v_slot3, v_listing2,
      'confirmed', 'in_person',
      'Second viewing to compare with Kensington property.',
      v_now - INTERVAL '2 days', v_now - INTERVAL '2 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Viewings inserted (2 rows).';

  -- ===========================================================================
  -- 6. OFFERS (2 buyer offers)
  -- ===========================================================================
  RAISE NOTICE 'Inserting offers...';

  INSERT INTO offers (
    id, user_id, listing_id, agent_id, amount, conditions,
    solicitor_name, solicitor_email,
    status, created_at, updated_at
  ) VALUES
    -- Offer 1: On Property 1 — solicitors_instructed (matches "under_offer" story)
    (
      v_offer1,
      v_buyer_id, v_listing1, v_agent_id,
      120000000, -- £1,200,000 in pence (matches agent_offers record)
      'Subject to survey and satisfactory searches. Mortgage agreed in principle with Barclays.',
      'Rebecca Hart', 'r.hart@hartandsons.co.uk',
      'solicitors_instructed',
      v_now - INTERVAL '3 weeks', v_now - INTERVAL '1 week'
    ),
    -- Offer 2: On Property 2 — withdrawn (decided to focus on Property 1)
    (
      v_offer2,
      v_buyer_id, v_listing2, v_agent_id,
      85000000, -- £850,000 in pence
      'Cash buyer, no chain.',
      'Rebecca Hart', 'r.hart@hartandsons.co.uk',
      'withdrawn',
      v_now - INTERVAL '4 weeks', v_now - INTERVAL '3 weeks'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Offers inserted (2 rows).';

  -- ===========================================================================
  -- 7. MOVING CHECKLIST ITEMS (5 items for Buyer James, linked to offer 1)
  -- ===========================================================================
  RAISE NOTICE 'Inserting moving_checklist_items...';

  INSERT INTO moving_checklist_items (
    id, user_id, offer_id, title, description, offer_stage,
    is_completed, completed_at, sort_order, created_at, updated_at
  ) VALUES
    (
      '99999999-0221-0007-0221-999999999999',
      v_buyer_id, v_offer1,
      'Instruct solicitor',
      'Appoint conveyancing solicitor to handle the purchase. Rebecca Hart at Hart & Sons confirmed.',
      'solicitors_instructed', true, v_now - INTERVAL '2 weeks', 1,
      v_now - INTERVAL '3 weeks', v_now - INTERVAL '2 weeks'
    ),
    (
      '99999999-0222-0007-0222-999999999999',
      v_buyer_id, v_offer1,
      'Arrange survey',
      'Book a full building survey (Level 3) given the property age (1885). Contact RICS-accredited surveyor.',
      'solicitors_instructed', true, v_now - INTERVAL '10 days', 2,
      v_now - INTERVAL '3 weeks', v_now - INTERVAL '10 days'
    ),
    (
      '99999999-0223-0007-0223-999999999999',
      v_buyer_id, v_offer1,
      'Apply for mortgage',
      'Submit full mortgage application to Barclays. AIP already in place for £1.5M.',
      'searches', false, NULL, 3,
      v_now - INTERVAL '3 weeks', v_now - INTERVAL '3 weeks'
    ),
    (
      '99999999-0224-0007-0224-999999999999',
      v_buyer_id, v_offer1,
      'Arrange home insurance',
      'Get buildings and contents insurance quotes. Required before exchange of contracts.',
      'exchange', false, NULL, 4,
      v_now - INTERVAL '3 weeks', v_now - INTERVAL '3 weeks'
    ),
    (
      '99999999-0225-0007-0225-999999999999',
      v_buyer_id, v_offer1,
      'Book removal company',
      'Get at least 3 quotes from removal companies. Consider packing service for fragile items.',
      'completion', false, NULL, 5,
      v_now - INTERVAL '3 weeks', v_now - INTERVAL '3 weeks'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Moving checklist items inserted (5 rows).';

  -- ===========================================================================
  -- 8. CONVERSATIONS + MESSAGES (3 conversations)
  -- ===========================================================================
  RAISE NOTICE 'Inserting conversations...';

  INSERT INTO conversations (
    id, participant_1_id, participant_2_id,
    context_type, context_id, last_message_at, created_at
  ) VALUES
    -- Conv 1: Buyer James <-> Agent Sarah about Property 1
    (
      v_conv1, v_buyer_id, v_agent_id,
      'listing', v_listing1,
      v_now - INTERVAL '2 days',
      v_now - INTERVAL '3 weeks'
    ),
    -- Conv 2: Landlord Mike <-> Provider Tom about plumbing booking
    (
      v_conv2, v_landlord_id, v_provider_id,
      'booking', 'dddddddd-0402-0004-0402-dddddddddddd',
      v_now - INTERVAL '1 day',
      v_now - INTERVAL '3 days'
    ),
    -- Conv 3: Seller David <-> Agent Sarah about listing management
    (
      v_conv3, v_seller_id, v_agent_id,
      'general', NULL,
      v_now - INTERVAL '4 days',
      v_now - INTERVAL '2 weeks'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Conversations inserted (3 rows).';

  -- ---------------------------------------------------------------------------
  -- MESSAGES
  -- ---------------------------------------------------------------------------
  RAISE NOTICE 'Inserting messages...';

  INSERT INTO messages (
    id, conversation_id, sender_id, content, attachment_url, created_at
  ) VALUES
    -- Conv 1: Buyer James <-> Agent Sarah (4 messages about Property 1)
    (
      '99999999-0311-0007-0311-999999999999',
      v_conv1, v_buyer_id,
      'Hi Sarah, I absolutely loved the Kensington property. The original Victorian features are stunning. Would you be able to arrange a second viewing so my wife can see it?',
      NULL, v_now - INTERVAL '3 weeks'
    ),
    (
      '99999999-0312-0007-0312-999999999999',
      v_conv1, v_agent_id,
      'Hello James! So glad you enjoyed the viewing. Of course — I have a slot available this Thursday at 2pm or Saturday at 11am. The vendor is quite flexible. Shall I pencil one in?',
      NULL, v_now - INTERVAL '3 weeks' + INTERVAL '2 hours'
    ),
    (
      '99999999-0313-0007-0313-999999999999',
      v_conv1, v_buyer_id,
      'Saturday at 11am works perfectly. Also, we are very keen to make an offer. Our solicitor Rebecca Hart is ready to go. What is the vendor expecting?',
      NULL, v_now - INTERVAL '2 weeks'
    ),
    (
      '99999999-0314-0007-0314-999999999999',
      v_conv1, v_agent_id,
      'Excellent! Saturday 11am is booked. Regarding an offer — the vendor has had some interest but nothing formal yet. I would suggest coming in strong given the market. Happy to discuss strategy when we meet.',
      NULL, v_now - INTERVAL '2 days'
    ),

    -- Conv 2: Landlord Mike <-> Provider Tom (3 messages about plumbing)
    (
      '99999999-0321-0007-0321-999999999999',
      v_conv2, v_landlord_id,
      'Hi Tom, the tenant at Whitechapel has reported a bathroom leak again. It is the same unit you fixed the pipes on last month. Could you take a look today if possible?',
      NULL, v_now - INTERVAL '3 days'
    ),
    (
      '99999999-0322-0007-0322-999999999999',
      v_conv2, v_provider_id,
      'Hi Mike, I can be there by 2pm today. It might be a joint issue on the pipe we repaired — I will bring replacement fittings just in case. Will update you once I have assessed it.',
      NULL, v_now - INTERVAL '3 days' + INTERVAL '1 hour'
    ),
    (
      '99999999-0323-0007-0323-999999999999',
      v_conv2, v_landlord_id,
      'That is brilliant Tom, thank you. The tenant will be home all afternoon. Key code is the same. Let me know what you find.',
      NULL, v_now - INTERVAL '1 day'
    ),

    -- Conv 3: Seller David <-> Agent Sarah (2 messages about listing management)
    (
      '99999999-0331-0007-0331-999999999999',
      v_conv3, v_seller_id,
      'Sarah, I noticed the photos on our Hampstead listing look a bit dated. Any chance we could get new ones taken? The garden looks much better now after the landscaping.',
      NULL, v_now - INTERVAL '2 weeks'
    ),
    (
      '99999999-0332-0007-0332-999999999999',
      v_conv3, v_agent_id,
      'Absolutely David! Great idea — fresh photos always help. I will book our photographer for next week. The new garden will definitely add appeal. I will also update the description to highlight the recent landscaping work.',
      NULL, v_now - INTERVAL '4 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Messages inserted (9 rows).';

  -- ---------------------------------------------------------------------------
  -- CONVERSATION READ STATUS
  -- ---------------------------------------------------------------------------
  RAISE NOTICE 'Inserting conversation_read_status...';

  INSERT INTO conversation_read_status (conversation_id, user_id, last_read_at) VALUES
    -- Conv 1: Both have read
    (v_conv1, v_buyer_id,  v_now - INTERVAL '1 day'),
    (v_conv1, v_agent_id,  v_now - INTERVAL '2 days'),
    -- Conv 2: Landlord read, Provider has unread
    (v_conv2, v_landlord_id, v_now - INTERVAL '1 day'),
    (v_conv2, v_provider_id, v_now - INTERVAL '2 days'),
    -- Conv 3: Agent read, Seller has unread
    (v_conv3, v_seller_id,  v_now - INTERVAL '1 week'),
    (v_conv3, v_agent_id,   v_now - INTERVAL '4 days')
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RAISE NOTICE 'Conversation read status inserted (6 rows).';

  -- ===========================================================================
  -- 9. SUBSCRIPTIONS (3 active subscriptions)
  -- ===========================================================================
  RAISE NOTICE 'Inserting subscriptions...';

  INSERT INTO subscriptions (
    id, user_id, stripe_subscription_id, stripe_customer_id,
    status, plan_name, price_amount, currency,
    current_period_end, cancel_at_period_end, role,
    created_at, updated_at
  ) VALUES
    -- Agent Sarah: Agent Performance plan (free tier)
    (
      '99999999-0401-0007-0401-999999999999',
      v_agent_id,
      'sub_demo_agent_sarah_001', 'cus_demo_agent_sarah',
      'active', 'Agent Performance', 0, 'gbp',
      v_now + INTERVAL '30 days', false, 'agent',
      v_now - INTERVAL '6 months', v_now - INTERVAL '1 day'
    ),
    -- Provider Tom: Provider Pro plan (£97/month)
    (
      '99999999-0402-0007-0402-999999999999',
      v_provider_id,
      'sub_demo_provider_tom_001', 'cus_demo_provider_tom',
      'active', 'Provider Pro', 9700, 'gbp',
      v_now + INTERVAL '25 days', false, 'provider',
      v_now - INTERVAL '3 months', v_now - INTERVAL '5 days'
    ),
    -- Landlord Mike: Landlord Standard plan (£19/month)
    (
      '99999999-0403-0007-0403-999999999999',
      v_landlord_id,
      'sub_demo_landlord_mike_001', 'cus_demo_landlord_mike',
      'active', 'Landlord Standard', 1900, 'gbp',
      v_now + INTERVAL '18 days', false, 'landlord',
      v_now - INTERVAL '4 months', v_now - INTERVAL '12 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Subscriptions inserted (3 rows).';

  -- ===========================================================================
  -- 10. CONSENT RECORDS (all 7 users × 3 consent types = 21 records)
  -- ===========================================================================
  RAISE NOTICE 'Inserting consent_records...';

  INSERT INTO consent_records (
    id, user_id, consent_type, granted, created_at, updated_at
  ) VALUES
    -- Buyer James: analytics=true, marketing=true, third_party=false
    ('99999999-0501-0007-0501-999999999999', v_buyer_id,    'analytics',   true,  v_now - INTERVAL '6 months', v_now - INTERVAL '6 months'),
    ('99999999-0502-0007-0502-999999999999', v_buyer_id,    'marketing',   true,  v_now - INTERVAL '6 months', v_now - INTERVAL '6 months'),
    ('99999999-0503-0007-0503-999999999999', v_buyer_id,    'third_party', false, v_now - INTERVAL '6 months', v_now - INTERVAL '6 months'),

    -- Renter Sophie: analytics=true, marketing=false, third_party=false
    ('99999999-0504-0007-0504-999999999999', v_renter_id,   'analytics',   true,  v_now - INTERVAL '5 months', v_now - INTERVAL '5 months'),
    ('99999999-0505-0007-0505-999999999999', v_renter_id,   'marketing',   false, v_now - INTERVAL '5 months', v_now - INTERVAL '5 months'),
    ('99999999-0506-0007-0506-999999999999', v_renter_id,   'third_party', false, v_now - INTERVAL '5 months', v_now - INTERVAL '5 months'),

    -- Seller David: analytics=true, marketing=true, third_party=false
    ('99999999-0507-0007-0507-999999999999', v_seller_id,   'analytics',   true,  v_now - INTERVAL '4 months', v_now - INTERVAL '4 months'),
    ('99999999-0508-0007-0508-999999999999', v_seller_id,   'marketing',   true,  v_now - INTERVAL '4 months', v_now - INTERVAL '4 months'),
    ('99999999-0509-0007-0509-999999999999', v_seller_id,   'third_party', false, v_now - INTERVAL '4 months', v_now - INTERVAL '4 months'),

    -- Landlord Mike: analytics=true, marketing=true, third_party=false
    ('99999999-0510-0007-0510-999999999999', v_landlord_id, 'analytics',   true,  v_now - INTERVAL '4 months', v_now - INTERVAL '4 months'),
    ('99999999-0511-0007-0511-999999999999', v_landlord_id, 'marketing',   true,  v_now - INTERVAL '4 months', v_now - INTERVAL '4 months'),
    ('99999999-0512-0007-0512-999999999999', v_landlord_id, 'third_party', false, v_now - INTERVAL '4 months', v_now - INTERVAL '4 months'),

    -- Agent Sarah: analytics=true, marketing=true, third_party=true
    ('99999999-0513-0007-0513-999999999999', v_agent_id,    'analytics',   true,  v_now - INTERVAL '6 months', v_now - INTERVAL '6 months'),
    ('99999999-0514-0007-0514-999999999999', v_agent_id,    'marketing',   true,  v_now - INTERVAL '6 months', v_now - INTERVAL '6 months'),
    ('99999999-0515-0007-0515-999999999999', v_agent_id,    'third_party', true,  v_now - INTERVAL '6 months', v_now - INTERVAL '6 months'),

    -- Provider Tom: analytics=true, marketing=true, third_party=false
    ('99999999-0516-0007-0516-999999999999', v_provider_id, 'analytics',   true,  v_now - INTERVAL '3 months', v_now - INTERVAL '3 months'),
    ('99999999-0517-0007-0517-999999999999', v_provider_id, 'marketing',   true,  v_now - INTERVAL '3 months', v_now - INTERVAL '3 months'),
    ('99999999-0518-0007-0518-999999999999', v_provider_id, 'third_party', false, v_now - INTERVAL '3 months', v_now - INTERVAL '3 months'),

    -- Admin: analytics=true, marketing=false, third_party=false
    ('99999999-0519-0007-0519-999999999999', v_admin_id,    'analytics',   true,  v_now - INTERVAL '6 months', v_now - INTERVAL '6 months'),
    ('99999999-0520-0007-0520-999999999999', v_admin_id,    'marketing',   false, v_now - INTERVAL '6 months', v_now - INTERVAL '6 months'),
    ('99999999-0521-0007-0521-999999999999', v_admin_id,    'third_party', false, v_now - INTERVAL '6 months', v_now - INTERVAL '6 months')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Consent records inserted (21 rows).';

  -- ===========================================================================
  -- 11. REVIEWS (1 review for completed booking)
  -- ===========================================================================
  -- Only 1 completed booking exists: dddddddd-0401-0004-0401 (Buyer James pipe repair)
  -- booking_id is UNIQUE in reviews, so only 1 review per booking.
  RAISE NOTICE 'Inserting reviews...';

  INSERT INTO reviews (
    id, booking_id, provider_id, reviewer_id,
    overall_rating, punctuality_rating, quality_rating,
    value_rating, professionalism_rating,
    title, review_text, moderation_status,
    provider_response, provider_response_at,
    created_at, updated_at
  ) VALUES
    (
      '99999999-0601-0007-0601-999999999999',
      v_completed_booking, v_provider_id, v_buyer_id,
      5, 5, 5, 4, 5,
      'Excellent pipe repair — fast and professional',
      'Tom arrived within the hour and diagnosed the issue immediately. Replaced the corroded section of pipe under the kitchen sink with minimal disruption. Very tidy worker — cleaned up completely afterwards. Only minor note is the price was slightly higher than expected, but the quality of work justified it. Would definitely recommend and use again.',
      'approved',
      'Thank you so much James! Really glad we could sort it quickly for you. The pipe was in worse shape than expected which added a bit to the cost, but it is all solid now with a 12-month guarantee. Do not hesitate to reach out if you need anything else.',
      v_now - INTERVAL '8 days',
      v_now - INTERVAL '9 days', v_now - INTERVAL '8 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Reviews inserted (1 row).';

  -- ===========================================================================
  RAISE NOTICE '=== Buyer/Renter + Cross-Role Seed: Complete ===';
  RAISE NOTICE '  Summary:';
  RAISE NOTICE '    6 saved_properties, 3 saved_searches, 5 viewing_history,';
  RAISE NOTICE '    4 viewing_slots, 2 viewings, 2 offers,';
  RAISE NOTICE '    5 moving_checklist_items, 3 conversations, 9 messages,';
  RAISE NOTICE '    6 conversation_read_status, 3 subscriptions,';
  RAISE NOTICE '    21 consent_records, 1 review';

END $$;
