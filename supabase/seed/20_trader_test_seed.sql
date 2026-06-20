-- =============================================================================
-- 20_trader_test_seed.sql — TrueDeed / Marketplace Trader Test Data
-- =============================================================================
-- Populates the marketplace "service provider / trader / professional" surfaces
-- with realistic synthetic UK (West London / Ealing) test data so every platform
-- function can be exercised: directory, category pages, profile pages, search,
-- filters (rating / verification / accreditation / location), reviews, leads,
-- provider dashboards and admin approval queues.
--
-- SAFETY / IDENTIFICATION
--   * Every seeded auth user has email  <key>@seed.truedeed.test
--   * Every seeded auth user carries     raw_user_meta_data->>'is_test' = 'true'
--     and  raw_user_meta_data->>'seed_batch_id' = 'traders_test_seed_2026_06_17'
--   * Every provider slug is prefixed     seed-<category>-NN
--   * Deterministic UUIDs (md5-derived) => fully idempotent (ON CONFLICT DO NOTHING)
--
-- ROLLBACK
--   See 20_trader_test_seed_rollback.sql  (single cascade delete on the email domain).
--
-- TARGET: confirmed dev/test Supabase project. Run via:
--   psql "$SUPABASE_DB_URL" -f supabase/seed/20_trader_test_seed.sql
-- =============================================================================

DO $$
DECLARE
  v_batch      TEXT        := 'traders_test_seed_2026_06_17';
  v_domain     TEXT        := '@seed.truedeed.test';
  v_password   TEXT        := crypt('SeedPass123!', gen_salt('bf'));
  v_now        TIMESTAMPTZ := NOW();
  v_instance   UUID        := '00000000-0000-0000-0000-000000000000';

  -- shared synthetic name pools (West-London flavoured, fully fictional)
  v_surnames   TEXT[] := ARRAY[
    'Whitmore','Okafor','Patel','Nguyen','Kowalski','Reyes','Hassan','Brennan',
    'Lindqvist','Adeyemi','Carrington','Dunne','Esposito','Farrukh','Goodwin','Haines'];
  v_firstnames TEXT[] := ARRAY[
    'James','Aisha','Tomasz','Maria','Daniel','Priya','Samuel','Grace',
    'Liam','Fatima','Olivia','Noah','Zara','Ethan','Chloe','Raj'];
  -- Ofcom-reserved fictional drama numbers (020 7946 0xxx) => safe fake phones
  v_postcodes  TEXT[] := ARRAY['W3','W4','W5','W7','W12','W13','UB1','UB2','UB5','UB6','TW8','NW10','HA0','SW6'];

  -- per-category configuration  (all 20 service_category enum values)
  -- cols: enum, business suffix, badge label, badge type, accreditation, 3 service names, pricing
  v_cats       JSONB := '[
    {"cat":"plumber",            "suffix":"Plumbing & Heating", "badge":"Gas Safe Registered","btype":"gas_safe",  "accr":["Gas Safe","CIPHE"],        "svc":["Boiler installation","Emergency leak repair","Bathroom plumbing"]},
    {"cat":"electrician",        "suffix":"Electrical",         "badge":"NICEIC Approved",     "btype":"niceic",    "accr":["NICEIC","Part P"],         "svc":["EICR inspection","Consumer unit upgrade","Rewires & sockets"]},
    {"cat":"builder",            "suffix":"Building Contractors","badge":"FMB Member",          "btype":"fmb",       "accr":["FMB","CSCS"],              "svc":["Extensions","Loft conversion","Structural works"]},
    {"cat":"carpenter",          "suffix":"Carpentry & Joinery","badge":"Guild of Master Craftsmen","btype":"gomc","accr":["GMC"],                  "svc":["Fitted wardrobes","Door hanging","Bespoke shelving"]},
    {"cat":"plasterer",          "suffix":"Plastering",         "badge":"CSCS Card Holder",    "btype":"cscs",      "accr":["CSCS"],                    "svc":["Skim & re-plaster","Rendering","Coving & cornice"]},
    {"cat":"painter",            "suffix":"Painting & Decorating","badge":"Dulux Select",      "btype":"dulux",     "accr":["Dulux Select"],            "svc":["Interior painting","Exterior masonry","Wallpapering"]},
    {"cat":"landscaping",        "suffix":"Landscapes & Gardens","badge":"APL Accredited",     "btype":"apl",       "accr":["APL"],                     "svc":["Garden design","Patios & decking","Turfing & maintenance"]},
    {"cat":"cleaning",           "suffix":"Cleaning Services",  "badge":"Checkatrade Vetted",  "btype":"checkatrade","accr":["BICSc"],                 "svc":["End of tenancy clean","Deep clean","Regular domestic"]},
    {"cat":"handyman",           "suffix":"Handyman Services",  "badge":"DBS Checked",         "btype":"dbs",       "accr":["DBS"],                     "svc":["Flat-pack assembly","Odd jobs","Picture & shelf hanging"]},
    {"cat":"locksmith",          "suffix":"Locksmiths",         "badge":"MLA Approved",        "btype":"mla",       "accr":["MLA"],                     "svc":["Emergency lockout","Lock upgrades","uPVC door repair"]},
    {"cat":"pest_control",       "suffix":"Pest Control",       "badge":"BPCA Member",         "btype":"bpca",      "accr":["BPCA"],                    "svc":["Rodent control","Wasp nest removal","Bed bug treatment"]},
    {"cat":"surveying",          "suffix":"Chartered Surveyors","badge":"RICS Regulated",      "btype":"rics",      "accr":["RICS"],                    "svc":["Level 2 HomeBuyer survey","Level 3 building survey","Valuation"]},
    {"cat":"architect",          "suffix":"Architects",         "badge":"ARB Registered",      "btype":"arb",       "accr":["ARB","RIBA"],              "svc":["Planning drawings","Building regs package","Full design service"]},
    {"cat":"conveyancing",       "suffix":"Conveyancing",       "badge":"CLC Regulated",       "btype":"clc",       "accr":["CLC","SRA"],               "svc":["Sale conveyancing","Purchase conveyancing","Remortgage"]},
    {"cat":"mortgage_broker",    "suffix":"Mortgage Advisers",  "badge":"FCA Authorised",      "btype":"fca",       "accr":["FCA","CeMAP"],             "svc":["First-time buyer mortgage","Remortgage advice","Buy-to-let mortgage"]},
    {"cat":"home_inspector",     "suffix":"Property Inspections","badge":"Elmhurst Accredited","btype":"elmhurst", "accr":["Elmhurst"],                "svc":["EPC assessment","Damp & timber report","Snagging inspection"]},
    {"cat":"interior_design",    "suffix":"Interiors",          "badge":"BIID Member",         "btype":"biid",      "accr":["BIID"],                    "svc":["Full interior design","Colour & styling","Space planning"]},
    {"cat":"property_management","suffix":"Property Management", "badge":"ARLA Propertymark",   "btype":"arla",      "accr":["ARLA"],                    "svc":["Full management","Let-only service","Block management"]},
    {"cat":"moving_company",     "suffix":"Removals",           "badge":"BAR Member",          "btype":"bar",       "accr":["BAR"],                     "svc":["Home removals","Packing service","Storage"]},
    {"cat":"other",              "suffix":"Property Services",  "badge":"Checkatrade Vetted",  "btype":"checkatrade","accr":["Checkatrade"],           "svc":["Roofing repairs","Drainage & guttering","Glazing & windows"]}
  ]'::jsonb;

  -- per-index verification state + completeness matrix (index 1..10)
  -- 1-5 verified, 6-7 pending_review, 8 rejected, 9 unverified(incomplete), 10 suspended
  v_states     TEXT[] := ARRAY['verified','verified','verified','verified','verified',
                               'pending_review','pending_review','rejected','unverified','suspended'];
  -- review counts by index => exercises >5 marketplace gate, rating filter, empty-review case
  v_reviewN    INT[]  := ARRAY[15, 8, 4, 1, 0, 0, 0, 0, 0, 0];

  v_cat        JSONB;
  v_cat_idx    INT;
  v_i          INT;
  v_r          INT;
  v_state      TEXT;
  v_uid        UUID;
  v_email      TEXT;
  v_fullname   TEXT;
  v_business   TEXT;
  v_slug       TEXT;
  v_pcs        TEXT[];
  v_phone      TEXT;
  v_svc        JSONB;
  v_cust_uid   UUID;
  v_bk_id      UUID;
  v_rating     INT;
  v_try        INT;
  v_n_cust     INT := 25;
BEGIN
  RAISE NOTICE '=== Trader Test Seed (%) starting ===', v_batch;

  -- ===========================================================================
  -- 0. CUSTOMERS (review authors + lead submitters) — 25 shared homebuyers
  -- ===========================================================================
  FOR v_i IN 1..v_n_cust LOOP
    v_uid   := md5('seed:customer:' || v_i)::uuid;
    v_email := 'customer' || lpad(v_i::text, 2, '0') || v_domain;
    v_fullname := v_firstnames[1 + (v_i % array_length(v_firstnames,1))] || ' ' ||
                  v_surnames[1 + ((v_i * 3) % array_length(v_surnames,1))];

    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
                            email_confirmed_at, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, recovery_token)
    VALUES (v_uid, v_instance, 'authenticated', 'authenticated', v_email, v_password, v_now,
            jsonb_build_object('full_name', v_fullname, 'role', 'homebuyer',
                               'is_test', true, 'seed_batch_id', v_batch),
            v_now, v_now, '', '')
    ON CONFLICT (id) DO NOTHING;

    UPDATE profiles SET display_name = v_fullname, active_role = 'homebuyer'::user_role,
                        updated_at = v_now
    WHERE id = v_uid;

    INSERT INTO user_roles (id, user_id, role, granted_at)
    VALUES (gen_random_uuid(), v_uid, 'homebuyer'::user_role, v_now)
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
  RAISE NOTICE 'Customers ready (% homebuyers).', v_n_cust;

  -- ===========================================================================
  -- 1. PROVIDERS — 10 per category × 20 categories = 200 providers
  -- ===========================================================================
  v_cat_idx := 0;
  FOR v_cat IN SELECT * FROM jsonb_array_elements(v_cats) LOOP
    v_cat_idx := v_cat_idx + 1;

    FOR v_i IN 1..10 LOOP
      v_state    := v_states[v_i];
      v_uid      := md5('seed:provider:' || (v_cat->>'cat') || ':' || v_i)::uuid;
      v_email    := (v_cat->>'cat') || lpad(v_i::text, 2, '0') || v_domain;
      v_fullname := v_firstnames[1 + ((v_cat_idx + v_i) % array_length(v_firstnames,1))] || ' ' ||
                    v_surnames[1 + ((v_cat_idx * 5 + v_i) % array_length(v_surnames,1))];
      v_business := v_surnames[1 + ((v_cat_idx * 5 + v_i) % array_length(v_surnames,1))] || ' ' || (v_cat->>'suffix');
      v_slug     := 'seed-' || replace(v_cat->>'cat','_','-') || '-' || lpad(v_i::text, 2, '0');
      v_phone    := '+44 20 7946 ' || lpad((((v_cat_idx * 137 + v_i * 7) % 1000))::text, 4, '0');
      -- 1 postcode for incomplete (idx 9); 1-3 otherwise
      IF v_i = 9 THEN
        v_pcs := ARRAY[v_postcodes[1 + (v_cat_idx % array_length(v_postcodes,1))]];
      ELSE
        v_pcs := ARRAY[
          v_postcodes[1 + (v_cat_idx % array_length(v_postcodes,1))],
          v_postcodes[1 + ((v_cat_idx + v_i) % array_length(v_postcodes,1))],
          v_postcodes[1 + ((v_cat_idx + v_i * 2) % array_length(v_postcodes,1))]];
      END IF;

      -- 1a. auth user (+ trigger creates profile)
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
                              email_confirmed_at, raw_user_meta_data, created_at, updated_at,
                              confirmation_token, recovery_token)
      VALUES (v_uid, v_instance, 'authenticated', 'authenticated', v_email, v_password, v_now,
              jsonb_build_object('full_name', v_fullname, 'role', 'service_provider',
                                 'is_test', true, 'seed_batch_id', v_batch),
              v_now, v_now, '', '')
      ON CONFLICT (id) DO NOTHING;

      -- 1b. profile: role, verification state, phone (+ suspension for suspended)
      UPDATE profiles
      SET display_name = v_fullname,
          active_role = 'service_provider'::user_role,
          verification_level = 'professional'::verification_level,
          phone = v_phone,
          provider_verification_status = v_state::provider_verification_status,
          suspended_until = CASE WHEN v_state = 'suspended' THEN v_now + INTERVAL '30 days' ELSE NULL END,
          updated_at = v_now
      WHERE id = v_uid;

      INSERT INTO user_roles (id, user_id, role, granted_at)
      VALUES (gen_random_uuid(), v_uid, 'service_provider'::user_role, v_now)
      ON CONFLICT (user_id, role) DO NOTHING;

      -- 1c. service_provider_details (the listing).
      --     Incomplete profile (idx 9) gets minimal data; others full.
      INSERT INTO service_provider_details (
        user_id, business_name, business_description, trading_name,
        services, service_postcodes, service_radius, base_location,
        pricing, qualifications, accreditations,
        slug, website_url, years_in_business, completed_jobs_count, response_time_hours,
        created_at, updated_at)
      VALUES (
        v_uid,
        v_business,
        CASE WHEN v_i = 9 THEN NULL ELSE
          v_business || ' is an established ' || (v_cat->>'suffix') ||
          ' business serving Ealing and West London. ' ||
          'We combine reliable, punctual service with transparent pricing and a fully accredited team.' END,
        CASE WHEN v_i IN (9,10) THEN NULL ELSE v_business END,
        ('{' || (v_cat->>'cat') || '}')::service_category[],
        v_pcs,
        CASE WHEN v_i = 9 THEN 10 ELSE 15 + (v_i * 2) END,
        CASE WHEN v_i = 9 THEN NULL
             ELSE ST_SetSRID(ST_MakePoint(-0.301 + (v_i::float/200), 51.513 + (v_cat_idx::float/400)), 4326)::geography END,
        CASE WHEN v_i = 9 THEN '{}'::jsonb
             ELSE jsonb_build_object('callout_fee', 45 + v_i, 'hourly_rate', 55 + (v_i*5), 'currency','GBP') END,
        CASE WHEN v_i = 9 THEN NULL
             ELSE ARRAY(SELECT jsonb_array_elements_text(v_cat->'accr')) || ARRAY['10+ years experience'] END,
        CASE WHEN v_i = 9 THEN NULL
             ELSE ARRAY(SELECT jsonb_array_elements_text(v_cat->'accr')) END,
        v_slug,
        CASE WHEN v_i = 9 THEN NULL ELSE 'https://www.' || replace(lower(v_business),' ','') || '.seed.test' END,
        CASE WHEN v_i = 9 THEN 0 ELSE 5 + v_i END,
        CASE WHEN v_i = 9 THEN 0 ELSE 20 + (v_i * 13) END,
        CASE WHEN v_i = 9 THEN NULL ELSE (1.0 + (v_i % 5))::numeric END,
        v_now - (v_i || ' months')::interval, v_now)
      ON CONFLICT (user_id) DO NOTHING;

      -- 1d. provider_services (skip incomplete idx 9 to test empty profile)
      IF v_i <> 9 THEN
        v_r := 0;
        FOR v_svc IN SELECT * FROM jsonb_array_elements(v_cat->'svc') LOOP
          v_r := v_r + 1;
          IF v_r <= (CASE WHEN v_i <= 5 THEN 3 ELSE 1 END) THEN
            INSERT INTO provider_services (id, provider_id, name, category, description, pricing_type, price_amount, created_at, updated_at)
            VALUES (
              md5('seed:svc:' || v_uid::text || ':' || v_r)::uuid,
              v_uid, trim(both '"' from v_svc::text), v_cat->>'cat',
              trim(both '"' from v_svc::text) || ' — professional ' || (v_cat->>'cat') || ' service across West London.',
              (ARRAY['fixed','hourly','quote_on_request'])[1 + (v_r % 3)],
              CASE WHEN (v_r % 3) = 2 THEN NULL ELSE (75 + v_r * 40)::numeric END,
              v_now, v_now)
            ON CONFLICT (id) DO NOTHING;
          END IF;
        END LOOP;
      END IF;

      -- 1e. provider_documents — verified=approved, pending=pending, rejected=rejected
      IF v_state IN ('verified','pending_review','rejected') THEN
        INSERT INTO provider_documents (id, user_id, document_type, file_name, file_url, file_size, mime_type, verification_status, created_at, updated_at)
        VALUES (
          md5('seed:doc:' || v_uid::text || ':1')::uuid, v_uid,
          'public_liability_insurance'::verification_document_type,
          'public-liability.pdf', 'https://storage.seed.test/' || v_slug || '/pli.pdf', 248000, 'application/pdf',
          (CASE v_state WHEN 'verified' THEN 'approved' WHEN 'rejected' THEN 'rejected' ELSE 'pending' END)::document_verification_status,
          v_now, v_now)
        ON CONFLICT (id) DO NOTHING;

        IF v_state = 'verified' THEN
          INSERT INTO provider_documents (id, user_id, document_type, file_name, file_url, file_size, mime_type, verification_status, created_at, updated_at)
          VALUES (
            md5('seed:doc:' || v_uid::text || ':2')::uuid, v_uid,
            'qualification_certificate'::verification_document_type,
            'qualification.pdf', 'https://storage.seed.test/' || v_slug || '/qual.pdf', 192000, 'application/pdf',
            'approved'::document_verification_status, v_now, v_now)
          ON CONFLICT (id) DO NOTHING;
        END IF;
      END IF;

      -- 1f. provider_badges (verified only)
      IF v_state = 'verified' THEN
        INSERT INTO provider_badges (id, provider_id, badge_type, badge_label, description, earned_at, is_active)
        VALUES (
          md5('seed:badge:' || v_uid::text)::uuid, v_uid, v_cat->>'btype', v_cat->>'badge',
          'Independently verified ' || (v_cat->>'badge') || ' status.', v_now - INTERVAL '3 months', true)
        ON CONFLICT (id) DO NOTHING;
      END IF;

      -- 1g. portfolio (top verified providers only: idx 1-3)
      IF v_i <= 3 THEN
        FOR v_r IN 1..3 LOOP
          INSERT INTO provider_portfolio_items (id, provider_id, image_url, title, description, category, sort_order, is_featured, display_order, created_at)
          VALUES (
            md5('seed:port:' || v_uid::text || ':' || v_r)::uuid, v_uid,
            'https://picsum.photos/seed/' || v_slug || v_r || '/800/600',
            'Completed project ' || v_r, 'Recent ' || (v_cat->>'cat') || ' project in West London.',
            v_cat->>'cat', v_r, (v_r = 1), v_r, v_now - (v_r || ' weeks')::interval)
          ON CONFLICT (id) DO NOTHING;
        END LOOP;
      END IF;

      -- 1h. bookings + reviews (unique booking per review; auto rating-stats trigger)
      FOR v_r IN 1..v_reviewN[v_i] LOOP
        v_cust_uid := md5('seed:customer:' || (1 + (v_r % v_n_cust)))::uuid;
        v_bk_id    := md5('seed:bk:' || v_uid::text || ':' || v_r)::uuid;
        v_rating   := GREATEST(2, 5 - (v_r % 3) - (CASE WHEN v_r % 7 = 0 THEN 2 ELSE 0 END));

        -- booking_reference is set by a BEFORE-INSERT trigger to a random suffix and
        -- collides under bulk insert; retry regenerates it. ON CONFLICT(id) keeps re-runs idempotent.
        v_try := 0;
        <<bkloop>>
        LOOP
          BEGIN
            INSERT INTO bookings (id, user_id, provider_id, scheduled_start_date, scheduled_end_date, status, created_at, updated_at)
            VALUES (v_bk_id, v_cust_uid, v_uid,
                    (v_now - ((v_r * 9) || ' days')::interval)::date,
                    (v_now - ((v_r * 9 - 1) || ' days')::interval)::date,
                    'completed'::booking_status, v_now - ((v_r*9) || ' days')::interval, v_now)
            ON CONFLICT (id) DO NOTHING;
            EXIT bkloop;
          EXCEPTION WHEN unique_violation THEN
            v_try := v_try + 1;
            IF v_try > 20 THEN RAISE; END IF;
          END;
        END LOOP;

        INSERT INTO reviews (id, booking_id, provider_id, reviewer_id, overall_rating,
                             punctuality_rating, quality_rating, value_rating, professionalism_rating,
                             title, review_text, moderation_status, created_at, updated_at)
        VALUES (
          md5('seed:rev:' || v_uid::text || ':' || v_r)::uuid, v_bk_id, v_uid, v_cust_uid, v_rating,
          v_rating, v_rating, GREATEST(2, v_rating - (v_r % 2)), v_rating,
          (ARRAY['Excellent service','Highly recommended','Professional and tidy','Good value, would use again','Reliable and punctual'])[1 + (v_r % 5)],
          'Used ' || v_business || ' for work at my property in ' || v_pcs[1] || '. ' ||
          (ARRAY['Turned up on time, clean and professional throughout.',
                 'Clear quote, no surprises, great result.',
                 'Friendly team and excellent workmanship.',
                 'Would happily recommend to neighbours.'])[1 + (v_r % 4)],
          'approved', v_now - ((v_r * 9 - 1) || ' days')::interval, v_now)
        ON CONFLICT (id) DO NOTHING;
      END LOOP;

    END LOOP; -- providers in category
  END LOOP; -- categories

  -- ===========================================================================
  -- 1i. provider_rating_stats rollup.
  --     The incremental trigger fires only on review UPDATE (approval transition),
  --     so direct inserts leave stats empty. Compute them set-based here — this is
  --     what the public profile + marketplace rail read for ratings/review counts.
  -- ===========================================================================
  INSERT INTO provider_rating_stats (
    provider_id, average_rating, total_reviews,
    avg_punctuality, avg_quality, avg_value, avg_professionalism,
    count_5_star, count_4_star, count_3_star, count_2_star, count_1_star,
    last_review_date, updated_at)
  SELECT r.provider_id,
         ROUND(AVG(r.overall_rating)::numeric, 2),
         COUNT(*),
         ROUND(AVG(r.punctuality_rating)::numeric, 2),
         ROUND(AVG(r.quality_rating)::numeric, 2),
         ROUND(AVG(r.value_rating)::numeric, 2),
         ROUND(AVG(r.professionalism_rating)::numeric, 2),
         COUNT(*) FILTER (WHERE r.overall_rating = 5),
         COUNT(*) FILTER (WHERE r.overall_rating = 4),
         COUNT(*) FILTER (WHERE r.overall_rating = 3),
         COUNT(*) FILTER (WHERE r.overall_rating = 2),
         COUNT(*) FILTER (WHERE r.overall_rating = 1),
         MAX(r.created_at), v_now
  FROM reviews r
  JOIN service_provider_details s ON s.user_id = r.provider_id
  WHERE s.slug LIKE 'seed-%'
  GROUP BY r.provider_id
  ON CONFLICT (provider_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    avg_punctuality = EXCLUDED.avg_punctuality,
    avg_quality = EXCLUDED.avg_quality,
    avg_value = EXCLUDED.avg_value,
    avg_professionalism = EXCLUDED.avg_professionalism,
    count_5_star = EXCLUDED.count_5_star,
    count_4_star = EXCLUDED.count_4_star,
    count_3_star = EXCLUDED.count_3_star,
    count_2_star = EXCLUDED.count_2_star,
    count_1_star = EXCLUDED.count_1_star,
    last_review_date = EXCLUDED.last_review_date,
    updated_at = EXCLUDED.updated_at;

  -- ===========================================================================
  -- 2. SERVICE REQUESTS (open leads) — 40, to test lead routing / dashboards
  -- ===========================================================================
  FOR v_i IN 1..40 LOOP
    v_cat     := v_cats -> (v_i % jsonb_array_length(v_cats));
    v_cust_uid := md5('seed:customer:' || (1 + (v_i % v_n_cust)))::uuid;
    INSERT INTO service_requests (id, user_id, service_category, title, description, property_postcode,
                                  urgency_level, status, budget_min, budget_max, created_at, updated_at)
    VALUES (
      md5('seed:rfq:' || v_i)::uuid, v_cust_uid, (v_cat->>'cat')::service_category,
      (v_cat->>'suffix') || ' needed in ' || v_postcodes[1 + (v_i % array_length(v_postcodes,1))],
      'Looking for a trusted local professional for a ' || (v_cat->>'cat') || ' job. Please quote.',
      v_postcodes[1 + (v_i % array_length(v_postcodes,1))] || ' ' || (v_i % 9) || 'AA',
      (ARRAY['low','normal','high','emergency'])[1 + (v_i % 4)],
      (ARRAY['open','quotes_received'])[1 + (v_i % 2)]::rfq_status,
      (200 + v_i * 10)::numeric, (800 + v_i * 50)::numeric,
      v_now - ((v_i) || ' days')::interval, v_now)
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  RAISE NOTICE '=== Trader Test Seed complete: 200 providers, % customers, 40 leads ===', v_n_cust;
END $$;
