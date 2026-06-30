-- =============================================================================
-- 05_landlord_data.sql — Landlord Dashboard Seed Data
-- =============================================================================
-- Populates all landlord-specific tables for Landlord Mike's dashboard.
-- Depends on: 00_demo_users.sql, 01_properties_listings.sql
--
-- Landlord Mike:  44444444-4444-4444-4444-444444444444
-- Renter Sophie:  22222222-2222-2222-2222-222222222222
--
-- Properties (from 01_properties_listings.sql):
--   Property 9:  aaaaaaaa-0009-0009-0009-aaaaaaaaaaaa  (Canary Riverside 2-bed)
--   Property 10: aaaaaaaa-0010-0010-0010-aaaaaaaaaaaa  (Whitechapel 2-bed)
--   Property 11: aaaaaaaa-0011-0011-0011-aaaaaaaaaaaa  (Bermondsey 1-bed)
--   Property 12: aaaaaaaa-0012-0012-0012-aaaaaaaaaaaa  (Battersea Power Station 2-bed)
--
-- UUID pattern for this file: ffffffff-NNNN-0006-NNNN-ffffffffffff
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING).
-- =============================================================================

DO $$
DECLARE
  v_landlord_id  UUID := '44444444-4444-4444-4444-444444444444';
  v_renter_id    UUID := '22222222-2222-2222-2222-222222222222';
  v_now          TIMESTAMPTZ := NOW();

  -- Property IDs
  v_prop9        UUID := 'aaaaaaaa-0009-0009-0009-aaaaaaaaaaaa';
  v_prop10       UUID := 'aaaaaaaa-0010-0010-0010-aaaaaaaaaaaa';
  v_prop11       UUID := 'aaaaaaaa-0011-0011-0011-aaaaaaaaaaaa';
  v_prop12       UUID := 'aaaaaaaa-0012-0012-0012-aaaaaaaaaaaa';

  -- Tenancy IDs
  v_tenancy1     UUID := 'ffffffff-0001-0006-0001-ffffffffffff'; -- Sophie at Prop 9
  v_tenancy2     UUID := 'ffffffff-0002-0006-0002-ffffffffffff'; -- James at Prop 10
  v_tenancy3     UUID := 'ffffffff-0003-0006-0003-ffffffffffff'; -- Olivia at Prop 11

  -- Tenant application IDs
  v_app1         UUID := 'ffffffff-0101-0006-0101-ffffffffffff'; -- Sophie approved
  v_app2         UUID := 'ffffffff-0102-0006-0102-ffffffffffff'; -- referencing
  v_app3         UUID := 'ffffffff-0103-0006-0103-ffffffffffff'; -- shortlisted
  v_app4         UUID := 'ffffffff-0104-0006-0104-ffffffffffff'; -- received
  v_app5         UUID := 'ffffffff-0105-0006-0105-ffffffffffff'; -- rejected

  -- Maintenance request IDs
  v_maint1       UUID := 'ffffffff-0201-0006-0201-ffffffffffff'; -- emergency
  v_maint2       UUID := 'ffffffff-0202-0006-0202-ffffffffffff'; -- in_progress
  v_maint3       UUID := 'ffffffff-0203-0006-0203-ffffffffffff'; -- resolved
  v_maint4       UUID := 'ffffffff-0204-0006-0204-ffffffffffff'; -- new

  -- Property document IDs
  v_doc1         UUID := 'ffffffff-0301-0006-0301-ffffffffffff'; -- gas safety valid
  v_doc2         UUID := 'ffffffff-0302-0006-0302-ffffffffffff'; -- EPC valid
  v_doc3         UUID := 'ffffffff-0303-0006-0303-ffffffffffff'; -- EICR expiring soon
  v_doc4         UUID := 'ffffffff-0304-0006-0304-ffffffffffff'; -- insurance expired
  v_doc5         UUID := 'ffffffff-0305-0006-0305-ffffffffffff'; -- gas safety prop 10

  -- Financial entry IDs
  v_fin1         UUID := 'ffffffff-0401-0006-0401-ffffffffffff';
  v_fin2         UUID := 'ffffffff-0402-0006-0402-ffffffffffff';
  v_fin3         UUID := 'ffffffff-0403-0006-0403-ffffffffffff';
  v_fin4         UUID := 'ffffffff-0404-0006-0404-ffffffffffff';
  v_fin5         UUID := 'ffffffff-0405-0006-0405-ffffffffffff';
  v_fin6         UUID := 'ffffffff-0406-0006-0406-ffffffffffff';
  v_fin7         UUID := 'ffffffff-0407-0006-0407-ffffffffffff';
  v_fin8         UUID := 'ffffffff-0408-0006-0408-ffffffffffff';
  v_fin9         UUID := 'ffffffff-0409-0006-0409-ffffffffffff';
  v_fin10        UUID := 'ffffffff-0410-0006-0410-ffffffffffff';
  v_fin11        UUID := 'ffffffff-0411-0006-0411-ffffffffffff';
  v_fin12        UUID := 'ffffffff-0412-0006-0412-ffffffffffff';

  -- Deposit registration IDs
  v_dep1         UUID := 'ffffffff-0501-0006-0501-ffffffffffff';
  v_dep2         UUID := 'ffffffff-0502-0006-0502-ffffffffffff';

  -- Inventory report IDs
  v_inv1         UUID := 'ffffffff-0601-0006-0601-ffffffffffff';
  v_inv2         UUID := 'ffffffff-0602-0006-0602-ffffffffffff';

BEGIN

  RAISE NOTICE '=== Landlord Dashboard Seed: Starting ===';

  -- ===========================================================================
  -- 1. TENANCIES (3 active tenancies across Mike's properties)
  -- ===========================================================================
  RAISE NOTICE 'Inserting tenancies...';

  INSERT INTO tenancies (
    id, property_id, landlord_id,
    tenant_name, tenant_email, tenant_phone, tenant_user_id,
    status, lease_start_date, lease_end_date,
    rent_amount, rent_frequency, deposit_amount, deposit_scheme,
    notes, created_at, updated_at
  ) VALUES
    -- Tenancy 1: Renter Sophie at Canary Riverside (Prop 9) — active
    (
      v_tenancy1, v_prop9, v_landlord_id,
      'Sophie Williams', 'sophie.williams@email.com', '07700 900333', v_renter_id,
      'active', '2025-06-01', '2026-05-31',
      2200.00, 'monthly', 2538.46, 'DPS',
      'Excellent tenant. Always pays on time. Keeps property immaculate.',
      v_now - INTERVAL '9 months', v_now
    ),
    -- Tenancy 2: James Chen at Whitechapel (Prop 10) — active
    (
      v_tenancy2, v_prop10, v_landlord_id,
      'James Chen', 'james.chen@email.com', '07700 900444', NULL,
      'active', '2025-09-01', '2026-08-31',
      1750.00, 'monthly', 2019.23, 'TDS',
      'Professional tenant. Works in finance in the City.',
      v_now - INTERVAL '6 months', v_now
    ),
    -- Tenancy 3: Olivia Brown at Bermondsey (Prop 11) — ending_soon
    (
      v_tenancy3, v_prop11, v_landlord_id,
      'Olivia Brown', 'olivia.brown@email.com', '07700 900555', NULL,
      'ending_soon', '2025-03-01', '2026-04-30',
      1450.00, 'monthly', 1673.08, 'DPS',
      'Lease ending next month. Tenant has confirmed she will not renew.',
      v_now - INTERVAL '12 months', v_now
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Tenancies inserted.';

  -- ===========================================================================
  -- 2. TENANT APPLICATIONS (5 applications across properties)
  -- ===========================================================================
  RAISE NOTICE 'Inserting tenant_applications...';

  INSERT INTO tenant_applications (
    id, property_id, landlord_id, applicant_user_id,
    applicant_name, applicant_email,
    status, monthly_income, employment_status,
    credit_check_status, references_status,
    notes, rejection_reason,
    created_at, updated_at
  ) VALUES
    -- App 1: Sophie approved for Prop 9 (Canary Riverside)
    (
      v_app1, v_prop9, v_landlord_id, v_renter_id,
      'Sophie Williams', 'sophie.williams@email.com',
      'approved', 5500.00, 'Full-time employed',
      'passed', 'verified',
      'Strong application. Employer reference from Deloitte confirmed. Previous landlord gave excellent review.',
      NULL,
      v_now - INTERVAL '10 months', v_now - INTERVAL '9 months'
    ),
    -- App 2: Referencing stage for Prop 12 (Battersea — currently vacant)
    (
      v_app2, v_prop12, v_landlord_id, NULL,
      'Daniel Park', 'daniel.park@email.com',
      'referencing', 6200.00, 'Full-time employed',
      'passed', 'pending',
      'Credit check passed. Awaiting employer and previous landlord references.',
      NULL,
      v_now - INTERVAL '5 days', v_now - INTERVAL '2 days'
    ),
    -- App 3: Shortlisted for Prop 12 (Battersea)
    (
      v_app3, v_prop12, v_landlord_id, NULL,
      'Emma Rodriguez', 'emma.rodriguez@email.com',
      'shortlisted', 5800.00, 'Self-employed',
      'not_run', 'pending',
      'Self-employed graphic designer. 3 years of accounts showing stable income. Shortlisted pending viewing.',
      NULL,
      v_now - INTERVAL '4 days', v_now - INTERVAL '3 days'
    ),
    -- App 4: Newly received for Prop 11 (Bermondsey — ending soon)
    (
      v_app4, v_prop11, v_landlord_id, NULL,
      'Amir Hassan', 'amir.hassan@email.com',
      'received', 4200.00, 'Full-time employed',
      'not_run', 'pending',
      NULL,
      NULL,
      v_now - INTERVAL '1 day', v_now - INTERVAL '1 day'
    ),
    -- App 5: Rejected for Prop 9 (Canary Riverside — before Sophie was approved)
    (
      v_app5, v_prop9, v_landlord_id, NULL,
      'Tom Fletcher', 'tom.fletcher@email.com',
      'rejected', 2800.00, 'Part-time employed',
      'failed', 'pending',
      NULL,
      'Income insufficient for rent amount. Credit check revealed CCJs. Does not meet affordability criteria.',
      v_now - INTERVAL '11 months', v_now - INTERVAL '10 months'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Tenant applications inserted.';

  -- ===========================================================================
  -- 3. MAINTENANCE REQUESTS (4 requests across properties)
  -- ===========================================================================
  RAISE NOTICE 'Inserting maintenance_requests...';

  INSERT INTO maintenance_requests (
    id, property_id, tenancy_id, reported_by,
    title, description, priority, status,
    assigned_provider_id, assigned_provider_name,
    resolution_notes, resolved_at,
    photo_urls, created_at, updated_at
  ) VALUES
    -- Maint 1: Emergency — boiler failure at Canary Riverside
    (
      v_maint1, v_prop9, v_tenancy1, v_renter_id,
      'Boiler not producing hot water',
      'The boiler stopped producing hot water yesterday evening. Display shows error code E119. Heating still works but no hot water at all. Tenant has young child.',
      'emergency', 'acknowledged',
      NULL, NULL,
      NULL, NULL,
      '{}',
      v_now - INTERVAL '6 hours', v_now - INTERVAL '4 hours'
    ),
    -- Maint 2: In progress — leaking tap at Whitechapel
    (
      v_maint2, v_prop10, v_tenancy2, v_landlord_id,
      'Kitchen tap dripping constantly',
      'The kitchen mixer tap has developed a persistent drip from the spout. Washer likely needs replacing. Water is pooling on the counter overnight.',
      'medium', 'in_progress',
      '66666666-6666-6666-6666-666666666666', 'Bob the Plumber',
      NULL, NULL,
      '{}',
      v_now - INTERVAL '3 days', v_now - INTERVAL '1 day'
    ),
    -- Maint 3: Resolved — damp patch at Bermondsey
    (
      v_maint3, v_prop11, v_tenancy3, v_landlord_id,
      'Damp patch on bedroom ceiling',
      'Tenant reported a growing damp patch approximately 30cm diameter on the master bedroom ceiling. Located below the bathroom of the flat above.',
      'high', 'resolved',
      NULL, 'ProSeal Damp Solutions',
      'Surveyor identified failed seal around bath waste pipe in upstairs flat. Freeholder notified and repair completed. Ceiling dried out and repainted.',
      v_now - INTERVAL '14 days',
      '{}',
      v_now - INTERVAL '2 months', v_now - INTERVAL '14 days'
    ),
    -- Maint 4: New — window latch broken at Canary Riverside
    (
      v_maint4, v_prop9, v_tenancy1, v_renter_id,
      'Bedroom window latch broken',
      'The latch mechanism on the second bedroom window has snapped. Window cannot be securely closed. Security concern as the flat is on the ground floor.',
      'high', 'new',
      NULL, NULL,
      NULL, NULL,
      '{}',
      v_now - INTERVAL '2 hours', v_now - INTERVAL '2 hours'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Maintenance requests inserted.';

  -- ===========================================================================
  -- 4. PROPERTY DOCUMENTS / COMPLIANCE (5 documents)
  -- ===========================================================================
  RAISE NOTICE 'Inserting property_documents (compliance)...';

  INSERT INTO property_documents (
    id, property_id, tenancy_id, uploaded_by,
    name, category, file_url, file_size,
    expiry_date,
    created_at
  ) VALUES
    -- Doc 1: Gas Safety Certificate — Prop 9, valid (expires in 8 months)
    (
      v_doc1, v_prop9, v_tenancy1, v_landlord_id,
      'Gas Safety Certificate 2025 - Canary Riverside',
      'gas_safety',
      'property-documents/aaaaaaaa-0009-0009-0009-aaaaaaaaaaaa/gas-safety-2025.pdf',
      245760,
      (CURRENT_DATE + INTERVAL '8 months')::DATE,
      v_now - INTERVAL '4 months'
    ),
    -- Doc 2: EPC — Prop 9, valid (expires in 6 years)
    (
      v_doc2, v_prop9, NULL, v_landlord_id,
      'Energy Performance Certificate - Canary Riverside',
      'epc',
      'property-documents/aaaaaaaa-0009-0009-0009-aaaaaaaaaaaa/epc-2024.pdf',
      189440,
      (CURRENT_DATE + INTERVAL '6 years')::DATE,
      v_now - INTERVAL '14 months'
    ),
    -- Doc 3: EICR — Prop 10, expiring soon (expires in 18 days)
    (
      v_doc3, v_prop10, v_tenancy2, v_landlord_id,
      'Electrical Installation Condition Report - Whitechapel',
      'electrical_eicr',
      'property-documents/aaaaaaaa-0010-0010-0010-aaaaaaaaaaaa/eicr-2021.pdf',
      312320,
      (CURRENT_DATE + INTERVAL '18 days')::DATE,
      v_now - INTERVAL '4 years'
    ),
    -- Doc 4: Insurance — Prop 11, expired (expired 2 weeks ago)
    (
      v_doc4, v_prop11, NULL, v_landlord_id,
      'Landlord Building Insurance - Bermondsey',
      'insurance',
      'property-documents/aaaaaaaa-0011-0011-0011-aaaaaaaaaaaa/insurance-2024.pdf',
      204800,
      (CURRENT_DATE - INTERVAL '14 days')::DATE,
      v_now - INTERVAL '13 months'
    ),
    -- Doc 5: Gas Safety — Prop 10, valid (expires in 5 months)
    (
      v_doc5, v_prop10, v_tenancy2, v_landlord_id,
      'Gas Safety Certificate 2025 - Whitechapel',
      'gas_safety',
      'property-documents/aaaaaaaa-0010-0010-0010-aaaaaaaaaaaa/gas-safety-2025.pdf',
      256000,
      (CURRENT_DATE + INTERVAL '5 months')::DATE,
      v_now - INTERVAL '7 months'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Property documents inserted.';

  -- ===========================================================================
  -- 5. FINANCIAL ENTRIES (rent payments + expenses)
  -- ===========================================================================
  RAISE NOTICE 'Inserting financial_entries (rent payments & expenses)...';

  INSERT INTO financial_entries (
    id, property_id, tenancy_id, user_id,
    type, category, amount, entry_date, description,
    rent_period_start, rent_period_end, payment_status,
    created_at
  ) VALUES
    -- === RENT PAYMENTS: Prop 9 (Sophie, £2200/mo) — 4 months ===
    (
      v_fin1, v_prop9, v_tenancy1, v_landlord_id,
      'income', 'rent', 2200.00, (CURRENT_DATE - INTERVAL '3 months')::DATE,
      'Monthly rent - December 2025',
      (CURRENT_DATE - INTERVAL '3 months')::DATE,
      (CURRENT_DATE - INTERVAL '2 months')::DATE,
      'paid',
      v_now - INTERVAL '3 months'
    ),
    (
      v_fin2, v_prop9, v_tenancy1, v_landlord_id,
      'income', 'rent', 2200.00, (CURRENT_DATE - INTERVAL '2 months')::DATE,
      'Monthly rent - January 2026',
      (CURRENT_DATE - INTERVAL '2 months')::DATE,
      (CURRENT_DATE - INTERVAL '1 month')::DATE,
      'paid',
      v_now - INTERVAL '2 months'
    ),
    (
      v_fin3, v_prop9, v_tenancy1, v_landlord_id,
      'income', 'rent', 2200.00, (CURRENT_DATE - INTERVAL '1 month')::DATE,
      'Monthly rent - February 2026',
      (CURRENT_DATE - INTERVAL '1 month')::DATE,
      CURRENT_DATE,
      'paid',
      v_now - INTERVAL '1 month'
    ),
    (
      v_fin4, v_prop9, v_tenancy1, v_landlord_id,
      'income', 'rent', 2200.00, CURRENT_DATE,
      'Monthly rent - March 2026',
      CURRENT_DATE,
      (CURRENT_DATE + INTERVAL '1 month')::DATE,
      'paid',
      v_now
    ),

    -- === RENT PAYMENTS: Prop 10 (James, £1750/mo) — 3 months ===
    (
      v_fin5, v_prop10, v_tenancy2, v_landlord_id,
      'income', 'rent', 1750.00, (CURRENT_DATE - INTERVAL '2 months')::DATE,
      'Monthly rent - January 2026',
      (CURRENT_DATE - INTERVAL '2 months')::DATE,
      (CURRENT_DATE - INTERVAL '1 month')::DATE,
      'paid',
      v_now - INTERVAL '2 months'
    ),
    (
      v_fin6, v_prop10, v_tenancy2, v_landlord_id,
      'income', 'rent', 1750.00, (CURRENT_DATE - INTERVAL '1 month')::DATE,
      'Monthly rent - February 2026',
      (CURRENT_DATE - INTERVAL '1 month')::DATE,
      CURRENT_DATE,
      'paid',
      v_now - INTERVAL '1 month'
    ),
    (
      v_fin7, v_prop10, v_tenancy2, v_landlord_id,
      'income', 'rent', 1750.00, CURRENT_DATE,
      'Monthly rent - March 2026',
      CURRENT_DATE,
      (CURRENT_DATE + INTERVAL '1 month')::DATE,
      'paid',
      v_now
    ),

    -- === RENT PAYMENTS: Prop 11 (Olivia, £1450/mo) — 3 months ===
    (
      v_fin8, v_prop11, v_tenancy3, v_landlord_id,
      'income', 'rent', 1450.00, (CURRENT_DATE - INTERVAL '2 months')::DATE,
      'Monthly rent - January 2026',
      (CURRENT_DATE - INTERVAL '2 months')::DATE,
      (CURRENT_DATE - INTERVAL '1 month')::DATE,
      'paid',
      v_now - INTERVAL '2 months'
    ),
    (
      v_fin9, v_prop11, v_tenancy3, v_landlord_id,
      'income', 'rent', 1450.00, (CURRENT_DATE - INTERVAL '1 month')::DATE,
      'Monthly rent - February 2026',
      (CURRENT_DATE - INTERVAL '1 month')::DATE,
      CURRENT_DATE,
      'paid',
      v_now - INTERVAL '1 month'
    ),
    (
      v_fin10, v_prop11, v_tenancy3, v_landlord_id,
      'income', 'rent', 1450.00, CURRENT_DATE,
      'Monthly rent - March 2026 (final month)',
      CURRENT_DATE,
      (CURRENT_DATE + INTERVAL '1 month')::DATE,
      'paid',
      v_now
    ),

    -- === EXPENSES ===
    (
      v_fin11, v_prop9, NULL, v_landlord_id,
      'expense', 'insurance', 480.00, (CURRENT_DATE - INTERVAL '2 months')::DATE,
      'Annual landlord buildings insurance renewal - Canary Riverside',
      NULL, NULL, NULL,
      v_now - INTERVAL '2 months'
    ),
    (
      v_fin12, v_prop10, v_tenancy2, v_landlord_id,
      'expense', 'maintenance', 175.00, (CURRENT_DATE - INTERVAL '1 day')::DATE,
      'Plumber call-out for kitchen tap repair - Whitechapel',
      NULL, NULL, NULL,
      v_now - INTERVAL '1 day'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Financial entries inserted.';

  -- ===========================================================================
  -- 6. DEPOSIT REGISTRATIONS (2 deposits)
  -- ===========================================================================
  RAISE NOTICE 'Inserting deposit_registrations...';

  INSERT INTO deposit_registrations (
    id, tenancy_id,
    amount, scheme, scheme_reference,
    registration_date, prescribed_info_sent_date,
    status, notes,
    created_at, updated_at
  ) VALUES
    -- Deposit 1: Sophie's deposit at Canary Riverside — registered with DPS
    (
      v_dep1, v_tenancy1,
      2538.46, 'DPS', 'DPS-2025-LM-009281',
      '2025-06-08', '2025-06-10',
      'registered',
      'Deposit registered within statutory 30-day window. Prescribed information served by email and post.',
      v_now - INTERVAL '9 months', v_now - INTERVAL '9 months'
    ),
    -- Deposit 2: James's deposit at Whitechapel — registered with TDS
    (
      v_dep2, v_tenancy2,
      2019.23, 'TDS', 'TDS-2025-MC-047553',
      '2025-09-05', '2025-09-08',
      'registered',
      'Deposit registered. Prescribed information sent via TDS portal and confirmed by tenant.',
      v_now - INTERVAL '6 months', v_now - INTERVAL '6 months'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Deposit registrations inserted.';

  -- ===========================================================================
  -- 7. INVENTORY REPORTS (2 check-in reports)
  -- ===========================================================================
  RAISE NOTICE 'Inserting inventory_reports...';

  INSERT INTO inventory_reports (
    id, property_id, tenancy_id, landlord_id,
    type, status,
    rooms, notes, photo_urls,
    completed_at, created_at
  ) VALUES
    -- Inventory 1: Check-in for Sophie at Canary Riverside — signed
    (
      v_inv1, v_prop9, v_tenancy1, v_landlord_id,
      'check_in', 'signed',
      '[
        {"name": "Living Room", "condition": "Excellent", "items": ["2-seater sofa (grey fabric)", "TV unit with 50\" Samsung TV", "Coffee table (oak)", "Floor lamp", "Curtains (cream, lined)"], "notes": "All items in excellent condition. No marks or damage."},
        {"name": "Kitchen", "condition": "Excellent", "items": ["Integrated dishwasher", "Fridge-freezer", "Washing machine", "Microwave", "Full cutlery and crockery set"], "notes": "All appliances in working order. Worktops unmarked."},
        {"name": "Master Bedroom", "condition": "Good", "items": ["King-size bed frame and mattress", "Built-in wardrobe", "Bedside tables x2", "Blackout blinds"], "notes": "Small scuff on wardrobe door (photographed). Otherwise good condition."},
        {"name": "Second Bedroom", "condition": "Excellent", "items": ["Double bed frame and mattress", "Chest of drawers", "Desk and chair", "Roller blinds"], "notes": "All items new. No issues."},
        {"name": "Bathroom", "condition": "Excellent", "items": ["Bath with shower over", "Heated towel rail", "Mirrored cabinet", "Extractor fan"], "notes": "All sanitary ware in excellent condition. Silicone seals intact."}
      ]'::jsonb,
      'Full inventory completed and signed by tenant Sophie Williams on move-in day. Minor wardrobe scuff noted and photographed.',
      '{}',
      '2025-06-01 14:30:00+00',
      v_now - INTERVAL '9 months'
    ),
    -- Inventory 2: Check-in for James at Whitechapel — complete (not yet signed)
    (
      v_inv2, v_prop10, v_tenancy2, v_landlord_id,
      'check_in', 'complete',
      '[
        {"name": "Open-plan Living/Kitchen", "condition": "Good", "items": ["Corner sofa (charcoal)", "Dining table with 4 chairs", "Integrated oven and hob", "Fridge-freezer", "Washing machine"], "notes": "Light scratch on dining table surface. All appliances working."},
        {"name": "Master Bedroom", "condition": "Good", "items": ["Double bed frame and mattress", "Built-in wardrobe", "Bedside table", "Venetian blinds"], "notes": "Good condition throughout."},
        {"name": "Second Bedroom", "condition": "Good", "items": ["Single bed frame and mattress", "Wardrobe (freestanding)", "Small desk"], "notes": "Wardrobe door sticks slightly. Noted."},
        {"name": "Bathroom", "condition": "Good", "items": ["Walk-in shower", "Basin with vanity unit", "Heated towel rail"], "notes": "Grout slightly discoloured in shower. Functionally fine."}
      ]'::jsonb,
      'Inventory completed. Awaiting tenant signature — tenant travelling for work, will sign on return.',
      '{}',
      '2025-09-01 11:00:00+00',
      v_now - INTERVAL '6 months'
    )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Inventory reports inserted.';

  -- ===========================================================================
  -- DONE
  -- ===========================================================================
  RAISE NOTICE '=== Landlord Dashboard Seed: Complete ===';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - 3 tenancies (2 active, 1 ending_soon)';
  RAISE NOTICE '  - 5 tenant applications (approved, referencing, shortlisted, received, rejected)';
  RAISE NOTICE '  - 4 maintenance requests (emergency, in_progress, resolved, new)';
  RAISE NOTICE '  - 5 compliance documents (2 valid, 1 expiring_soon, 1 expired, 1 valid)';
  RAISE NOTICE '  - 12 financial entries (10 rent payments, 2 expenses)';
  RAISE NOTICE '  - 2 deposit registrations (both registered)';
  RAISE NOTICE '  - 2 inventory reports (1 signed, 1 complete)';

END $$;
