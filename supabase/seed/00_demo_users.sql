-- =============================================================================
-- 00_demo_users.sql — Demo Users Seed Data
-- =============================================================================
-- Creates 7 demo users (one per role) with hardcoded UUIDs.
-- ALL other seed files depend on these users existing.
--
-- Users:
--   Buyer:    11111111-1111-1111-1111-111111111111  James Wilson
--   Renter:   22222222-2222-2222-2222-222222222222  Sophie Chen
--   Seller:   33333333-3333-3333-3333-333333333333  David Okonkwo
--   Landlord: 44444444-4444-4444-4444-444444444444  Mike Thompson
--   Agent:    55555555-5555-5555-5555-555555555555  Sarah Mitchell
--   Provider: 66666666-6666-6666-6666-666666666666  Tom Richards
--   Admin:    77777777-7777-7777-7777-777777777777  Admin User
--
-- Password for all: DemoPass123!
-- Idempotent: safe to run multiple times.
-- =============================================================================

-- Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_buyer_id    UUID := '11111111-1111-1111-1111-111111111111';
  v_renter_id   UUID := '22222222-2222-2222-2222-222222222222';
  v_seller_id   UUID := '33333333-3333-3333-3333-333333333333';
  v_landlord_id UUID := '44444444-4444-4444-4444-444444444444';
  v_agent_id    UUID := '55555555-5555-5555-5555-555555555555';
  v_provider_id UUID := '66666666-6666-6666-6666-666666666666';
  v_admin_id    UUID := '77777777-7777-7777-7777-777777777777';
  v_password    TEXT;
  v_now         TIMESTAMPTZ := NOW();
BEGIN

  -- Pre-compute the hashed password once
  v_password := crypt('DemoPass123!', gen_salt('bf'));

  RAISE NOTICE '=== Demo Users Seed: Starting ===';

  -- ===========================================================================
  -- 1. INSERT INTO auth.users
  -- ===========================================================================
  RAISE NOTICE 'Creating auth.users...';

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token
  ) VALUES
    -- Buyer: James Wilson
    (
      v_buyer_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'james.buyer@demo.britestate.co.uk',
      v_password,
      v_now,
      jsonb_build_object('display_name', 'James Wilson', 'role', 'homebuyer'),
      v_now, v_now, '', ''
    ),
    -- Renter: Sophie Chen
    (
      v_renter_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'sophie.renter@demo.britestate.co.uk',
      v_password,
      v_now,
      jsonb_build_object('display_name', 'Sophie Chen', 'role', 'renter'),
      v_now, v_now, '', ''
    ),
    -- Seller: David Okonkwo
    (
      v_seller_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'david.seller@demo.britestate.co.uk',
      v_password,
      v_now,
      jsonb_build_object('display_name', 'David Okonkwo', 'role', 'seller'),
      v_now, v_now, '', ''
    ),
    -- Landlord: Mike Thompson
    (
      v_landlord_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'mike.landlord@demo.britestate.co.uk',
      v_password,
      v_now,
      jsonb_build_object('display_name', 'Mike Thompson', 'role', 'landlord'),
      v_now, v_now, '', ''
    ),
    -- Agent: Sarah Mitchell
    (
      v_agent_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'sarah.agent@demo.britestate.co.uk',
      v_password,
      v_now,
      jsonb_build_object('display_name', 'Sarah Mitchell', 'role', 'agent'),
      v_now, v_now, '', ''
    ),
    -- Provider: Tom Richards
    (
      v_provider_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'tom.provider@demo.britestate.co.uk',
      v_password,
      v_now,
      jsonb_build_object('display_name', 'Tom Richards', 'role', 'service_provider'),
      v_now, v_now, '', ''
    ),
    -- Admin: Admin User
    (
      v_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'admin@demo.britestate.co.uk',
      v_password,
      v_now,
      jsonb_build_object('display_name', 'Admin User', 'role', 'admin'),
      v_now, v_now, '', ''
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'auth.users created (or already exist).';

  -- ===========================================================================
  -- 2. INSERT INTO profiles
  -- ===========================================================================
  RAISE NOTICE 'Creating profiles...';

  INSERT INTO profiles (id, display_name, active_role, verification_level, avatar_url, is_admin, created_at, updated_at)
  VALUES
    (v_buyer_id,    'James Wilson',   'homebuyer'::user_role,        'standard'::verification_level,     NULL, FALSE, v_now, v_now),
    (v_renter_id,   'Sophie Chen',    'renter'::user_role,           'standard'::verification_level,     NULL, FALSE, v_now, v_now),
    (v_seller_id,   'David Okonkwo',  'seller'::user_role,           'enhanced'::verification_level,     NULL, FALSE, v_now, v_now),
    (v_landlord_id, 'Mike Thompson',  'landlord'::user_role,         'enhanced'::verification_level,     NULL, FALSE, v_now, v_now),
    (v_agent_id,    'Sarah Mitchell', 'agent'::user_role,            'professional'::verification_level, NULL, FALSE, v_now, v_now),
    (v_provider_id, 'Tom Richards',   'service_provider'::user_role, 'professional'::verification_level, NULL, FALSE, v_now, v_now),
    (v_admin_id,    'Admin User',     'homebuyer'::user_role,        'professional'::verification_level, NULL, TRUE,  v_now, v_now)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'profiles created.';

  -- ===========================================================================
  -- 3. INSERT INTO user_roles
  -- ===========================================================================
  RAISE NOTICE 'Creating user_roles...';

  INSERT INTO user_roles (id, user_id, role, granted_at)
  VALUES
    (gen_random_uuid(), v_buyer_id,    'homebuyer'::user_role,        v_now),
    (gen_random_uuid(), v_renter_id,   'renter'::user_role,           v_now),
    (gen_random_uuid(), v_seller_id,   'seller'::user_role,           v_now),
    (gen_random_uuid(), v_landlord_id, 'landlord'::user_role,         v_now),
    (gen_random_uuid(), v_agent_id,    'agent'::user_role,            v_now),
    (gen_random_uuid(), v_provider_id, 'service_provider'::user_role, v_now),
    -- Admin gets homebuyer role as base
    (gen_random_uuid(), v_admin_id,    'homebuyer'::user_role,        v_now)
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'user_roles created.';

  -- ===========================================================================
  -- 4. Agent-specific: agent_agency_profiles
  -- ===========================================================================
  RAISE NOTICE 'Creating agent_agency_profiles for Sarah Mitchell...';

  INSERT INTO agent_agency_profiles (
    id, agent_id, agency_name,
    contact_email, contact_phone,
    address_line_1, address_line_2, city, postcode,
    description, specializations, coverage_areas,
    website_url,
    created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_agent_id,
    'Mitchell & Partners Estate Agents',
    'sarah.agent@demo.britestate.co.uk',
    '+44 20 7946 0958',
    '42 Kensington High Street', NULL, 'London', 'W8 4PT',
    'Award-winning estate agency specialising in premium residential sales and lettings across West London. With over 15 years of experience, Mitchell & Partners offers bespoke property services backed by deep local market knowledge.',
    ARRAY['residential_sales', 'lettings'],
    ARRAY['Kensington', 'Chelsea', 'Notting Hill', 'Primrose Hill'],
    'https://www.mitchellpartners.demo.co.uk',
    v_now, v_now
  )
  ON CONFLICT (agent_id) DO NOTHING;

  RAISE NOTICE 'agent_agency_profiles created.';

  -- ===========================================================================
  -- 5. Agent-specific: agent_profiles
  -- ===========================================================================
  RAISE NOTICE 'Creating agent_profiles for Sarah Mitchell...';

  INSERT INTO agent_profiles (
    id, agency_name, areas_covered,
    fee_percentage, average_rating, review_count,
    sold_count, average_days_to_sell, bio,
    slug,
    created_at, updated_at
  ) VALUES (
    v_agent_id,
    'Mitchell & Partners',
    ARRAY['Kensington', 'Chelsea', 'Notting Hill', 'Primrose Hill'],
    1.5, 4.7, 23,
    156, 42,
    'Sarah Mitchell is a senior partner at Mitchell & Partners, bringing 15 years of experience in London''s premium residential market. Known for her meticulous attention to detail and outstanding client communication, Sarah consistently achieves above-asking-price results.',
    'sarah-mitchell',
    v_now, v_now
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'agent_profiles created.';

  -- ===========================================================================
  -- 6. Provider-specific: service_provider_details
  -- ===========================================================================
  RAISE NOTICE 'Creating service_provider_details for Tom Richards...';

  INSERT INTO service_provider_details (
    user_id, business_name, business_description,
    services, service_postcodes, service_radius,
    slug, website_url,
    years_in_business, completed_jobs_count, response_time_hours,
    created_at, updated_at
  ) VALUES (
    v_provider_id,
    'Richards Plumbing & Heating',
    'Trusted plumbing and heating specialists serving West and Central London. Gas Safe registered with over a decade of experience in residential and commercial plumbing, boiler installations, and emergency repairs. We pride ourselves on transparent pricing and reliable, punctual service.',
    '{plumber}'::service_category[],
    '{W8, NW1, SW7, W11}'::TEXT[],
    15,
    'richards-plumbing-heating',
    'https://www.richardsplumbing.demo.co.uk',
    12, 347, 2.5,
    v_now, v_now
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Set provider verification status on the profile
  UPDATE profiles
  SET provider_verification_status = 'verified'::provider_verification_status
  WHERE id = v_provider_id;

  RAISE NOTICE 'service_provider_details created.';

  -- ===========================================================================
  -- Done
  -- ===========================================================================
  RAISE NOTICE '=== Demo Users Seed: Complete ===';
  RAISE NOTICE 'Created 7 demo users with password: DemoPass123!';
  RAISE NOTICE 'Buyer:    % (James Wilson)',    v_buyer_id;
  RAISE NOTICE 'Renter:   % (Sophie Chen)',     v_renter_id;
  RAISE NOTICE 'Seller:   % (David Okonkwo)',   v_seller_id;
  RAISE NOTICE 'Landlord: % (Mike Thompson)',   v_landlord_id;
  RAISE NOTICE 'Agent:    % (Sarah Mitchell)',  v_agent_id;
  RAISE NOTICE 'Provider: % (Tom Richards)',    v_provider_id;
  RAISE NOTICE 'Admin:    % (Admin User)',      v_admin_id;

END $$;
