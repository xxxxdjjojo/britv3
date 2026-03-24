-- =============================================================================
-- 01_properties_listings.sql — Properties, Listings & Property Media Seed Data
-- =============================================================================
-- Creates 22 UK properties with listings and property_media.
-- Depends on: 00_demo_users.sql (demo users must exist first)
--
-- Ownership mapping:
--   Properties 1-5:   Agent Sarah  (55555555-5555-5555-5555-555555555555)
--   Properties 6-8:   Seller David (33333333-3333-3333-3333-333333333333)
--   Properties 9-12:  Landlord Mike(44444444-4444-4444-4444-444444444444)
--   Properties 13-22: Agent Sarah  (55555555-5555-5555-5555-555555555555)
--
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING).
-- =============================================================================

DO $$
DECLARE
  v_agent_id    UUID := '55555555-5555-5555-5555-555555555555';
  v_seller_id   UUID := '33333333-3333-3333-3333-333333333333';
  v_landlord_id UUID := '44444444-4444-4444-4444-444444444444';
  v_now         TIMESTAMPTZ := NOW();
BEGIN

  RAISE NOTICE '=== Properties & Listings Seed: Starting ===';

  -- ===========================================================================
  -- 1. PROPERTIES
  -- ===========================================================================
  RAISE NOTICE 'Inserting properties...';

  INSERT INTO properties (
    id, address_line1, address_line2, city, county, postcode,
    coordinates, property_type, bedrooms, bathrooms, reception_rooms,
    square_footage, title, description, features, epc_rating,
    tenure, council_tax_band, year_built, new_build, created_at, updated_at
  ) VALUES
    -- =========================================================================
    -- AGENT SARAH's LISTINGS (Properties 1-5)
    -- =========================================================================

    -- Property 1: Star listing, under offer from Buyer James
    (
      'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa',
      '12 Kensington Gardens', NULL, 'London', 'Greater London', 'W8 4QU',
      ST_SetSRID(ST_MakePoint(-0.1870, 51.5074), 4326)::geography,
      'detached', 4, 3.0, 2, 2800,
      'Stunning 4-Bed Victorian in Kensington',
      'A beautifully restored Victorian detached property featuring original cornicing, marble fireplaces, and a modern open-plan kitchen. The private south-facing garden backs onto communal gardens with access to Kensington Palace grounds.',
      '{"garden": true, "parking": "off-street", "central_heating": "gas", "double_glazing": true, "period_features": true, "open_fireplace": true}'::jsonb,
      'B', 'freehold', 'H', 1885, false, v_now, v_now
    ),

    -- Property 2: Active sale with viewings booked
    (
      'aaaaaaaa-0002-0002-0002-aaaaaaaaaaaa',
      '8 Primrose Hill Road', NULL, 'London', 'Greater London', 'NW1 8YD',
      ST_SetSRID(ST_MakePoint(-0.1604, 51.5392), 4326)::geography,
      'semi_detached', 3, 2.0, 1, 1800,
      'Charming 3-Bed Semi in Primrose Hill',
      'Light-filled semi-detached home with a beautifully landscaped rear garden, close to Regent''s Park and excellent local schools. Recently refurbished throughout with underfloor heating and bespoke joinery.',
      '{"garden": true, "parking": "on-street", "central_heating": "gas", "double_glazing": true, "underfloor_heating": true}'::jsonb,
      'C', 'freehold', 'G', 1920, false, v_now, v_now
    ),

    -- Property 3: Sold property
    (
      'aaaaaaaa-0003-0003-0003-aaaaaaaaaaaa',
      '45 Clapham Common North Side', NULL, 'London', 'Greater London', 'SW4 9SA',
      ST_SetSRID(ST_MakePoint(-0.1520, 51.4615), 4326)::geography,
      'terraced', 3, 2.0, 2, 1650,
      'Period 3-Bed Terrace on Clapham Common',
      'A handsome Victorian terrace overlooking Clapham Common with high ceilings, bay windows, and a 60ft rear garden. The loft has been converted to create a bright home office.',
      '{"garden": true, "parking": "on-street", "central_heating": "gas", "double_glazing": true, "loft_conversion": true}'::jsonb,
      'D', 'freehold', 'F', 1890, false, v_now, v_now
    ),

    -- Property 4: Active luxury penthouse
    (
      'aaaaaaaa-0004-0004-0004-aaaaaaaaaaaa',
      'Penthouse, One Tower Bridge', 'Potters Fields Park', 'London', 'Greater London', 'SE1 2AA',
      ST_SetSRID(ST_MakePoint(-0.0764, 51.5045), 4326)::geography,
      'penthouse', 3, 2.0, 1, 2200,
      'Luxury 3-Bed Penthouse at One Tower Bridge',
      'An exceptional penthouse apartment with floor-to-ceiling windows offering panoramic views of Tower Bridge and the City skyline. Features include a wraparound terrace, Gaggenau kitchen, and 24-hour concierge.',
      '{"balcony": true, "concierge": true, "gym": true, "parking": "underground", "porter": true, "terrace": true}'::jsonb,
      'B', 'leasehold', 'H', 2016, false, v_now, v_now
    ),

    -- Property 5: Active cottage in Surrey
    (
      'aaaaaaaa-0005-0005-0005-aaaaaaaaaaaa',
      'Rose Cottage, 3 Church Lane', NULL, 'Guildford', 'Surrey', 'GU1 3RR',
      ST_SetSRID(ST_MakePoint(-0.5712, 51.2362), 4326)::geography,
      'cottage', 5, 3.0, 3, 3200,
      'Idyllic 5-Bed Country Cottage in Guildford',
      'A Grade II listed thatched cottage set in half an acre of mature gardens with views over the Surrey Hills AONB. Sympathetically extended to include a family kitchen-diner, home office, and annexe.',
      '{"garden": true, "parking": "driveway", "central_heating": "oil", "listed_building": true, "annexe": true, "rural_views": true}'::jsonb,
      'E', 'freehold', 'G', 1720, false, v_now, v_now
    ),

    -- =========================================================================
    -- SELLER DAVID's LISTINGS (Properties 6-8)
    -- =========================================================================

    -- Property 6: Seller's active listing
    (
      'aaaaaaaa-0006-0006-0006-aaaaaaaaaaaa',
      '27 Oakwood Avenue', NULL, 'London', 'Greater London', 'SE13 5DT',
      ST_SetSRID(ST_MakePoint(-0.0134, 51.4545), 4326)::geography,
      'semi_detached', 3, 1.0, 1, 1200,
      'Well-Presented 3-Bed Semi in Lewisham',
      'A well-maintained three-bedroom semi-detached family home with a modern kitchen, conservatory, and generous rear garden. Close to Lewisham station with excellent transport links to the City.',
      '{"garden": true, "conservatory": true, "parking": "driveway", "central_heating": "gas", "double_glazing": true}'::jsonb,
      'C', 'freehold', 'D', 1935, false, v_now, v_now
    ),

    -- Property 7: Seller's under offer listing
    (
      'aaaaaaaa-0007-0007-0007-aaaaaaaaaaaa',
      'Flat 4, 19 Greenwich High Road', NULL, 'London', 'Greater London', 'SE10 8JA',
      ST_SetSRID(ST_MakePoint(-0.0098, 51.4769), 4326)::geography,
      'flat', 2, 1.0, 1, 750,
      'Modern 2-Bed Flat in Greenwich',
      'A stylish second-floor apartment in a converted Victorian building with views towards Greenwich Park. Features include wooden floors throughout, a Juliet balcony, and share of the communal garden.',
      '{"balcony": true, "communal_garden": true, "wooden_floors": true, "double_glazing": true}'::jsonb,
      'C', 'leasehold', 'C', 1880, false, v_now, v_now
    ),

    -- Property 8: Seller's sold listing
    (
      'aaaaaaaa-0008-0008-0008-aaaaaaaaaaaa',
      '5 Brockley Rise', NULL, 'London', 'Greater London', 'SE23 1JN',
      ST_SetSRID(ST_MakePoint(-0.0378, 51.4412), 4326)::geography,
      'terraced', 2, 1.0, 1, 850,
      'Cosy 2-Bed Victorian Terrace in Forest Hill',
      'A charming two-bedroom Victorian mid-terrace with original fireplaces, a modern bathroom, and a low-maintenance paved garden. Moments from the Horniman Museum and Forest Hill station.',
      '{"garden": true, "period_features": true, "central_heating": "gas", "double_glazing": true}'::jsonb,
      'D', 'freehold', 'C', 1895, false, v_now, v_now
    ),

    -- =========================================================================
    -- LANDLORD MIKE's RENTAL PORTFOLIO (Properties 9-12)
    -- =========================================================================

    -- Property 9: Active rental
    (
      'aaaaaaaa-0009-0009-0009-aaaaaaaaaaaa',
      'Flat 12, Canary Riverside', 'Westferry Circus', 'London', 'Greater London', 'E14 8RR',
      ST_SetSRID(ST_MakePoint(-0.0197, 51.5055), 4326)::geography,
      'flat', 2, 2.0, 1, 900,
      'Luxury 2-Bed Flat at Canary Riverside',
      'A beautifully furnished two-bedroom apartment in the prestigious Canary Riverside development with Thames views, gym, pool, and 24-hour concierge. Walking distance to Canary Wharf station.',
      '{"furnished": true, "gym": true, "pool": true, "concierge": true, "parking": "underground", "river_views": true}'::jsonb,
      'B', 'leasehold', 'F', 2000, false, v_now, v_now
    ),

    -- Property 10: Active rental
    (
      'aaaaaaaa-0010-0010-0010-aaaaaaaaaaaa',
      'Flat 8, 42 Commercial Road', NULL, 'London', 'Greater London', 'E1 1LP',
      ST_SetSRID(ST_MakePoint(-0.0650, 51.5135), 4326)::geography,
      'flat', 2, 1.0, 1, 680,
      'Modern 2-Bed Apartment in Whitechapel',
      'A bright and modern two-bedroom apartment in a purpose-built block with an open-plan living area, fitted kitchen, and private balcony. Excellent transport links from Aldgate East station.',
      '{"balcony": true, "furnished": true, "central_heating": "gas", "double_glazing": true, "lift": true}'::jsonb,
      'C', 'leasehold', 'D', 2015, false, v_now, v_now
    ),

    -- Property 11: Let rental
    (
      'aaaaaaaa-0011-0011-0011-aaaaaaaaaaaa',
      'Flat 3, 15 Bermondsey Street', NULL, 'London', 'Greater London', 'SE1 3UW',
      ST_SetSRID(ST_MakePoint(-0.0825, 51.4998), 4326)::geography,
      'flat', 1, 1.0, 1, 520,
      '1-Bed Flat in Trendy Bermondsey',
      'A well-appointed one-bedroom flat in a converted warehouse with exposed brick walls, high ceilings, and Velux skylights. Located on vibrant Bermondsey Street near Borough Market.',
      '{"furnished": true, "character_features": true, "wooden_floors": true, "double_glazing": true}'::jsonb,
      'C', 'leasehold', 'C', 1890, false, v_now, v_now
    ),

    -- Property 12: Active rental
    (
      'aaaaaaaa-0012-0012-0012-aaaaaaaaaaaa',
      'Flat 21, Battersea Power Station', 'Circus Road West', 'London', 'Greater London', 'SW11 8BU',
      ST_SetSRID(ST_MakePoint(-0.1465, 51.4819), 4326)::geography,
      'flat', 2, 2.0, 1, 850,
      'Stylish 2-Bed at Battersea Power Station',
      'A stunning apartment in the iconic Battersea Power Station development with floor-to-ceiling windows, designer kitchen, and access to residents'' sky garden and rooftop pool.',
      '{"furnished": true, "gym": true, "pool": true, "concierge": true, "sky_garden": true, "designer_kitchen": true}'::jsonb,
      'A', 'leasehold', 'F', 2021, true, v_now, v_now
    ),

    -- =========================================================================
    -- MORE AGENT SARAH LISTINGS (Properties 13-22) — variety for search/browse
    -- =========================================================================

    -- Property 13: Active sale, bungalow
    (
      'aaaaaaaa-0013-0013-0013-aaaaaaaaaaaa',
      '9 Meadow Walk', NULL, 'Sevenoaks', 'Kent', 'TN13 1XR',
      ST_SetSRID(ST_MakePoint(0.1872, 51.2728), 4326)::geography,
      'bungalow', 3, 2.0, 1, 1400,
      'Spacious 3-Bed Bungalow in Sevenoaks',
      'A well-proportioned detached bungalow on a generous plot with wraparound gardens and a double garage. The property benefits from a recently fitted kitchen and wet room.',
      '{"garden": true, "garage": "double", "central_heating": "gas", "double_glazing": true, "wet_room": true}'::jsonb,
      'D', 'freehold', 'E', 1965, false, v_now, v_now
    ),

    -- Property 14: Active sale, new build flat
    (
      'aaaaaaaa-0014-0014-0014-aaaaaaaaaaaa',
      'Apt 507, The Stage', 'Hewett Street', 'London', 'Greater London', 'EC2A 3NP',
      ST_SetSRID(ST_MakePoint(-0.0814, 51.5233), 4326)::geography,
      'flat', 1, 1.0, 1, 550,
      'Stylish 1-Bed in The Stage, Shoreditch',
      'A brand-new one-bedroom apartment in the landmark Stage development with floor-to-ceiling glazing, integrated Siemens appliances, and residents'' cinema. Moments from Old Street station.',
      '{"concierge": true, "cinema_room": true, "gym": true, "balcony": true, "new_build": true}'::jsonb,
      'A', 'leasehold', 'D', 2024, true, v_now, v_now
    ),

    -- Property 15: Active sale, maisonette
    (
      'aaaaaaaa-0015-0015-0015-aaaaaaaaaaaa',
      '14 Lavender Hill', NULL, 'London', 'Greater London', 'SW11 5RW',
      ST_SetSRID(ST_MakePoint(-0.1680, 51.4630), 4326)::geography,
      'maisonette', 2, 1.0, 1, 780,
      '2-Bed Maisonette in Battersea',
      'A split-level maisonette occupying the upper two floors of a Victorian conversion with its own street entrance. Features include a private roof terrace with views towards the City.',
      '{"roof_terrace": true, "own_entrance": true, "central_heating": "gas", "double_glazing": true}'::jsonb,
      'D', 'leasehold', 'C', 1890, false, v_now, v_now
    ),

    -- Property 16: Under offer, detached
    (
      'aaaaaaaa-0016-0016-0016-aaaaaaaaaaaa',
      '22 The Drive', NULL, 'Hove', 'East Sussex', 'BN3 3JE',
      ST_SetSRID(ST_MakePoint(-0.1760, 50.8429), 4326)::geography,
      'detached', 4, 2.0, 2, 2100,
      'Edwardian 4-Bed Detached in Hove',
      'A substantial Edwardian family home set back from the road behind a landscaped front garden. Features include a cellar, original stained glass, and a 100ft south-facing rear garden.',
      '{"garden": true, "cellar": true, "parking": "driveway", "central_heating": "gas", "period_features": true}'::jsonb,
      'D', 'freehold', 'F', 1910, false, v_now, v_now
    ),

    -- Property 17: Active sale, studio
    (
      'aaaaaaaa-0017-0017-0017-aaaaaaaaaaaa',
      'Studio 4, 88 Worship Street', NULL, 'London', 'Greater London', 'EC2A 2BE',
      ST_SetSRID(ST_MakePoint(-0.0833, 51.5214), 4326)::geography,
      'studio', 0, 1.0, 0, 380,
      'Compact Studio in Shoreditch',
      'A cleverly designed studio apartment with mezzanine sleeping area, full kitchen, and Juliet balcony. Ideal buy-to-let or pied-a-terre in the heart of Shoreditch''s tech corridor.',
      '{"balcony": true, "mezzanine": true, "lift": true}'::jsonb,
      'B', 'leasehold', 'B', 2018, false, v_now, v_now
    ),

    -- Property 18: Active rent, terraced house
    (
      'aaaaaaaa-0018-0018-0018-aaaaaaaaaaaa',
      '33 Northcote Road', NULL, 'London', 'Greater London', 'SW11 1NJ',
      ST_SetSRID(ST_MakePoint(-0.1636, 51.4601), 4326)::geography,
      'terraced', 3, 2.0, 1, 1350,
      '3-Bed Family Terrace on Northcote Road',
      'A beautifully presented Victorian terrace on the sought-after Northcote Road with an extended kitchen-diner opening onto a landscaped garden. Walking distance to Clapham Junction.',
      '{"garden": true, "central_heating": "gas", "double_glazing": true, "kitchen_diner": true}'::jsonb,
      'C', 'freehold', 'E', 1895, false, v_now, v_now
    ),

    -- Property 19: Active sale, detached in Dulwich
    (
      'aaaaaaaa-0019-0019-0019-aaaaaaaaaaaa',
      '7 College Road', NULL, 'London', 'Greater London', 'SE21 7BG',
      ST_SetSRID(ST_MakePoint(-0.0853, 51.4406), 4326)::geography,
      'detached', 5, 3.0, 3, 3500,
      'Grand 5-Bed Detached in Dulwich Village',
      'An imposing double-fronted family home in the heart of Dulwich Village with a sweeping driveway, mature gardens, and far-reaching views from the upper floors. Close to Dulwich College.',
      '{"garden": true, "parking": "driveway", "central_heating": "gas", "double_glazing": true, "utility_room": true}'::jsonb,
      'C', 'freehold', 'H', 1925, false, v_now, v_now
    ),

    -- Property 20: Active rent, flat in Richmond
    (
      'aaaaaaaa-0020-0020-0020-aaaaaaaaaaaa',
      'Flat 2, 11 Hill Rise', NULL, 'Richmond', 'Greater London', 'TW10 6UQ',
      ST_SetSRID(ST_MakePoint(-0.3015, 51.4571), 4326)::geography,
      'flat', 1, 1.0, 1, 480,
      '1-Bed Riverside Flat in Richmond',
      'A charming first-floor flat with views over the Thames, moments from Richmond Bridge and the towpath. The property features a bay window, fitted wardrobes, and a share of the communal garden.',
      '{"communal_garden": true, "river_views": true, "wooden_floors": true}'::jsonb,
      'D', 'leasehold', 'C', 1905, false, v_now, v_now
    ),

    -- Property 21: Active sale, terraced in Wimbledon
    (
      'aaaaaaaa-0021-0021-0021-aaaaaaaaaaaa',
      '18 Lancaster Road', NULL, 'London', 'Greater London', 'SW19 5DE',
      ST_SetSRID(ST_MakePoint(-0.2069, 51.4215), 4326)::geography,
      'terraced', 3, 1.0, 2, 1150,
      '3-Bed Terrace near Wimbledon Village',
      'An attractive Edwardian mid-terrace with high ceilings, bay windows, and a 50ft garden backing onto allotments. Short walk to Wimbledon Village and the All England Club.',
      '{"garden": true, "central_heating": "gas", "double_glazing": true, "bay_windows": true, "high_ceilings": true}'::jsonb,
      'D', 'freehold', 'E', 1905, false, v_now, v_now
    ),

    -- Property 22: Sold, flat in Hackney
    (
      'aaaaaaaa-0022-0022-0022-aaaaaaaaaaaa',
      'Flat 6, 55 Mare Street', NULL, 'London', 'Greater London', 'E8 4RG',
      ST_SetSRID(ST_MakePoint(-0.0554, 51.5466), 4326)::geography,
      'flat', 2, 1.0, 1, 650,
      '2-Bed Flat in Vibrant Hackney',
      'A bright two-bedroom apartment on the top floor of a period conversion with skyline views from the open-plan living area. Located on the doorstep of Broadway Market and London Fields.',
      '{"wooden_floors": true, "skyline_views": true, "open_plan": true}'::jsonb,
      'C', 'leasehold', 'C', 1875, false, v_now, v_now
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Properties inserted (22 rows, ON CONFLICT DO NOTHING).';

  -- ===========================================================================
  -- 2. LISTINGS
  -- ===========================================================================
  RAISE NOTICE 'Inserting listings...';

  -- Note: slug is auto-generated by trg_generate_listing_slug trigger.
  INSERT INTO listings (
    id, property_id, user_id, listing_type, status, price,
    rent_frequency, price_qualifier, listed_date, available_from,
    view_count, enquiry_count, favorite_count, created_at, updated_at
  ) VALUES
    -- =========================================================================
    -- AGENT SARAH's LISTINGS (1-5)
    -- =========================================================================

    -- Listing 1: Kensington — under offer from Buyer James
    (
      'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb',
      'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'under_offer', 1250000.00,
      NULL, 'guide_price', (CURRENT_DATE - INTERVAL '6 weeks')::date, NULL,
      342, 18, 45, v_now, v_now
    ),

    -- Listing 2: Primrose Hill — active, viewings booked
    (
      'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb',
      'aaaaaaaa-0002-0002-0002-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'active', 875000.00,
      NULL, 'offers_over', (CURRENT_DATE - INTERVAL '3 weeks')::date, NULL,
      198, 12, 28, v_now, v_now
    ),

    -- Listing 3: Clapham — sold
    (
      'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb',
      'aaaaaaaa-0003-0003-0003-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'sold', 785000.00,
      NULL, 'fixed_price', (CURRENT_DATE - INTERVAL '8 weeks')::date, NULL,
      510, 24, 62, v_now, v_now
    ),

    -- Listing 4: Tower Bridge penthouse — active
    (
      'bbbbbbbb-0004-0004-0004-bbbbbbbbbbbb',
      'aaaaaaaa-0004-0004-0004-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'active', 1950000.00,
      NULL, 'guide_price', (CURRENT_DATE - INTERVAL '2 weeks')::date, NULL,
      425, 8, 56, v_now, v_now
    ),

    -- Listing 5: Guildford cottage — active
    (
      'bbbbbbbb-0005-0005-0005-bbbbbbbbbbbb',
      'aaaaaaaa-0005-0005-0005-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'active', 1100000.00,
      NULL, 'guide_price', (CURRENT_DATE - INTERVAL '4 weeks')::date, NULL,
      156, 6, 22, v_now, v_now
    ),

    -- =========================================================================
    -- SELLER DAVID's LISTINGS (6-8)
    -- =========================================================================

    -- Listing 6: Lewisham — active
    (
      'bbbbbbbb-0006-0006-0006-bbbbbbbbbbbb',
      'aaaaaaaa-0006-0006-0006-aaaaaaaaaaaa',
      v_seller_id, 'sale', 'active', 525000.00,
      NULL, 'offers_over', (CURRENT_DATE - INTERVAL '5 weeks')::date, NULL,
      210, 14, 31, v_now, v_now
    ),

    -- Listing 7: Greenwich flat — under offer
    (
      'bbbbbbbb-0007-0007-0007-bbbbbbbbbbbb',
      'aaaaaaaa-0007-0007-0007-aaaaaaaaaaaa',
      v_seller_id, 'sale', 'under_offer', 425000.00,
      NULL, 'guide_price', (CURRENT_DATE - INTERVAL '6 weeks')::date, NULL,
      285, 16, 38, v_now, v_now
    ),

    -- Listing 8: Forest Hill — sold
    (
      'bbbbbbbb-0008-0008-0008-bbbbbbbbbbbb',
      'aaaaaaaa-0008-0008-0008-aaaaaaaaaaaa',
      v_seller_id, 'sale', 'sold', 385000.00,
      NULL, 'fixed_price', (CURRENT_DATE - INTERVAL '7 weeks')::date, NULL,
      320, 20, 44, v_now, v_now
    ),

    -- =========================================================================
    -- LANDLORD MIKE's RENTALS (9-12)
    -- =========================================================================

    -- Listing 9: Canary Riverside — active rental
    (
      'bbbbbbbb-0009-0009-0009-bbbbbbbbbbbb',
      'aaaaaaaa-0009-0009-0009-aaaaaaaaaaaa',
      v_landlord_id, 'rent', 'active', 2800.00,
      'monthly', NULL, (CURRENT_DATE - INTERVAL '3 weeks')::date,
      (CURRENT_DATE + INTERVAL '2 weeks')::date,
      145, 9, 18, v_now, v_now
    ),

    -- Listing 10: Whitechapel — active rental
    (
      'bbbbbbbb-0010-0010-0010-bbbbbbbbbbbb',
      'aaaaaaaa-0010-0010-0010-aaaaaaaaaaaa',
      v_landlord_id, 'rent', 'active', 1850.00,
      'monthly', NULL, (CURRENT_DATE - INTERVAL '2 weeks')::date,
      (CURRENT_DATE + INTERVAL '1 week')::date,
      98, 7, 12, v_now, v_now
    ),

    -- Listing 11: Bermondsey — let
    (
      'bbbbbbbb-0011-0011-0011-bbbbbbbbbbbb',
      'aaaaaaaa-0011-0011-0011-aaaaaaaaaaaa',
      v_landlord_id, 'rent', 'let', 1650.00,
      'monthly', NULL, (CURRENT_DATE - INTERVAL '6 weeks')::date,
      NULL,
      220, 15, 25, v_now, v_now
    ),

    -- Listing 12: Battersea Power Station — active rental
    (
      'bbbbbbbb-0012-0012-0012-bbbbbbbbbbbb',
      'aaaaaaaa-0012-0012-0012-aaaaaaaaaaaa',
      v_landlord_id, 'rent', 'active', 3200.00,
      'monthly', NULL, (CURRENT_DATE - INTERVAL '4 weeks')::date,
      (CURRENT_DATE + INTERVAL '3 weeks')::date,
      175, 11, 30, v_now, v_now
    ),

    -- =========================================================================
    -- MORE AGENT SARAH LISTINGS (13-22)
    -- =========================================================================

    -- Listing 13: Sevenoaks bungalow — active sale
    (
      'bbbbbbbb-0013-0013-0013-bbbbbbbbbbbb',
      'aaaaaaaa-0013-0013-0013-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'active', 650000.00,
      NULL, 'guide_price', (CURRENT_DATE - INTERVAL '5 weeks')::date, NULL,
      132, 8, 15, v_now, v_now
    ),

    -- Listing 14: Shoreditch new build — active sale
    (
      'bbbbbbbb-0014-0014-0014-bbbbbbbbbbbb',
      'aaaaaaaa-0014-0014-0014-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'active', 575000.00,
      NULL, 'fixed_price', (CURRENT_DATE - INTERVAL '3 weeks')::date, NULL,
      248, 10, 33, v_now, v_now
    ),

    -- Listing 15: Battersea maisonette — active sale
    (
      'bbbbbbbb-0015-0015-0015-bbbbbbbbbbbb',
      'aaaaaaaa-0015-0015-0015-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'active', 495000.00,
      NULL, 'offers_over', (CURRENT_DATE - INTERVAL '4 weeks')::date, NULL,
      178, 11, 24, v_now, v_now
    ),

    -- Listing 16: Hove detached — under offer
    (
      'bbbbbbbb-0016-0016-0016-bbbbbbbbbbbb',
      'aaaaaaaa-0016-0016-0016-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'under_offer', 895000.00,
      NULL, 'guide_price', (CURRENT_DATE - INTERVAL '7 weeks')::date, NULL,
      365, 19, 48, v_now, v_now
    ),

    -- Listing 17: Shoreditch studio — active sale
    (
      'bbbbbbbb-0017-0017-0017-bbbbbbbbbbbb',
      'aaaaaaaa-0017-0017-0017-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'active', 350000.00,
      NULL, 'fixed_price', (CURRENT_DATE - INTERVAL '2 weeks')::date, NULL,
      88, 5, 11, v_now, v_now
    ),

    -- Listing 18: Northcote Road — active rent
    (
      'bbbbbbbb-0018-0018-0018-bbbbbbbbbbbb',
      'aaaaaaaa-0018-0018-0018-aaaaaaaaaaaa',
      v_agent_id, 'rent', 'active', 3500.00,
      'monthly', NULL, (CURRENT_DATE - INTERVAL '2 weeks')::date,
      (CURRENT_DATE + INTERVAL '2 weeks')::date,
      112, 8, 19, v_now, v_now
    ),

    -- Listing 19: Dulwich detached — active sale
    (
      'bbbbbbbb-0019-0019-0019-bbbbbbbbbbbb',
      'aaaaaaaa-0019-0019-0019-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'active', 1750000.00,
      NULL, 'guide_price', (CURRENT_DATE - INTERVAL '3 weeks')::date, NULL,
      298, 14, 41, v_now, v_now
    ),

    -- Listing 20: Richmond flat — active rent
    (
      'bbbbbbbb-0020-0020-0020-bbbbbbbbbbbb',
      'aaaaaaaa-0020-0020-0020-aaaaaaaaaaaa',
      v_agent_id, 'rent', 'active', 1450.00,
      'monthly', NULL, (CURRENT_DATE - INTERVAL '3 weeks')::date,
      (CURRENT_DATE + INTERVAL '1 week')::date,
      95, 6, 14, v_now, v_now
    ),

    -- Listing 21: Wimbledon terrace — active sale
    (
      'bbbbbbbb-0021-0021-0021-bbbbbbbbbbbb',
      'aaaaaaaa-0021-0021-0021-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'active', 725000.00,
      NULL, 'offers_over', (CURRENT_DATE - INTERVAL '4 weeks')::date, NULL,
      165, 9, 22, v_now, v_now
    ),

    -- Listing 22: Hackney flat — sold
    (
      'bbbbbbbb-0022-0022-0022-bbbbbbbbbbbb',
      'aaaaaaaa-0022-0022-0022-aaaaaaaaaaaa',
      v_agent_id, 'sale', 'sold', 480000.00,
      NULL, 'fixed_price', (CURRENT_DATE - INTERVAL '8 weeks')::date, NULL,
      440, 22, 55, v_now, v_now
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Listings inserted (22 rows, ON CONFLICT DO NOTHING).';

  -- ===========================================================================
  -- 3. PROPERTY MEDIA
  -- ===========================================================================
  RAISE NOTICE 'Inserting property_media...';

  INSERT INTO property_media (
    id, listing_id, media_type, url, thumbnail_url,
    caption, alt_text, sort_order, uploaded_by, created_at
  ) VALUES
    -- Property 1: Kensington Gardens (3 images + floor plan)
    ('cccccccc-0001-0001-0001-cccccccccccc', 'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb', 'image',
     '/images/demo/property-1-exterior.jpg', '/images/demo/thumbs/property-1-exterior.jpg',
     'Front elevation', 'Victorian detached house at 12 Kensington Gardens', 0, v_agent_id, v_now),
    ('cccccccc-0001-0002-0001-cccccccccccc', 'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb', 'image',
     '/images/demo/property-1-kitchen.jpg', '/images/demo/thumbs/property-1-kitchen.jpg',
     'Open-plan kitchen', 'Modern kitchen with island at 12 Kensington Gardens', 1, v_agent_id, v_now),
    ('cccccccc-0001-0003-0001-cccccccccccc', 'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb', 'image',
     '/images/demo/property-1-garden.jpg', '/images/demo/thumbs/property-1-garden.jpg',
     'South-facing garden', 'Landscaped rear garden with mature planting', 2, v_agent_id, v_now),
    ('cccccccc-0001-0004-0001-cccccccccccc', 'bbbbbbbb-0001-0001-0001-bbbbbbbbbbbb', 'floor_plan',
     '/images/demo/property-1-floorplan.jpg', NULL,
     'Ground floor plan', 'Floor plan for 12 Kensington Gardens', 3, v_agent_id, v_now),

    -- Property 2: Primrose Hill (2 images + floor plan)
    ('cccccccc-0002-0001-0002-cccccccccccc', 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb', 'image',
     '/images/demo/property-2-exterior.jpg', '/images/demo/thumbs/property-2-exterior.jpg',
     'Street view', 'Semi-detached house at 8 Primrose Hill Road', 0, v_agent_id, v_now),
    ('cccccccc-0002-0002-0002-cccccccccccc', 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb', 'image',
     '/images/demo/property-2-living.jpg', '/images/demo/thumbs/property-2-living.jpg',
     'Reception room', 'Bright living room with bay window', 1, v_agent_id, v_now),
    ('cccccccc-0002-0003-0002-cccccccccccc', 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb', 'floor_plan',
     '/images/demo/property-2-floorplan.jpg', NULL,
     'Full floor plan', 'Floor plan for 8 Primrose Hill Road', 2, v_agent_id, v_now),

    -- Property 3: Clapham (2 images)
    ('cccccccc-0003-0001-0003-cccccccccccc', 'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb', 'image',
     '/images/demo/property-3-exterior.jpg', '/images/demo/thumbs/property-3-exterior.jpg',
     'Period frontage', 'Victorian terrace at 45 Clapham Common North Side', 0, v_agent_id, v_now),
    ('cccccccc-0003-0002-0003-cccccccccccc', 'bbbbbbbb-0003-0003-0003-bbbbbbbbbbbb', 'image',
     '/images/demo/property-3-garden.jpg', '/images/demo/thumbs/property-3-garden.jpg',
     '60ft rear garden', 'Mature rear garden at Clapham Common property', 1, v_agent_id, v_now),

    -- Property 4: Tower Bridge penthouse (3 images)
    ('cccccccc-0004-0001-0004-cccccccccccc', 'bbbbbbbb-0004-0004-0004-bbbbbbbbbbbb', 'image',
     '/images/demo/property-4-exterior.jpg', '/images/demo/thumbs/property-4-exterior.jpg',
     'Building exterior', 'One Tower Bridge development', 0, v_agent_id, v_now),
    ('cccccccc-0004-0002-0004-cccccccccccc', 'bbbbbbbb-0004-0004-0004-bbbbbbbbbbbb', 'image',
     '/images/demo/property-4-living.jpg', '/images/demo/thumbs/property-4-living.jpg',
     'Open-plan living', 'Panoramic living area with Tower Bridge views', 1, v_agent_id, v_now),
    ('cccccccc-0004-0003-0004-cccccccccccc', 'bbbbbbbb-0004-0004-0004-bbbbbbbbbbbb', 'image',
     '/images/demo/property-4-terrace.jpg', '/images/demo/thumbs/property-4-terrace.jpg',
     'Wraparound terrace', 'Private terrace with City skyline views', 2, v_agent_id, v_now),

    -- Property 5: Guildford cottage (2 images)
    ('cccccccc-0005-0001-0005-cccccccccccc', 'bbbbbbbb-0005-0005-0005-bbbbbbbbbbbb', 'image',
     '/images/demo/property-5-exterior.jpg', '/images/demo/thumbs/property-5-exterior.jpg',
     'Thatched cottage', 'Grade II listed cottage at Rose Cottage, Guildford', 0, v_agent_id, v_now),
    ('cccccccc-0005-0002-0005-cccccccccccc', 'bbbbbbbb-0005-0005-0005-bbbbbbbbbbbb', 'image',
     '/images/demo/property-5-garden.jpg', '/images/demo/thumbs/property-5-garden.jpg',
     'Half-acre gardens', 'Mature gardens with Surrey Hills views', 1, v_agent_id, v_now),

    -- Property 6: Lewisham semi (2 images)
    ('cccccccc-0006-0001-0006-cccccccccccc', 'bbbbbbbb-0006-0006-0006-bbbbbbbbbbbb', 'image',
     '/images/demo/property-6-exterior.jpg', '/images/demo/thumbs/property-6-exterior.jpg',
     'Front elevation', 'Semi-detached house at 27 Oakwood Avenue', 0, v_seller_id, v_now),
    ('cccccccc-0006-0002-0006-cccccccccccc', 'bbbbbbbb-0006-0006-0006-bbbbbbbbbbbb', 'image',
     '/images/demo/property-6-kitchen.jpg', '/images/demo/thumbs/property-6-kitchen.jpg',
     'Modern kitchen', 'Refitted kitchen with conservatory beyond', 1, v_seller_id, v_now),

    -- Property 7: Greenwich flat (2 images)
    ('cccccccc-0007-0001-0007-cccccccccccc', 'bbbbbbbb-0007-0007-0007-bbbbbbbbbbbb', 'image',
     '/images/demo/property-7-exterior.jpg', '/images/demo/thumbs/property-7-exterior.jpg',
     'Period conversion', 'Victorian building at 19 Greenwich High Road', 0, v_seller_id, v_now),
    ('cccccccc-0007-0002-0007-cccccccccccc', 'bbbbbbbb-0007-0007-0007-bbbbbbbbbbbb', 'image',
     '/images/demo/property-7-living.jpg', '/images/demo/thumbs/property-7-living.jpg',
     'Living area', 'Open-plan living with Greenwich Park views', 1, v_seller_id, v_now),

    -- Property 8: Forest Hill (1 image)
    ('cccccccc-0008-0001-0008-cccccccccccc', 'bbbbbbbb-0008-0008-0008-bbbbbbbbbbbb', 'image',
     '/images/demo/property-8-exterior.jpg', '/images/demo/thumbs/property-8-exterior.jpg',
     'Street frontage', 'Victorian terrace at 5 Brockley Rise', 0, v_seller_id, v_now),

    -- Property 9: Canary Riverside (2 images)
    ('cccccccc-0009-0001-0009-cccccccccccc', 'bbbbbbbb-0009-0009-0009-bbbbbbbbbbbb', 'image',
     '/images/demo/property-9-exterior.jpg', '/images/demo/thumbs/property-9-exterior.jpg',
     'Riverside development', 'Canary Riverside from the Thames path', 0, v_landlord_id, v_now),
    ('cccccccc-0009-0002-0009-cccccccccccc', 'bbbbbbbb-0009-0009-0009-bbbbbbbbbbbb', 'image',
     '/images/demo/property-9-living.jpg', '/images/demo/thumbs/property-9-living.jpg',
     'River-view living room', 'Open-plan living with Thames panorama', 1, v_landlord_id, v_now),

    -- Property 10: Whitechapel (2 images)
    ('cccccccc-0010-0001-0010-cccccccccccc', 'bbbbbbbb-0010-0010-0010-bbbbbbbbbbbb', 'image',
     '/images/demo/property-10-exterior.jpg', '/images/demo/thumbs/property-10-exterior.jpg',
     'Modern block', 'Purpose-built apartments on Commercial Road', 0, v_landlord_id, v_now),
    ('cccccccc-0010-0002-0010-cccccccccccc', 'bbbbbbbb-0010-0010-0010-bbbbbbbbbbbb', 'image',
     '/images/demo/property-10-bedroom.jpg', '/images/demo/thumbs/property-10-bedroom.jpg',
     'Master bedroom', 'Double bedroom with fitted wardrobes', 1, v_landlord_id, v_now),

    -- Property 11: Bermondsey (1 image)
    ('cccccccc-0011-0001-0011-cccccccccccc', 'bbbbbbbb-0011-0011-0011-bbbbbbbbbbbb', 'image',
     '/images/demo/property-11-exterior.jpg', '/images/demo/thumbs/property-11-exterior.jpg',
     'Warehouse conversion', 'Converted warehouse on Bermondsey Street', 0, v_landlord_id, v_now),

    -- Property 12: Battersea Power Station (2 images)
    ('cccccccc-0012-0001-0012-cccccccccccc', 'bbbbbbbb-0012-0012-0012-bbbbbbbbbbbb', 'image',
     '/images/demo/property-12-exterior.jpg', '/images/demo/thumbs/property-12-exterior.jpg',
     'Iconic development', 'Battersea Power Station residential', 0, v_landlord_id, v_now),
    ('cccccccc-0012-0002-0012-cccccccccccc', 'bbbbbbbb-0012-0012-0012-bbbbbbbbbbbb', 'image',
     '/images/demo/property-12-living.jpg', '/images/demo/thumbs/property-12-living.jpg',
     'Designer living space', 'Open-plan living with floor-to-ceiling windows', 1, v_landlord_id, v_now),

    -- Property 13: Sevenoaks bungalow (2 images)
    ('cccccccc-0013-0001-0013-cccccccccccc', 'bbbbbbbb-0013-0013-0013-bbbbbbbbbbbb', 'image',
     '/images/demo/property-13-exterior.jpg', '/images/demo/thumbs/property-13-exterior.jpg',
     'Front aspect', 'Detached bungalow at 9 Meadow Walk', 0, v_agent_id, v_now),
    ('cccccccc-0013-0002-0013-cccccccccccc', 'bbbbbbbb-0013-0013-0013-bbbbbbbbbbbb', 'image',
     '/images/demo/property-13-garden.jpg', '/images/demo/thumbs/property-13-garden.jpg',
     'Wraparound garden', 'Generous garden with mature planting', 1, v_agent_id, v_now),

    -- Property 14: Shoreditch new build (2 images)
    ('cccccccc-0014-0001-0014-cccccccccccc', 'bbbbbbbb-0014-0014-0014-bbbbbbbbbbbb', 'image',
     '/images/demo/property-14-exterior.jpg', '/images/demo/thumbs/property-14-exterior.jpg',
     'The Stage development', 'Landmark new-build tower in Shoreditch', 0, v_agent_id, v_now),
    ('cccccccc-0014-0002-0014-cccccccccccc', 'bbbbbbbb-0014-0014-0014-bbbbbbbbbbbb', 'image',
     '/images/demo/property-14-living.jpg', '/images/demo/thumbs/property-14-living.jpg',
     'Open-plan studio', 'Modern living space with city views', 1, v_agent_id, v_now),

    -- Property 15: Battersea maisonette (1 image + floor plan)
    ('cccccccc-0015-0001-0015-cccccccccccc', 'bbbbbbbb-0015-0015-0015-bbbbbbbbbbbb', 'image',
     '/images/demo/property-15-exterior.jpg', '/images/demo/thumbs/property-15-exterior.jpg',
     'Period conversion', 'Victorian maisonette on Lavender Hill', 0, v_agent_id, v_now),
    ('cccccccc-0015-0002-0015-cccccccccccc', 'bbbbbbbb-0015-0015-0015-bbbbbbbbbbbb', 'floor_plan',
     '/images/demo/property-15-floorplan.jpg', NULL,
     'Split-level plan', 'Floor plan for 14 Lavender Hill maisonette', 1, v_agent_id, v_now),

    -- Property 16: Hove detached (2 images)
    ('cccccccc-0016-0001-0016-cccccccccccc', 'bbbbbbbb-0016-0016-0016-bbbbbbbbbbbb', 'image',
     '/images/demo/property-16-exterior.jpg', '/images/demo/thumbs/property-16-exterior.jpg',
     'Edwardian frontage', 'Detached house at 22 The Drive, Hove', 0, v_agent_id, v_now),
    ('cccccccc-0016-0002-0016-cccccccccccc', 'bbbbbbbb-0016-0016-0016-bbbbbbbbbbbb', 'image',
     '/images/demo/property-16-garden.jpg', '/images/demo/thumbs/property-16-garden.jpg',
     '100ft garden', 'South-facing rear garden in Hove', 1, v_agent_id, v_now),

    -- Property 17: Shoreditch studio (1 image)
    ('cccccccc-0017-0001-0017-cccccccccccc', 'bbbbbbbb-0017-0017-0017-bbbbbbbbbbbb', 'image',
     '/images/demo/property-17-interior.jpg', '/images/demo/thumbs/property-17-interior.jpg',
     'Mezzanine studio', 'Open-plan studio with mezzanine sleeping area', 0, v_agent_id, v_now),

    -- Property 18: Northcote Road (2 images)
    ('cccccccc-0018-0001-0018-cccccccccccc', 'bbbbbbbb-0018-0018-0018-bbbbbbbbbbbb', 'image',
     '/images/demo/property-18-exterior.jpg', '/images/demo/thumbs/property-18-exterior.jpg',
     'Victorian terrace', 'Period terrace on Northcote Road', 0, v_agent_id, v_now),
    ('cccccccc-0018-0002-0018-cccccccccccc', 'bbbbbbbb-0018-0018-0018-bbbbbbbbbbbb', 'image',
     '/images/demo/property-18-kitchen.jpg', '/images/demo/thumbs/property-18-kitchen.jpg',
     'Kitchen-diner', 'Extended kitchen opening to garden', 1, v_agent_id, v_now),

    -- Property 19: Dulwich detached (3 images + floor plan)
    ('cccccccc-0019-0001-0019-cccccccccccc', 'bbbbbbbb-0019-0019-0019-bbbbbbbbbbbb', 'image',
     '/images/demo/property-19-exterior.jpg', '/images/demo/thumbs/property-19-exterior.jpg',
     'Double-fronted home', 'Imposing detached house on College Road', 0, v_agent_id, v_now),
    ('cccccccc-0019-0002-0019-cccccccccccc', 'bbbbbbbb-0019-0019-0019-bbbbbbbbbbbb', 'image',
     '/images/demo/property-19-living.jpg', '/images/demo/thumbs/property-19-living.jpg',
     'Drawing room', 'Elegant reception room with period features', 1, v_agent_id, v_now),
    ('cccccccc-0019-0003-0019-cccccccccccc', 'bbbbbbbb-0019-0019-0019-bbbbbbbbbbbb', 'image',
     '/images/demo/property-19-garden.jpg', '/images/demo/thumbs/property-19-garden.jpg',
     'Mature gardens', 'Landscaped gardens with sweeping lawn', 2, v_agent_id, v_now),
    ('cccccccc-0019-0004-0019-cccccccccccc', 'bbbbbbbb-0019-0019-0019-bbbbbbbbbbbb', 'floor_plan',
     '/images/demo/property-19-floorplan.jpg', NULL,
     'Ground and first floor', 'Floor plan for 7 College Road, Dulwich', 3, v_agent_id, v_now),

    -- Property 20: Richmond flat (1 image)
    ('cccccccc-0020-0001-0020-cccccccccccc', 'bbbbbbbb-0020-0020-0020-bbbbbbbbbbbb', 'image',
     '/images/demo/property-20-exterior.jpg', '/images/demo/thumbs/property-20-exterior.jpg',
     'Period building', 'Victorian building on Hill Rise, Richmond', 0, v_agent_id, v_now),

    -- Property 21: Wimbledon terrace (2 images)
    ('cccccccc-0021-0001-0021-cccccccccccc', 'bbbbbbbb-0021-0021-0021-bbbbbbbbbbbb', 'image',
     '/images/demo/property-21-exterior.jpg', '/images/demo/thumbs/property-21-exterior.jpg',
     'Edwardian terrace', 'Period mid-terrace on Lancaster Road', 0, v_agent_id, v_now),
    ('cccccccc-0021-0002-0021-cccccccccccc', 'bbbbbbbb-0021-0021-0021-bbbbbbbbbbbb', 'image',
     '/images/demo/property-21-garden.jpg', '/images/demo/thumbs/property-21-garden.jpg',
     '50ft garden', 'Rear garden backing onto allotments', 1, v_agent_id, v_now),

    -- Property 22: Hackney flat (2 images)
    ('cccccccc-0022-0001-0022-cccccccccccc', 'bbbbbbbb-0022-0022-0022-bbbbbbbbbbbb', 'image',
     '/images/demo/property-22-exterior.jpg', '/images/demo/thumbs/property-22-exterior.jpg',
     'Period conversion', 'Victorian building on Mare Street', 0, v_agent_id, v_now),
    ('cccccccc-0022-0002-0022-cccccccccccc', 'bbbbbbbb-0022-0022-0022-bbbbbbbbbbbb', 'image',
     '/images/demo/property-22-living.jpg', '/images/demo/thumbs/property-22-living.jpg',
     'Top-floor living', 'Open-plan living with skyline views', 1, v_agent_id, v_now)

  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Property media inserted (48 rows, ON CONFLICT DO NOTHING).';

  -- ===========================================================================
  -- Summary
  -- ===========================================================================
  RAISE NOTICE '=== Properties & Listings Seed: Complete ===';
  RAISE NOTICE 'Properties: 22 (15 sale, 7 rent)';
  RAISE NOTICE 'Listings: 22 (11 active, 3 under_offer, 3 sold, 1 let, 4 active rentals)';
  RAISE NOTICE 'Media: 48 items (44 images, 4 floor plans)';

END $$;
