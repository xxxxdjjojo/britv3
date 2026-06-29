-- =============================================================================
-- 30_new_homes_demo.sql — New Homes / New Build demo data
-- =============================================================================
-- 5 regional developers, 6 developments, ~70 units, and realistic leads so the
-- public /new-homes pages and the developer dashboard are demonstrable.
--
-- Demo developer login (member of "Calthorpe Homes"):
--   developer@demo.truedeed.co.uk / DemoPass123!
--   → visit /dashboard/developer to see leads + conversion metrics.
--
-- LOCAL-ONLY: run against the local stack (`supabase db reset` or psql). Do NOT
-- push to production — these are non-real demo schemes. Idempotent.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fixed UUIDs ----------------------------------------------------------------
-- Developer user:  88888888-8888-8888-8888-888888888888
-- Developers:      a0..a4 ; Developments: b0..b5
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  v_dev_user UUID := '88888888-8888-8888-8888-888888888888';
  v_now      TIMESTAMPTZ := NOW();
BEGIN
  -- Demo developer auth user.
  -- NOTE: email_change / email_change_token_new and raw_app_meta_data have no
  -- table default and MUST be set to '' / a JSON object. Hosted GoTrue scans
  -- these as non-nullable strings during the password grant — leaving them NULL
  -- causes a 500 "Database error querying schema" at login (the local stack
  -- tolerates NULL, so this only bites on a real Supabase project).
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) VALUES (
    v_dev_user,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'developer@demo.truedeed.co.uk',
    crypt('DemoPass123!', gen_salt('bf')),
    v_now,
    jsonb_build_object('display_name', 'Priya Sharma', 'role', 'seller'),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    v_now, v_now, '', '', '', '', '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (id, display_name, active_role, verification_level, is_admin, created_at, updated_at)
  VALUES (v_dev_user, 'Priya Sharma', 'seller'::user_role, 'professional'::verification_level, FALSE, v_now, v_now)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_roles (id, user_id, role, granted_at)
  VALUES (gen_random_uuid(), v_dev_user, 'seller'::user_role, v_now)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Email identity — hosted GoTrue requires this for password sign-in.
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), v_dev_user, v_dev_user::text, 'email',
    jsonb_build_object('sub', v_dev_user::text, 'email', 'developer@demo.truedeed.co.uk', 'email_verified', true),
    v_now, v_now, v_now
  )
  ON CONFLICT DO NOTHING;
END $$;

-- Developers -----------------------------------------------------------------

INSERT INTO public.developers (id, slug, name, tagline, about, brand_colour, website_url, contact_email, year_established, homes_built, regions, created_by)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'calthorpe-homes', 'Calthorpe Homes',
   'Crafted family homes across the Midlands',
   'A Birmingham-based housebuilder delivering energy-efficient family homes and city apartments across the West Midlands since 2004. Every Calthorpe home is built to a 10-year structural warranty with a focus on low running costs.',
   '#1B4D3E', 'https://example.com/calthorpe', 'sales@calthorpe.example', 2004, 3200,
   ARRAY['West Midlands','Warwickshire'], '88888888-8888-8888-8888-888888888888'),
  ('a0000000-0000-0000-0000-000000000002', 'aire-valley-developments', 'Aire Valley Developments',
   'Modern living along the Leeds waterfront',
   'Leeds-based regeneration specialists transforming former industrial sites into characterful canal-side communities.',
   '#2D6A4F', 'https://example.com/airevalley', 'hello@airevalley.example', 2011, 1450,
   ARRAY['West Yorkshire'], '88888888-8888-8888-8888-888888888888'),
  ('a0000000-0000-0000-0000-000000000003', 'castlefield-living', 'Castlefield Living',
   'Apartments at the heart of Manchester',
   'City-centre apartment specialists delivering high-spec one and two-bed homes with concierge and shared amenity spaces.',
   '#14532D', 'https://example.com/castlefield', 'enquiries@castlefield.example', 2008, 2100,
   ARRAY['Greater Manchester'], '88888888-8888-8888-8888-888888888888'),
  ('a0000000-0000-0000-0000-000000000004', 'lockwood-homes', 'Lockwood Homes',
   'Considered homes for Coventry families',
   'A family-run builder delivering well-proportioned houses with generous gardens across Coventry and Warwickshire.',
   '#166534', 'https://example.com/lockwood', 'sales@lockwood.example', 1998, 4800,
   ARRAY['West Midlands'], '88888888-8888-8888-8888-888888888888'),
  ('a0000000-0000-0000-0000-000000000005', 'harbourside-living', 'Harbourside Living',
   'Waterfront homes in the heart of Bristol',
   'Bristol harbour-side developer creating design-led apartments with a strong sustainability commitment.',
   '#115E59', 'https://example.com/harbourside', 'team@harbourside.example', 2014, 980,
   ARRAY['Bristol','South West'], '88888888-8888-8888-8888-888888888888')
ON CONFLICT (id) DO NOTHING;

-- The demo login owns Calthorpe Homes (the showcase developer)
INSERT INTO public.developer_members (developer_id, user_id, member_role)
VALUES ('a0000000-0000-0000-0000-000000000001', '88888888-8888-8888-8888-888888888888', 'owner')
ON CONFLICT (developer_id, user_id) DO NOTHING;

-- Developments ---------------------------------------------------------------

INSERT INTO public.developments
  (id, developer_id, slug, name, summary, description, address_line, city, postcode, region,
   latitude, longitude, scheme_type, status, completion_date, help_to_buy, first_homes, shared_ownership,
   incentives, highlights, transport, schools, amenities, is_published, created_by)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'edgbaston-gardens', 'Edgbaston Gardens',
   'Three and four-bedroom family homes moments from Edgbaston village.',
   E'A collection of 3 & 4-bedroom homes set around landscaped gardens in leafy Edgbaston. Each home comes with an air-source heat pump, EV charging point and a private garden.\n\nWith Birmingham city centre 10 minutes away and excellent schools on the doorstep, Edgbaston Gardens is designed for growing families who want space without sacrificing connectivity.',
   'Wheeleys Road', 'Birmingham', 'B15 2LZ', 'West Midlands',
   52.4660, -1.9100, 'houses', 'available', '2026-09-30', TRUE, TRUE, FALSE,
   '[{"title":"£10,000 towards your deposit","detail":"On selected plots reserved before completion"},{"title":"Flooring included","detail":"Carpets and tiling throughout as standard"}]'::jsonb,
   '["Air-source heat pumps cut running costs","Walkable to Edgbaston village shops & cafes","10 minutes to Birmingham New Street","Ofsted Outstanding primary in catchment"]'::jsonb,
   '[{"name":"Five Ways Station","detail":"Rail to New Street","minutes":12},{"name":"University Station","detail":"Cross-City line","minutes":15}]'::jsonb,
   '[{"name":"Edgbaston Primary","detail":"0.4 miles","rating":"Outstanding"},{"name":"King Edward''s School","detail":"Independent","rating":"Selective"}]'::jsonb,
   '[{"name":"Morrisons Five Ways","detail":"Supermarket, 0.6 miles"},{"name":"Edgbaston Reservoir","detail":"Walking & watersports"}]'::jsonb,
   TRUE, '88888888-8888-8888-8888-888888888888'),

  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'jewellery-quarter-lofts', 'Jewellery Quarter Lofts',
   'One and two-bedroom apartments in Birmingham''s creative quarter.',
   E'Characterful loft-style apartments in a converted industrial building at the heart of the Jewellery Quarter. Exposed brick, floor-to-ceiling windows and a residents'' roof terrace.',
   'Vyse Street', 'Birmingham', 'B18 6LE', 'West Midlands',
   52.4880, -1.9120, 'apartments', 'reserved', '2026-06-30', TRUE, FALSE, TRUE,
   '[{"title":"Stamp duty paid","detail":"On 2-bed apartments reserved this quarter"}]'::jsonb,
   '["Grade II-listed industrial conversion","Residents'' roof terrace with city views","2 minutes to Jewellery Quarter station","Shared-ownership options from 40%"]'::jsonb,
   '[{"name":"Jewellery Quarter Station","detail":"Tram & rail","minutes":3},{"name":"St Paul''s Tram Stop","detail":"West Midlands Metro","minutes":5}]'::jsonb,
   '[{"name":"St Paul''s School","detail":"0.3 miles","rating":"Good"}]'::jsonb,
   '[{"name":"The Button Factory","detail":"Bar & events"},{"name":"Warehouse Cafe","detail":"Independent dining"}]'::jsonb,
   TRUE, '88888888-8888-8888-8888-888888888888'),

  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002',
   'kirkstall-forge', 'Kirkstall Forge',
   'Canal-side two and three-bed homes with their own rail station.',
   E'A landmark regeneration of a historic forge site on the River Aire, with its own railway station, riverside walks and a growing community of independent shops.',
   'Forge Lane', 'Leeds', 'LS5 3BF', 'West Yorkshire',
   53.8170, -1.6020, 'mixed', 'available', '2026-12-31', TRUE, FALSE, FALSE,
   '[{"title":"Part exchange available","detail":"We''ll buy your current home"}]'::jsonb,
   '["On-site Kirkstall Forge railway station","Riverside and woodland walks","13 minutes to Leeds city centre","Mixed houses and apartments"]'::jsonb,
   '[{"name":"Kirkstall Forge Station","detail":"On-site, rail to Leeds","minutes":2}]'::jsonb,
   '[{"name":"Kirkstall Valley Primary","detail":"0.8 miles","rating":"Good"}]'::jsonb,
   '[{"name":"Forge Yard","detail":"Cafe & co-working"}]'::jsonb,
   TRUE, '88888888-8888-8888-8888-888888888888'),

  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003',
   'ancoats-wharf', 'Ancoats Wharf',
   'High-spec apartments in Manchester''s most talked-about neighbourhood.',
   E'Contemporary one and two-bedroom apartments overlooking the Ashton Canal in Ancoats, with concierge, residents'' gym and a courtyard garden.',
   'Redhill Street', 'Manchester', 'M4 5BA', 'Greater Manchester',
   53.4850, -2.2230, 'apartments', 'available', '2027-03-31', FALSE, FALSE, FALSE,
   '[{"title":"One year''s service charge paid","detail":"On all completions before March 2027"}]'::jsonb,
   '["Canal-side location in Ancoats","Concierge and residents'' gym","8 minutes walk to NQ and city centre","Premium integrated appliances included"]'::jsonb,
   '[{"name":"New Islington Tram Stop","detail":"Metrolink","minutes":7},{"name":"Manchester Piccadilly","detail":"National rail","minutes":15}]'::jsonb,
   '[{"name":"New Islington Free School","detail":"0.5 miles","rating":"Good"}]'::jsonb,
   '[{"name":"Cutting Room Square","detail":"Bars & restaurants"},{"name":"Ancoats General Store","detail":"Deli"}]'::jsonb,
   TRUE, '88888888-8888-8888-8888-888888888888'),

  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004',
   'friargate-quarter', 'Friargate Quarter',
   'Three and four-bedroom houses beside Coventry station.',
   E'Energy-efficient family houses in the new Friargate business district, a short walk from Coventry railway station and the revitalised city centre.',
   'Friargate', 'Coventry', 'CV1 2GN', 'West Midlands',
   52.4000, -1.5130, 'houses', 'coming_soon', '2027-06-30', TRUE, TRUE, FALSE,
   '[{"title":"Early-bird pricing","detail":"Register interest for launch-day prices"}]'::jsonb,
   '["Walking distance to Coventry station","Brand-new Friargate business district","London in under an hour by rail","First Homes discount for local buyers"]'::jsonb,
   '[{"name":"Coventry Station","detail":"Rail to London & Birmingham","minutes":6}]'::jsonb,
   '[{"name":"Southfields Primary","detail":"0.7 miles","rating":"Good"}]'::jsonb,
   '[{"name":"Coventry Market","detail":"Indoor market"}]'::jsonb,
   TRUE, '88888888-8888-8888-8888-888888888888'),

  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000005',
   'wapping-wharf-rise', 'Wapping Wharf Rise',
   'Design-led apartments on Bristol''s vibrant harbourside.',
   E'A collection of sustainable one and two-bedroom apartments steps from Bristol''s harbourside, Gaol Ferry Steps and the independent shops of Wapping Wharf.',
   'Gaol Ferry Steps', 'Bristol', 'BS1 6WE', 'Bristol',
   51.4470, -2.5980, 'apartments', 'available', '2026-11-30', FALSE, FALSE, TRUE,
   '[{"title":"Solar PV included","detail":"Lower energy bills from day one"}]'::jsonb,
   '["Harbourside living on Gaol Ferry Steps","Solar PV and triple glazing","Independent shops and dining on your doorstep","Shared-ownership available"]'::jsonb,
   '[{"name":"Bristol Temple Meads","detail":"National rail","minutes":14}]'::jsonb,
   '[{"name":"Ashton Gate Primary","detail":"0.9 miles","rating":"Good"}]'::jsonb,
   '[{"name":"Wapping Wharf","detail":"CARGO independent units"},{"name":"M Shed","detail":"Museum"}]'::jsonb,
   TRUE, '88888888-8888-8888-8888-888888888888')
ON CONFLICT (id) DO NOTHING;

-- Units ----------------------------------------------------------------------
-- Synthesised per development with mixed statuses and realistic pricing.

INSERT INTO public.development_units
  (development_id, plot_number, unit_type, beds, baths, size_sqft, price, status, features)
SELECT
  d.id,
  'P' || lpad(g::text, 2, '0'),
  (ARRAY['2 bed terrace','3 bed townhouse','3 bed semi-detached','4 bed detached'])[1 + (g % 4)],
  2 + (g % 3),
  1 + (g % 2),
  700 + (g % 4) * 280,
  d.base_price + (g % 4) * 35000 + (g % 3) * 9000,
  (ARRAY['available','available','available','available','reserved','reserved','sold'])[1 + (g % 7)]::development_unit_status,
  ARRAY['Air-source heat pump','EV charging point','Turfed rear garden']
FROM (
  VALUES
    ('b0000000-0000-0000-0000-000000000001'::uuid, 320000, 14),
    ('b0000000-0000-0000-0000-000000000003'::uuid, 285000, 18),
    ('b0000000-0000-0000-0000-000000000005'::uuid, 295000, 12)
) AS d(id, base_price, n)
CROSS JOIN LATERAL generate_series(1, d.n) AS g
ON CONFLICT (development_id, plot_number) DO NOTHING;

-- Apartment developments (1 & 2 bed)
INSERT INTO public.development_units
  (development_id, plot_number, unit_type, beds, baths, size_sqft, price, status, features)
SELECT
  d.id,
  'A' || lpad(g::text, 2, '0'),
  (ARRAY['1 bed apartment','2 bed apartment','2 bed apartment','2 bed penthouse'])[1 + (g % 4)],
  1 + (g % 2),
  1 + (g % 2),
  480 + (g % 4) * 180,
  d.base_price + (g % 4) * 28000 + (g % 5) * 6000,
  (ARRAY['available','available','available','reserved','reserved','sold','sold'])[1 + (g % 7)]::development_unit_status,
  ARRAY['Integrated appliances','Juliet balcony','Secure cycle storage']
FROM (
  VALUES
    ('b0000000-0000-0000-0000-000000000002'::uuid, 195000, 10),
    ('b0000000-0000-0000-0000-000000000004'::uuid, 245000, 16),
    ('b0000000-0000-0000-0000-000000000006'::uuid, 265000, 11)
) AS d(id, base_price, n)
CROSS JOIN LATERAL generate_series(1, d.n) AS g
ON CONFLICT (development_id, plot_number) DO NOTHING;

-- Backfill denormalised ranges from the units just created.
UPDATE public.developments d SET
  price_min = agg.min_price,
  price_max = agg.max_price,
  beds_min = agg.min_beds,
  beds_max = agg.max_beds,
  total_units = agg.total,
  available_units = agg.available
FROM (
  SELECT development_id,
         MIN(price) AS min_price, MAX(price) AS max_price,
         MIN(beds) AS min_beds, MAX(beds) AS max_beds,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'available') AS available
  FROM public.development_units
  GROUP BY development_id
) AS agg
WHERE d.id = agg.development_id;

-- Leads ----------------------------------------------------------------------
-- Realistic enquiries across the showcase developer (Calthorpe) plus a few on
-- others. Statuses are distributed so the conversion funnel is meaningful.

INSERT INTO public.development_leads
  (development_id, lead_type, status, name, email, phone, buyer_status, budget,
   desired_move_date, mortgage_position, has_property_to_sell, preferred_plot,
   message, source_route, utm_source, created_at)
SELECT
  dev_id::uuid, lead_type::development_lead_type, status::development_lead_status,
  name, email, phone, buyer_status, budget, move_date, mortgage, has_sell, plot,
  message, source_route, utm_source, NOW() - (days || ' days')::interval
FROM (VALUES
  -- Edgbaston Gardens (showcase — strong funnel)
  ('b0000000-0000-0000-0000-000000000001','register_interest','reserved','Daniel Hughes','daniel.hughes@example.com','07700900111','home_mover',360000,'Within 3 months','agreement_in_principle',TRUE,'P03','Keen on plot 3, ready to proceed.','/new-homes/edgbaston-gardens','google',32),
  ('b0000000-0000-0000-0000-000000000001','book_viewing','reserved','Aisha Khan','aisha.khan@example.com','07700900112','first_time_buyer',330000,'Within 6 months','agreement_in_principle',FALSE,'P07','','/new-homes/edgbaston-gardens','google',28),
  ('b0000000-0000-0000-0000-000000000001','book_viewing','viewing_booked','Mark Reynolds','mark.reynolds@example.com','07700900113','home_mover',390000,'Flexible','applied',TRUE,'P09','Would like a Saturday viewing.','/new-homes/edgbaston-gardens','facebook',21),
  ('b0000000-0000-0000-0000-000000000001','register_interest','qualified','Lucy Adeyemi','lucy.adeyemi@example.com','07700900114','first_time_buyer',310000,'Within 6 months','not_started',FALSE,'','Help to Buy still available?','/new-homes/edgbaston-gardens','newsletter',18),
  ('b0000000-0000-0000-0000-000000000001','request_brochure','contacted','Tom Bradshaw','tom.bradshaw@example.com',NULL,'investor',400000,'No rush','cash_buyer',FALSE,'','','/new-homes/edgbaston-gardens','direct',16),
  ('b0000000-0000-0000-0000-000000000001','ask_question','new','Grace Owusu','grace.owusu@example.com','07700900116','first_time_buyer',300000,'Within 12 months','not_started',FALSE,'','What are the service charges?','/new-homes/edgbaston-gardens','google',9),
  ('b0000000-0000-0000-0000-000000000001','register_interest','new','Peter Lismore','peter.lismore@example.com','07700900117','home_mover',375000,'Within 6 months','agreement_in_principle',TRUE,'P11','','/new-homes/edgbaston-gardens','google',6),
  ('b0000000-0000-0000-0000-000000000001','request_brochure','new','Hannah Webb','hannah.webb@example.com',NULL,'home_mover',355000,'Flexible','applied',TRUE,'','','/new-homes/edgbaston-gardens','facebook',4),
  ('b0000000-0000-0000-0000-000000000001','book_viewing','lost','Simon Carter','simon.carter@example.com','07700900119','first_time_buyer',290000,'Within 3 months','not_started',FALSE,'','','/new-homes/edgbaston-gardens','direct',24),
  -- Jewellery Quarter Lofts
  ('b0000000-0000-0000-0000-000000000002','register_interest','reserved','Olivia Stone','olivia.stone@example.com','07700900121','first_time_buyer',230000,'Within 3 months','agreement_in_principle',FALSE,'A02','','/new-homes/jewellery-quarter-lofts','google',20),
  ('b0000000-0000-0000-0000-000000000002','book_viewing','viewing_booked','Raj Patel','raj.patel@example.com','07700900122','investor',260000,'Flexible','cash_buyer',FALSE,'A05','Interested in buy-to-let yields.','/new-homes/jewellery-quarter-lofts','google',14),
  ('b0000000-0000-0000-0000-000000000002','ask_question','qualified','Chloe Bennett','chloe.bennett@example.com','07700900123','first_time_buyer',210000,'Within 6 months','not_started',FALSE,'','Is shared ownership available?','/new-homes/jewellery-quarter-lofts','newsletter',11),
  ('b0000000-0000-0000-0000-000000000002','request_brochure','new','Nathan Cole','nathan.cole@example.com',NULL,'first_time_buyer',225000,'Within 12 months','applied',FALSE,'','','/new-homes/jewellery-quarter-lofts','facebook',5),
  -- Kirkstall Forge (Leeds)
  ('b0000000-0000-0000-0000-000000000003','register_interest','reserved','Emma Whitfield','emma.whitfield@example.com','07700900131','home_mover',315000,'Within 3 months','agreement_in_principle',TRUE,'P04','','/new-homes/kirkstall-forge','google',19),
  ('b0000000-0000-0000-0000-000000000003','book_viewing','viewing_booked','James Holroyd','james.holroyd@example.com','07700900132','home_mover',340000,'Flexible','applied',TRUE,'P06','','/new-homes/kirkstall-forge','direct',12),
  ('b0000000-0000-0000-0000-000000000003','register_interest','qualified','Sara Bex','sara.bex@example.com','07700900133','first_time_buyer',290000,'Within 6 months','not_started',FALSE,'','','/new-homes/kirkstall-forge','google',8),
  ('b0000000-0000-0000-0000-000000000003','ask_question','new','Will Forster','will.forster@example.com',NULL,'home_mover',330000,'Flexible','agreement_in_principle',TRUE,'','Part exchange on a 1980s semi?','/new-homes/kirkstall-forge','newsletter',3),
  -- Ancoats Wharf (Manchester)
  ('b0000000-0000-0000-0000-000000000004','register_interest','contacted','Mia Donnelly','mia.donnelly@example.com','07700900141','first_time_buyer',280000,'Within 6 months','agreement_in_principle',FALSE,'A03','','/new-homes/ancoats-wharf','google',15),
  ('b0000000-0000-0000-0000-000000000004','book_viewing','viewing_booked','Leo Marsh','leo.marsh@example.com','07700900142','investor',300000,'Flexible','cash_buyer',FALSE,'A08','','/new-homes/ancoats-wharf','facebook',10),
  ('b0000000-0000-0000-0000-000000000004','request_brochure','new','Ife Bello','ife.bello@example.com',NULL,'first_time_buyer',265000,'Within 12 months','not_started',FALSE,'','','/new-homes/ancoats-wharf','google',2),
  -- Wapping Wharf Rise (Bristol)
  ('b0000000-0000-0000-0000-000000000006','register_interest','reserved','Freya Lawson','freya.lawson@example.com','07700900151','home_mover',345000,'Within 3 months','agreement_in_principle',TRUE,'A02','','/new-homes/wapping-wharf-rise','google',17),
  ('b0000000-0000-0000-0000-000000000006','ask_question','qualified','Owen Pritchard','owen.pritchard@example.com','07700900152','first_time_buyer',300000,'Within 6 months','applied',FALSE,'','Solar PV — owned or leased?','/new-homes/wapping-wharf-rise','newsletter',7),
  ('b0000000-0000-0000-0000-000000000006','request_brochure','new','Zara Mehta','zara.mehta@example.com',NULL,'investor',320000,'Flexible','cash_buyer',FALSE,'','','/new-homes/wapping-wharf-rise','direct',1)
) AS s(dev_id, lead_type, status, name, email, phone, buyer_status, budget, move_date, mortgage, has_sell, plot, message, source_route, utm_source, days)
WHERE NOT EXISTS (
  SELECT 1 FROM public.development_leads existing WHERE existing.email = s.email AND existing.development_id = s.dev_id::uuid
);

-- Viewings (derived from leads that booked/reserved on the showcase developer)
INSERT INTO public.development_viewings (development_id, lead_id, status, scheduled_for, notes)
SELECT l.development_id, l.id,
       CASE WHEN l.status = 'reserved' THEN 'completed' ELSE 'confirmed' END,
       l.created_at + INTERVAL '5 days',
       'Show home viewing'
FROM public.development_leads l
WHERE l.lead_type = 'book_viewing'
  AND l.status IN ('viewing_booked','reserved')
  AND NOT EXISTS (
    SELECT 1 FROM public.development_viewings v WHERE v.lead_id = l.id
  );

-- A handful of analytics events so the dashboard isn't empty of activity.
INSERT INTO public.development_events (development_id, event_type, created_at)
SELECT 'b0000000-0000-0000-0000-000000000001', 'development_viewed', NOW() - (g || ' hours')::interval
FROM generate_series(1, 40) AS g
ON CONFLICT DO NOTHING;
