-- =============================================================================
-- 02_agent_data.sql — Agent Dashboard Seed Data
-- =============================================================================
-- Populates all agent-specific tables for Agent Sarah's dashboard.
-- Depends on: 00_demo_users.sql, 01_properties_listings.sql
--
-- Agent Sarah: 55555555-5555-5555-5555-555555555555
-- Buyer James: 11111111-1111-1111-1111-111111111111
-- Seller David: 33333333-3333-3333-3333-333333333333
--
-- UUID pattern for this file: cccccccc-NNNN-0003-NNNN-cccccccccccc
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING).
-- =============================================================================

DO $$
DECLARE
  v_agent_id    UUID := '55555555-5555-5555-5555-555555555555';
  v_buyer_id    UUID := '11111111-1111-1111-1111-111111111111';
  v_seller_id   UUID := '33333333-3333-3333-3333-333333333333';
  v_now         TIMESTAMPTZ := NOW();
BEGIN

  RAISE NOTICE '=== Agent Dashboard Seed: Starting ===';

  -- ===========================================================================
  -- 1. AGENT LEADS (10 leads across all stages)
  -- ===========================================================================
  RAISE NOTICE 'Inserting agent_leads...';

  INSERT INTO agent_leads (
    id, agent_id, property_id, contact_name, contact_email, contact_phone,
    stage, source, assigned_to, notes, created_at, updated_at
  ) VALUES
    -- 3 new_enquiry leads
    (
      'cccccccc-0001-0003-0001-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb',
      'Emma Richardson', 'emma.richardson@email.com', '07700 900123',
      'new_enquiry', 'website', NULL,
      'Enquired about Primrose Hill property via website contact form.',
      v_now - INTERVAL '2 days', v_now - INTERVAL '2 days'
    ),
    (
      'cccccccc-0002-0003-0002-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0004-0004-0004-bbbbbbbbbbbb',
      'Robert Chen', 'r.chen@gmail.com', '07700 900456',
      'new_enquiry', 'portal', NULL,
      'Found Tower Bridge penthouse on Rightmove. Cash buyer, relocating from Singapore.',
      v_now - INTERVAL '1 day', v_now - INTERVAL '1 day'
    ),
    (
      'cccccccc-0003-0003-0003-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0019-0019-0019-bbbbbbbbbbbb',
      'Priya Sharma', 'priya.sharma@outlook.com', NULL,
      'new_enquiry', 'referral', NULL,
      'Referred by existing client. Interested in Dulwich Village property.',
      v_now - INTERVAL '6 hours', v_now - INTERVAL '6 hours'
    ),

    -- 2 qualified leads
    (
      'cccccccc-0004-0003-0004-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0005-0005-0005-bbbbbbbbbbbb',
      'Oliver Bennett', 'o.bennett@lawfirm.co.uk', '07700 900789',
      'qualified', 'phone', v_agent_id,
      'Solicitor, budget confirmed at £1.2m. AIP from Barclays. Looking for family home in Surrey.',
      v_now - INTERVAL '5 days', v_now - INTERVAL '3 days'
    ),
    (
      'cccccccc-0005-0003-0005-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0014-0014-0014-bbbbbbbbbbbb',
      'Aisha Patel', 'aisha.p@techstartup.io', '07700 900234',
      'qualified', 'walk_in', v_agent_id,
      'First-time buyer. Help to Buy eligible. Pre-approved for £600k. Works in Shoreditch.',
      v_now - INTERVAL '8 days', v_now - INTERVAL '4 days'
    ),

    -- 2 viewing_booked leads
    (
      'cccccccc-0006-0003-0006-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb',
      'James Wilson', 'james.wilson@email.com', '07700 100100',
      'viewing_booked', 'website', v_agent_id,
      'Viewing booked for Primrose Hill. Chain-free, mortgage agreed in principle.',
      v_now - INTERVAL '10 days', v_now - INTERVAL '3 days'
    ),
    (
      'cccccccc-0007-0003-0007-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0015-0015-0015-bbbbbbbbbbbb',
      'Hannah Morgan', 'h.morgan@yahoo.co.uk', '07700 900567',
      'viewing_booked', 'portal', v_agent_id,
      'Second viewing arranged for Battersea maisonette. Very keen buyer.',
      v_now - INTERVAL '12 days', v_now - INTERVAL '2 days'
    ),

    -- 1 offer_made lead
    (
      'cccccccc-0008-0003-0008-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0016-0016-0016-bbbbbbbbbbbb',
      'Marcus Taylor', 'm.taylor@investcorp.com', '07700 900890',
      'offer_made', 'referral', v_agent_id,
      'Offered £870,000 on Hove detached. Awaiting vendor response.',
      v_now - INTERVAL '14 days', v_now - INTERVAL '1 day'
    ),

    -- 2 closed leads
    (
      'cccccccc-0009-0003-0009-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb',
      'James Wilson', 'james.wilson@email.com', '07700 100100',
      'closed', 'website', v_agent_id,
      'Offer accepted on Kensington property. Sale progressing — solicitors instructed.',
      v_now - INTERVAL '6 weeks', v_now - INTERVAL '2 weeks'
    ),
    (
      'cccccccc-0010-0003-0010-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb',
      'Daniel & Sarah Foster', 'fosters@gmail.com', '07700 900345',
      'closed', 'phone', v_agent_id,
      'Completed sale on Clapham Common property. Excellent outcome.',
      v_now - INTERVAL '8 weeks', v_now - INTERVAL '4 weeks'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Agent leads inserted (10 rows).';

  -- ===========================================================================
  -- 2. AGENT LEAD ACTIVITIES (2-3 per lead)
  -- ===========================================================================
  RAISE NOTICE 'Inserting agent_lead_activities...';

  INSERT INTO agent_lead_activities (
    id, lead_id, actor_id, activity_type, description, metadata, created_at
  ) VALUES
    -- Lead 1 (Emma Richardson - new_enquiry)
    (
      'cccccccc-0101-0003-0101-cccccccccccc',
      'cccccccc-0001-0003-0001-cccccccccccc', v_agent_id,
      'note_added', 'Initial enquiry received via website. Wants 3-bed in NW London.',
      '{"channel": "website"}'::jsonb,
      v_now - INTERVAL '2 days'
    ),
    (
      'cccccccc-0102-0003-0102-cccccccccccc',
      'cccccccc-0001-0003-0001-cccccccccccc', v_agent_id,
      'email_sent', 'Sent property details and brochure for Primrose Hill listing.',
      '{"template": "property_details"}'::jsonb,
      v_now - INTERVAL '1 day'
    ),

    -- Lead 2 (Robert Chen - new_enquiry)
    (
      'cccccccc-0103-0003-0103-cccccccccccc',
      'cccccccc-0002-0003-0002-cccccccccccc', v_agent_id,
      'note_added', 'International buyer relocating from Singapore. Cash purchase.',
      '{"buyer_type": "cash", "origin": "international"}'::jsonb,
      v_now - INTERVAL '1 day'
    ),
    (
      'cccccccc-0104-0003-0104-cccccccccccc',
      'cccccccc-0002-0003-0002-cccccccccccc', v_agent_id,
      'phone_call', 'Discussed property details and local area. Will arrange virtual viewing.',
      '{"duration_minutes": 25}'::jsonb,
      v_now - INTERVAL '12 hours'
    ),

    -- Lead 4 (Oliver Bennett - qualified)
    (
      'cccccccc-0105-0003-0105-cccccccccccc',
      'cccccccc-0004-0003-0004-cccccccccccc', v_agent_id,
      'phone_call', 'Initial call. Confirmed budget and requirements. AIP from Barclays.',
      '{"duration_minutes": 15}'::jsonb,
      v_now - INTERVAL '5 days'
    ),
    (
      'cccccccc-0106-0003-0106-cccccccccccc',
      'cccccccc-0004-0003-0004-cccccccccccc', v_agent_id,
      'email_sent', 'Sent shortlist of 3 properties matching criteria.',
      '{"properties_sent": 3}'::jsonb,
      v_now - INTERVAL '4 days'
    ),
    (
      'cccccccc-0107-0003-0107-cccccccccccc',
      'cccccccc-0004-0003-0004-cccccccccccc', v_agent_id,
      'viewing_arranged', 'Viewing booked for Guildford cottage this Saturday.',
      '{"property_id": "aaaaaaaa-0005-0005-0005-aaaaaaaaaaaa"}'::jsonb,
      v_now - INTERVAL '3 days'
    ),

    -- Lead 5 (Aisha Patel - qualified)
    (
      'cccccccc-0108-0003-0108-cccccccccccc',
      'cccccccc-0005-0003-0005-cccccccccccc', v_agent_id,
      'note_added', 'Walk-in enquiry. First-time buyer, very motivated.',
      '{"buyer_type": "first_time"}'::jsonb,
      v_now - INTERVAL '8 days'
    ),
    (
      'cccccccc-0109-0003-0109-cccccccccccc',
      'cccccccc-0005-0003-0005-cccccccccccc', v_agent_id,
      'email_sent', 'Sent details of Shoreditch new build flat.',
      '{"template": "property_details"}'::jsonb,
      v_now - INTERVAL '6 days'
    ),

    -- Lead 6 (James Wilson - viewing_booked)
    (
      'cccccccc-0110-0003-0110-cccccccccccc',
      'cccccccc-0006-0003-0006-cccccccccccc', v_agent_id,
      'phone_call', 'Discussed property and arranged viewing for Primrose Hill.',
      '{"duration_minutes": 10}'::jsonb,
      v_now - INTERVAL '7 days'
    ),
    (
      'cccccccc-0111-0003-0111-cccccccccccc',
      'cccccccc-0006-0003-0006-cccccccccccc', v_agent_id,
      'viewing_arranged', 'Viewing confirmed for Saturday 10am at Primrose Hill.',
      '{"viewing_date": "upcoming"}'::jsonb,
      v_now - INTERVAL '3 days'
    ),

    -- Lead 7 (Hannah Morgan - viewing_booked)
    (
      'cccccccc-0112-0003-0112-cccccccccccc',
      'cccccccc-0007-0003-0007-cccccccccccc', v_agent_id,
      'viewing_arranged', 'First viewing completed. Buyer very positive.',
      '{"viewing_number": 1}'::jsonb,
      v_now - INTERVAL '8 days'
    ),
    (
      'cccccccc-0113-0003-0113-cccccccccccc',
      'cccccccc-0007-0003-0007-cccccccccccc', v_agent_id,
      'viewing_arranged', 'Second viewing arranged to measure for furniture.',
      '{"viewing_number": 2}'::jsonb,
      v_now - INTERVAL '2 days'
    ),

    -- Lead 8 (Marcus Taylor - offer_made)
    (
      'cccccccc-0114-0003-0114-cccccccccccc',
      'cccccccc-0008-0003-0008-cccccccccccc', v_agent_id,
      'viewing_arranged', 'Viewing completed. Very enthusiastic about the property.',
      NULL,
      v_now - INTERVAL '10 days'
    ),
    (
      'cccccccc-0115-0003-0115-cccccccccccc',
      'cccccccc-0008-0003-0008-cccccccccccc', v_agent_id,
      'offer_received', 'Offer of £870,000 received. Below asking (£895,000). Vendor considering.',
      '{"amount_pence": 87000000, "asking_price_pence": 89500000}'::jsonb,
      v_now - INTERVAL '3 days'
    ),

    -- Lead 9 (James Wilson - closed / Kensington)
    (
      'cccccccc-0116-0003-0116-cccccccccccc',
      'cccccccc-0009-0003-0009-cccccccccccc', v_agent_id,
      'offer_received', 'Offer of £1,200,000 received on Kensington property.',
      '{"amount_pence": 120000000}'::jsonb,
      v_now - INTERVAL '5 weeks'
    ),
    (
      'cccccccc-0117-0003-0117-cccccccccccc',
      'cccccccc-0009-0003-0009-cccccccccccc', v_agent_id,
      'note_added', 'Offer accepted by vendor. Instructing solicitors.',
      NULL,
      v_now - INTERVAL '4 weeks'
    ),
    (
      'cccccccc-0118-0003-0118-cccccccccccc',
      'cccccccc-0009-0003-0009-cccccccccccc', v_agent_id,
      'note_added', 'Memorandum of sale sent. Both parties have solicitors instructed.',
      NULL,
      v_now - INTERVAL '3 weeks'
    ),

    -- Lead 10 (Daniel & Sarah Foster - closed / Clapham)
    (
      'cccccccc-0119-0003-0119-cccccccccccc',
      'cccccccc-0010-0003-0010-cccccccccccc', v_agent_id,
      'offer_received', 'Offer of £780,000 received and accepted.',
      '{"amount_pence": 78000000}'::jsonb,
      v_now - INTERVAL '7 weeks'
    ),
    (
      'cccccccc-0120-0003-0120-cccccccccccc',
      'cccccccc-0010-0003-0010-cccccccccccc', v_agent_id,
      'note_added', 'Sale completed. Keys handed over.',
      NULL,
      v_now - INTERVAL '4 weeks'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Agent lead activities inserted (22 rows).';

  -- ===========================================================================
  -- 3. AGENT VIEWING SLOTS (12 slots over next 2 weeks + 4 past)
  -- ===========================================================================
  RAISE NOTICE 'Inserting agent_viewing_slots...';

  INSERT INTO agent_viewing_slots (
    id, agent_id, property_id, start_time, end_time,
    is_booked, booked_by, notes, created_at
  ) VALUES
    -- Past viewing slots (for feedback records)
    (
      'cccccccc-0201-0003-0201-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb',
      v_now - INTERVAL '5 weeks' + INTERVAL '10 hours',
      v_now - INTERVAL '5 weeks' + INTERVAL '10 hours 30 minutes',
      true, v_buyer_id, 'Buyer James — Kensington viewing', v_now - INTERVAL '6 weeks'
    ),
    (
      'cccccccc-0202-0003-0202-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb',
      v_now - INTERVAL '7 weeks' + INTERVAL '14 hours',
      v_now - INTERVAL '7 weeks' + INTERVAL '14 hours 30 minutes',
      true, NULL, 'Daniel & Sarah Foster — Clapham viewing', v_now - INTERVAL '8 weeks'
    ),
    (
      'cccccccc-0203-0003-0203-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb',
      v_now - INTERVAL '2 weeks' + INTERVAL '11 hours',
      v_now - INTERVAL '2 weeks' + INTERVAL '11 hours 30 minutes',
      true, NULL, 'Hannah Morgan — Primrose Hill viewing', v_now - INTERVAL '3 weeks'
    ),
    (
      'cccccccc-0204-0003-0204-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0016-0016-0016-bbbbbbbbbbbb',
      v_now - INTERVAL '10 days' + INTERVAL '15 hours',
      v_now - INTERVAL '10 days' + INTERVAL '15 hours 30 minutes',
      true, NULL, 'Marcus Taylor — Hove detached viewing', v_now - INTERVAL '2 weeks'
    ),

    -- Future viewing slots (next 2 weeks) — booked
    (
      'cccccccc-0205-0003-0205-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb',
      v_now + INTERVAL '2 days' + INTERVAL '10 hours',
      v_now + INTERVAL '2 days' + INTERVAL '10 hours 30 minutes',
      true, v_buyer_id, 'Buyer James viewing Primrose Hill', v_now - INTERVAL '1 day'
    ),
    (
      'cccccccc-0206-0003-0206-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0004-0004-0004-bbbbbbbbbbbb',
      v_now + INTERVAL '3 days' + INTERVAL '14 hours',
      v_now + INTERVAL '3 days' + INTERVAL '14 hours 30 minutes',
      true, NULL, 'Robert Chen — virtual viewing of Tower Bridge penthouse', v_now - INTERVAL '12 hours'
    ),
    (
      'cccccccc-0207-0003-0207-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0015-0015-0015-bbbbbbbbbbbb',
      v_now + INTERVAL '4 days' + INTERVAL '11 hours',
      v_now + INTERVAL '4 days' + INTERVAL '11 hours 30 minutes',
      true, NULL, 'Hannah Morgan — second viewing of Battersea maisonette', v_now - INTERVAL '2 days'
    ),
    (
      'cccccccc-0208-0003-0208-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0005-0005-0005-bbbbbbbbbbbb',
      v_now + INTERVAL '5 days' + INTERVAL '10 hours',
      v_now + INTERVAL '5 days' + INTERVAL '10 hours 30 minutes',
      true, NULL, 'Oliver Bennett — Guildford cottage viewing', v_now - INTERVAL '3 days'
    ),

    -- Future viewing slots — available (not booked)
    (
      'cccccccc-0209-0003-0209-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb',
      v_now + INTERVAL '6 days' + INTERVAL '14 hours',
      v_now + INTERVAL '6 days' + INTERVAL '14 hours 30 minutes',
      false, NULL, NULL, v_now
    ),
    (
      'cccccccc-0210-0003-0210-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0019-0019-0019-bbbbbbbbbbbb',
      v_now + INTERVAL '7 days' + INTERVAL '10 hours',
      v_now + INTERVAL '7 days' + INTERVAL '10 hours 30 minutes',
      false, NULL, NULL, v_now
    ),
    (
      'cccccccc-0211-0003-0211-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0014-0014-0014-bbbbbbbbbbbb',
      v_now + INTERVAL '8 days' + INTERVAL '15 hours',
      v_now + INTERVAL '8 days' + INTERVAL '15 hours 30 minutes',
      false, NULL, NULL, v_now
    ),
    (
      'cccccccc-0212-0003-0212-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0004-0004-0004-bbbbbbbbbbbb',
      v_now + INTERVAL '10 days' + INTERVAL '11 hours',
      v_now + INTERVAL '10 days' + INTERVAL '11 hours 30 minutes',
      false, NULL, NULL, v_now
    ),
    (
      'cccccccc-0213-0003-0213-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0021-0021-0021-bbbbbbbbbbbb',
      v_now + INTERVAL '11 days' + INTERVAL '10 hours',
      v_now + INTERVAL '11 days' + INTERVAL '10 hours 30 minutes',
      false, NULL, NULL, v_now
    ),
    (
      'cccccccc-0214-0003-0214-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0017-0017-0017-bbbbbbbbbbbb',
      v_now + INTERVAL '12 days' + INTERVAL '14 hours',
      v_now + INTERVAL '12 days' + INTERVAL '14 hours 30 minutes',
      false, NULL, NULL, v_now
    ),
    (
      'cccccccc-0215-0003-0215-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0013-0013-0013-bbbbbbbbbbbb',
      v_now + INTERVAL '13 days' + INTERVAL '11 hours',
      v_now + INTERVAL '13 days' + INTERVAL '11 hours 30 minutes',
      false, NULL, NULL, v_now
    ),
    (
      'cccccccc-0216-0003-0216-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0005-0005-0005-bbbbbbbbbbbb',
      v_now + INTERVAL '14 days' + INTERVAL '10 hours',
      v_now + INTERVAL '14 days' + INTERVAL '10 hours 30 minutes',
      false, NULL, NULL, v_now
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Agent viewing slots inserted (16 rows).';

  -- ===========================================================================
  -- 4. AGENT VIEWING FEEDBACK (4 completed viewings)
  -- ===========================================================================
  RAISE NOTICE 'Inserting agent_viewing_feedback...';

  INSERT INTO agent_viewing_feedback (
    id, agent_id, viewing_slot_id, buyer_name,
    interest_level, price_opinion, likelihood_to_offer, comments, created_at
  ) VALUES
    -- Feedback for Kensington viewing (led to accepted offer)
    (
      'cccccccc-0301-0003-0301-cccccccccccc',
      v_agent_id, 'cccccccc-0201-0003-0201-cccccccccccc',
      'James Wilson',
      5, 'about_right', 'very_likely',
      'Absolutely loved the property. Period features were a huge draw. Will be making an offer.',
      v_now - INTERVAL '5 weeks'
    ),
    -- Feedback for Clapham viewing (led to completed sale)
    (
      'cccccccc-0302-0003-0302-cccccccccccc',
      v_agent_id, 'cccccccc-0202-0003-0202-cccccccccccc',
      'Daniel & Sarah Foster',
      4, 'good_value', 'likely',
      'Really liked the garden and loft conversion. Concerned about road noise but overall very positive.',
      v_now - INTERVAL '7 weeks'
    ),
    -- Feedback for Primrose Hill viewing
    (
      'cccccccc-0303-0003-0303-cccccccccccc',
      v_agent_id, 'cccccccc-0203-0003-0203-cccccccccccc',
      'Hannah Morgan',
      3, 'too_high', 'possible',
      'Nice property but feels slightly overpriced for the area. Would consider at a lower price.',
      v_now - INTERVAL '2 weeks'
    ),
    -- Feedback for Hove viewing (led to offer)
    (
      'cccccccc-0304-0003-0304-cccccccccccc',
      v_agent_id, 'cccccccc-0204-0003-0204-cccccccccccc',
      'Marcus Taylor',
      4, 'about_right', 'likely',
      'Impressed by the garden and period features. Wants to bring his partner for a second viewing before offering.',
      v_now - INTERVAL '8 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Agent viewing feedback inserted (4 rows).';

  -- ===========================================================================
  -- 5. AGENT OFFERS (5 offers on agent's properties)
  -- ===========================================================================
  RAISE NOTICE 'Inserting agent_offers...';

  INSERT INTO agent_offers (
    id, agent_id, property_id, lead_id, buyer_name, buyer_email, buyer_phone,
    amount, conditions, solicitor_details, aip_status, status,
    counter_amount, vendor_notified, created_at, updated_at
  ) VALUES
    -- Offer 1: ACCEPTED on Property 1 (Kensington) — by Buyer James
    (
      'cccccccc-0401-0003-0401-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb',
      'cccccccc-0009-0003-0009-cccccccccccc',
      'James Wilson', 'james.wilson@email.com', '07700 100100',
      120000000, -- £1,200,000 in pence
      'Subject to survey and satisfactory searches.',
      '{"name": "Smith & Partners Solicitors", "contact": "Ms. Claire Smith", "phone": "020 7946 0001", "email": "c.smith@smithpartners.co.uk"}'::jsonb,
      'verified', 'accepted',
      NULL, true,
      v_now - INTERVAL '5 weeks', v_now - INTERVAL '4 weeks'
    ),

    -- Offer 2: PENDING on Property 2 (Primrose Hill)
    (
      'cccccccc-0402-0003-0402-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb',
      'cccccccc-0006-0003-0006-cccccccccccc',
      'James Wilson', 'james.wilson@email.com', '07700 100100',
      84500000, -- £845,000 in pence (below asking of £875,000)
      'Chain-free. Completion within 8 weeks.',
      '{"name": "Smith & Partners Solicitors", "contact": "Ms. Claire Smith", "phone": "020 7946 0001"}'::jsonb,
      'provided', 'pending',
      NULL, true,
      v_now - INTERVAL '1 day', v_now - INTERVAL '1 day'
    ),

    -- Offer 3: REJECTED on Property 5 (Guildford cottage)
    (
      'cccccccc-0403-0003-0403-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0005-0005-0005-bbbbbbbbbbbb',
      NULL,
      'George Whitfield', 'g.whitfield@email.com', '07700 900678',
      95000000, -- £950,000 in pence (well below asking of £1,100,000)
      'Subject to sale of current property.',
      NULL,
      'not_provided', 'rejected',
      NULL, true,
      v_now - INTERVAL '3 weeks', v_now - INTERVAL '3 weeks'
    ),

    -- Offer 4: COUNTERED on Property 16 (Hove detached)
    (
      'cccccccc-0404-0003-0404-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0016-0016-0016-bbbbbbbbbbbb',
      'cccccccc-0008-0003-0008-cccccccccccc',
      'Marcus Taylor', 'm.taylor@investcorp.com', '07700 900890',
      87000000, -- £870,000 in pence (below asking of £895,000)
      'Cash buyer. Can complete in 6 weeks.',
      '{"name": "Taylor Wessing", "contact": "Mr. James Alderton", "phone": "020 7300 7000"}'::jsonb,
      'verified', 'countered',
      88500000, -- Counter at £885,000
      true,
      v_now - INTERVAL '3 days', v_now - INTERVAL '1 day'
    ),

    -- Offer 5: WITHDRAWN on Property 14 (Shoreditch new build)
    (
      'cccccccc-0405-0003-0405-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0014-0014-0014-bbbbbbbbbbbb',
      NULL,
      'Lisa Chang', 'l.chang@email.com', '07700 900432',
      55000000, -- £550,000 in pence (below asking of £575,000)
      'First-time buyer. Help to Buy.',
      NULL,
      'provided', 'withdrawn',
      NULL, true,
      v_now - INTERVAL '2 weeks', v_now - INTERVAL '10 days'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Agent offers inserted (5 rows).';

  -- ===========================================================================
  -- 6. AGENT SALE PROGRESSIONS (2 active sales)
  -- ===========================================================================
  RAISE NOTICE 'Inserting agent_sale_progressions...';

  INSERT INTO agent_sale_progressions (
    id, agent_id, offer_id, property_id, stage,
    expected_completion_date, solicitor_buyer, solicitor_seller,
    notes, created_at, updated_at
  ) VALUES
    -- Sale progression for Property 1 (Kensington — accepted offer)
    (
      'cccccccc-0501-0003-0501-cccccccccccc',
      v_agent_id,
      'cccccccc-0401-0003-0401-cccccccccccc',
      'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb',
      'solicitors_instructed',
      (CURRENT_DATE + INTERVAL '10 weeks')::date,
      '{"name": "Smith & Partners Solicitors", "contact": "Ms. Claire Smith", "phone": "020 7946 0001", "email": "c.smith@smithpartners.co.uk", "reference": "SP/2026/JW/1234"}'::jsonb,
      '{"name": "Harrison Law", "contact": "Mr. David Harrison", "phone": "020 7946 0002", "email": "d.harrison@harrisonlaw.co.uk", "reference": "HL/2026/KEN/5678"}'::jsonb,
      'Both solicitors instructed. Buyer''s surveyor booked for next week. Mortgage application in progress.',
      v_now - INTERVAL '4 weeks', v_now - INTERVAL '3 days'
    ),

    -- Sale progression for Property 3 (Clapham — completed sale)
    (
      'cccccccc-0502-0003-0502-cccccccccccc',
      v_agent_id,
      -- Note: using a generated offer ID for the completed Clapham sale
      'cccccccc-0406-0003-0406-cccccccccccc',
      'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb',
      'completion',
      (CURRENT_DATE - INTERVAL '4 weeks')::date,
      '{"name": "Baker & Co", "contact": "Ms. Jane Baker", "phone": "020 7946 0003"}'::jsonb,
      '{"name": "Richards Legal", "contact": "Mr. Tom Richards", "phone": "020 7946 0004"}'::jsonb,
      'Sale completed successfully. Keys handed over. Commission invoiced.',
      v_now - INTERVAL '8 weeks', v_now - INTERVAL '4 weeks'
    )
  ON CONFLICT (id) DO NOTHING;

  -- Insert the matching offer for the Clapham completed sale
  INSERT INTO agent_offers (
    id, agent_id, property_id, lead_id, buyer_name, buyer_email, buyer_phone,
    amount, conditions, solicitor_details, aip_status, status,
    counter_amount, vendor_notified, created_at, updated_at
  ) VALUES (
    'cccccccc-0406-0003-0406-cccccccccccc',
    v_agent_id, 'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb',
    'cccccccc-0010-0003-0010-cccccccccccc',
    'Daniel & Sarah Foster', 'fosters@gmail.com', '07700 900345',
    78000000, -- £780,000 in pence
    'No chain. Mortgage approved.',
    '{"name": "Baker & Co", "contact": "Ms. Jane Baker", "phone": "020 7946 0003"}'::jsonb,
    'verified', 'accepted',
    NULL, true,
    v_now - INTERVAL '7 weeks', v_now - INTERVAL '6 weeks'
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Agent sale progressions inserted (2 rows).';

  -- ===========================================================================
  -- 7. AGENT CRM CLIENTS (6 clients)
  -- ===========================================================================
  RAISE NOTICE 'Inserting agent_crm_clients...';

  INSERT INTO agent_crm_clients (
    id, agent_id, user_id, name, email, phone, client_type,
    preferences, notes, tags, last_contact_at, created_at, updated_at
  ) VALUES
    -- Client 1: Buyer James (linked to demo user)
    (
      'cccccccc-0601-0003-0601-cccccccccccc',
      v_agent_id, v_buyer_id,
      'James Wilson', 'james.wilson@email.com', '07700 100100',
      'buyer',
      '{"min_bedrooms": 3, "max_price": 1500000, "areas": ["Kensington", "Primrose Hill", "Hampstead"], "property_types": ["detached", "semi_detached"]}'::jsonb,
      'Very motivated buyer. Chain-free with AIP. Has accepted offer on Kensington property.',
      ARRAY['chain-free', 'aip-verified', 'priority'],
      v_now - INTERVAL '1 day',
      v_now - INTERVAL '8 weeks', v_now - INTERVAL '1 day'
    ),

    -- Client 2: Seller David (linked to demo user)
    (
      'cccccccc-0602-0003-0602-cccccccccccc',
      v_agent_id, v_seller_id,
      'David Okonkwo', 'david.okonkwo@email.com', '07700 300300',
      'seller',
      '{"reason_for_selling": "upsizing", "timeline": "3_months", "min_price": 500000}'::jsonb,
      'Selling Lewisham property. Also interested in buying a larger family home through us.',
      ARRAY['active-seller', 'potential-buyer'],
      v_now - INTERVAL '3 days',
      v_now - INTERVAL '5 weeks', v_now - INTERVAL '3 days'
    ),

    -- Client 3: Oliver Bennett (standalone)
    (
      'cccccccc-0603-0003-0603-cccccccccccc',
      v_agent_id, NULL,
      'Oliver Bennett', 'o.bennett@lawfirm.co.uk', '07700 900789',
      'buyer',
      '{"min_bedrooms": 4, "max_price": 1200000, "areas": ["Guildford", "Sevenoaks", "Surrey Hills"], "property_types": ["detached", "cottage"]}'::jsonb,
      'Solicitor looking for family home in Surrey/Kent commuter belt. AIP from Barclays at £1.2m.',
      ARRAY['aip-verified', 'commuter'],
      v_now - INTERVAL '3 days',
      v_now - INTERVAL '5 days', v_now - INTERVAL '3 days'
    ),

    -- Client 4: Aisha Patel (standalone)
    (
      'cccccccc-0604-0003-0604-cccccccccccc',
      v_agent_id, NULL,
      'Aisha Patel', 'aisha.p@techstartup.io', '07700 900234',
      'buyer',
      '{"min_bedrooms": 1, "max_price": 600000, "areas": ["Shoreditch", "Hackney", "Bethnal Green"], "property_types": ["flat", "new_build"]}'::jsonb,
      'First-time buyer. Works in Shoreditch tech corridor. Help to Buy eligible.',
      ARRAY['first-time-buyer', 'help-to-buy'],
      v_now - INTERVAL '4 days',
      v_now - INTERVAL '8 days', v_now - INTERVAL '4 days'
    ),

    -- Client 5: Marcus Taylor (standalone)
    (
      'cccccccc-0605-0003-0605-cccccccccccc',
      v_agent_id, NULL,
      'Marcus Taylor', 'm.taylor@investcorp.com', '07700 900890',
      'buyer',
      '{"min_bedrooms": 4, "max_price": 1000000, "areas": ["Hove", "Brighton", "Worthing"], "property_types": ["detached"]}'::jsonb,
      'Investment buyer. Cash purchase. Looking for period properties on the South Coast.',
      ARRAY['cash-buyer', 'investor'],
      v_now - INTERVAL '1 day',
      v_now - INTERVAL '2 weeks', v_now - INTERVAL '1 day'
    ),

    -- Client 6: Landlord looking to sell portfolio
    (
      'cccccccc-0606-0003-0606-cccccccccccc',
      v_agent_id, NULL,
      'Patricia Hawkins', 'p.hawkins@btinternet.com', '07700 900111',
      'landlord',
      '{"portfolio_size": 3, "areas": ["London"], "considering": "selling_all"}'::jsonb,
      'Retiring landlord with 3 BTL properties in South London. Considering selling entire portfolio. High-value client.',
      ARRAY['portfolio-seller', 'high-value', 'landlord'],
      v_now - INTERVAL '1 week',
      v_now - INTERVAL '3 weeks', v_now - INTERVAL '1 week'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Agent CRM clients inserted (6 rows).';

  -- ===========================================================================
  -- 8. AGENT BRANCHES (2 branches)
  -- ===========================================================================
  RAISE NOTICE 'Inserting agent_branches...';

  INSERT INTO agent_branches (
    id, agent_id, name, address_line_1, city, postcode,
    phone, email, is_head_office, created_at, updated_at
  ) VALUES
    (
      'cccccccc-0701-0003-0701-cccccccccccc',
      v_agent_id,
      'Mitchell & Partners — Kensington',
      '42 Kensington High Street', 'London', 'W8 4PT',
      '020 7946 1000', 'kensington@mitchellpartners.co.uk',
      true, v_now - INTERVAL '2 years', v_now
    ),
    (
      'cccccccc-0702-0003-0702-cccccccccccc',
      v_agent_id,
      'Mitchell & Partners — Clapham',
      '118 Clapham High Street', 'London', 'SW4 7UL',
      '020 7946 2000', 'clapham@mitchellpartners.co.uk',
      false, v_now - INTERVAL '1 year', v_now
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Agent branches inserted (2 rows).';

  -- ===========================================================================
  -- 9. AGENT TEAM MEMBERS (skipped)
  -- ===========================================================================
  -- Requires additional team member users in auth.users.
  -- To add team members, first create additional users in 00_demo_users.sql,
  -- then insert agent_team_members rows referencing those user IDs.

  RAISE NOTICE 'Agent team members skipped (requires additional auth.users entries).';

  -- ===========================================================================
  -- 10. AGENT COMMISSIONS (3 completed/in-progress sales)
  -- ===========================================================================
  RAISE NOTICE 'Inserting agent_commissions...';

  INSERT INTO agent_commissions (
    id, agent_id, property_id, sale_price, commission_rate,
    commission_amount, status, paid_at, created_at
  ) VALUES
    -- Commission 1: Clapham sale (completed, paid)
    (
      'cccccccc-0801-0003-0801-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb',
      78000000,   -- £780,000 sale price in pence
      1.50,        -- 1.5% commission rate
      1170000,     -- £11,700 commission in pence
      'paid',
      v_now - INTERVAL '3 weeks',
      v_now - INTERVAL '4 weeks'
    ),

    -- Commission 2: Hackney flat sale (completed, invoiced)
    (
      'cccccccc-0802-0003-0802-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0022-0022-0022-bbbbbbbbbbbb',
      48000000,   -- £480,000 sale price in pence
      1.25,        -- 1.25% commission rate
      600000,      -- £6,000 commission in pence
      'invoiced',
      NULL,
      v_now - INTERVAL '2 weeks'
    ),

    -- Commission 3: Kensington sale (in progress, pending)
    (
      'cccccccc-0803-0003-0803-cccccccccccc',
      v_agent_id, 'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb',
      120000000,  -- £1,200,000 sale price in pence
      1.50,        -- 1.5% commission rate
      1800000,     -- £18,000 commission in pence
      'pending',
      NULL,
      v_now - INTERVAL '4 weeks'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Agent commissions inserted (3 rows).';

  -- ===========================================================================
  RAISE NOTICE '=== Agent Dashboard Seed: Complete ===';
  RAISE NOTICE 'Summary: 10 leads, 22 activities, 16 viewing slots, 4 feedback,';
  RAISE NOTICE '         6 offers, 2 sale progressions, 6 CRM clients,';
  RAISE NOTICE '         2 branches, 3 commissions.';

END $$;
