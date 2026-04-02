/**
 * Seed Demo — Landlord Dashboard Data
 *
 * Seeds tenancies, financial entries (rent payments), property documents
 * (compliance), maintenance requests, and deposit registrations for
 * Robert Williams' landlord dashboard.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_PROPERTIES, DEMO_USERS, type Scenario } from "./config";
import { DEMO_LISTING_IDS } from "./properties";
import { daysAgo, hoursAgo, seedTable } from "./utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANDLORD = DEMO_USERS.LANDLORD;
const RENTER = DEMO_USERS.RENTER;

/** Landlord's rental properties (owner_key === 'LANDLORD' and listing_type === 'rent') */
const LANDLORD_RENTALS = DEMO_PROPERTIES.filter(
  (p) => p.owner_key === "LANDLORD" && p.listing_type === "rent",
);

/** Listing IDs for landlord's rental properties */
const RENTAL_LISTING_IDS = LANDLORD_RENTALS.map(
  (p) => DEMO_LISTING_IDS[p.id],
);

// ---------------------------------------------------------------------------
// Hardcoded UUIDs (e4000000 prefix pattern)
// ---------------------------------------------------------------------------

const TENANCY_IDS = {
  T1: "e4000000-0001-4000-8000-000000000001",
  T2: "e4000000-0002-4000-8000-000000000002",
  T3: "e4000000-0003-4000-8000-000000000003",
} as const;

// Financial entry IDs: e4000000-1NNN where N = tenancy(1-3), NN = payment(01-06)
function financialEntryId(tenancy: number, payment: number): string {
  return `e4000000-1${tenancy}${String(payment).padStart(2, "0")}-4000-8000-000000000001`;
}

// Property document IDs: e4000000-2PPD where P = property index, D = doc index
function documentId(propertyIdx: number, docIdx: number): string {
  return `e4000000-2${propertyIdx}${docIdx}0-4000-8000-000000000001`;
}

// Maintenance request IDs
const MAINTENANCE_IDS = [
  "e4000000-3001-4000-8000-000000000001",
  "e4000000-3002-4000-8000-000000000001",
  "e4000000-3003-4000-8000-000000000001",
  "e4000000-3004-4000-8000-000000000001",
  "e4000000-3005-4000-8000-000000000001",
  "e4000000-3006-4000-8000-000000000001", // emergency (fire-drill only)
] as const;

// Deposit registration IDs
const DEPOSIT_IDS = [
  "e4000000-4001-4000-8000-000000000001",
  "e4000000-4002-4000-8000-000000000001",
  "e4000000-4003-4000-8000-000000000001",
] as const;

// ---------------------------------------------------------------------------
// Row Builders
// ---------------------------------------------------------------------------

function buildTenancies(): Record<string, unknown>[] {
  // Tenancy 1: James Cooper on property 0008 (Flat 12, Crescent House) - £1200/month
  // Tenancy 2: property 0009 (28 Victoria Terrace) - £950/month
  // Tenancy 3: property 0010 (Apartment 4B, The Waterfront) - £1500/month
  const tenancyConfigs = [
    {
      id: TENANCY_IDS.T1,
      listingId: RENTAL_LISTING_IDS[0], // property 0008
      tenantId: RENTER.id,
      monthsAgo: 6,
      rent: 1200,
      deposit: 1200,
      scheme: "TDS" as const,
    },
    {
      id: TENANCY_IDS.T2,
      listingId: RENTAL_LISTING_IDS[1], // property 0009
      tenantId: LANDLORD.id, // fictional tenant (use landlord ID for simplicity)
      monthsAgo: 3,
      rent: 950,
      deposit: 950,
      scheme: "DPS" as const,
    },
    {
      id: TENANCY_IDS.T3,
      listingId: RENTAL_LISTING_IDS[2], // property 0010
      tenantId: LANDLORD.id, // fictional tenant (use landlord ID for simplicity)
      monthsAgo: 9,
      rent: 1500,
      deposit: 1500,
      scheme: "mydeposits" as const,
    },
  ];

  return tenancyConfigs.map((t) => {
    const leaseStart = daysAgo(t.monthsAgo * 30);
    const leaseEnd = new Date(leaseStart);
    leaseEnd.setFullYear(leaseEnd.getFullYear() + 1);

    return {
      id: t.id,
      listing_id: t.listingId,
      landlord_id: LANDLORD.id,
      tenant_id: t.tenantId,
      status: "active",
      lease_start_date: leaseStart.toISOString().split("T")[0],
      lease_end_date: leaseEnd.toISOString().split("T")[0],
      rent_amount: t.rent,
      rent_frequency: "monthly",
      deposit_amount: t.deposit,
      deposit_scheme: t.scheme,
      notes: null,
    };
  });
}

function buildFinancialEntries(scenario: Scenario): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  const tenancies = [
    { id: TENANCY_IDS.T1, rent: 1200, tenancyIdx: 1 },
    { id: TENANCY_IDS.T2, rent: 950, tenancyIdx: 2 },
    { id: TENANCY_IDS.T3, rent: 1500, tenancyIdx: 3 },
  ];

  for (const tenancy of tenancies) {
    for (let month = 0; month < 6; month++) {
      const paymentDate = new Date();
      paymentDate.setMonth(paymentDate.getMonth() - (5 - month));
      paymentDate.setDate(1);

      const isLatestPayment = month === 5;
      const isFireDrillOverdue =
        scenario === "fire-drill" &&
        isLatestPayment &&
        (tenancy.tenancyIdx === 1 || tenancy.tenancyIdx === 2);

      rows.push({
        id: financialEntryId(tenancy.tenancyIdx, month + 1),
        tenancy_id: tenancy.id,
        user_id: LANDLORD.id,
        type: "income",
        category: "rent",
        amount: tenancy.rent,
        date: paymentDate.toISOString().split("T")[0],
        description: `Rent payment - ${paymentDate.toLocaleString("en-GB", { month: "long", year: "numeric" })}`,
        status: isFireDrillOverdue ? "overdue" : "completed",
      });
    }
  }

  return rows;
}

function buildPropertyDocuments(scenario: Scenario): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const now = new Date();

  // Document types to seed per property
  const docTypes: Array<{
    type: string;
    label: string;
  }> = [
    { type: "gas_safety", label: "Gas Safety Certificate" },
    { type: "eicr", label: "Electrical Installation Condition Report" },
    { type: "epc", label: "Energy Performance Certificate" },
  ];

  // Use all 4 landlord rental properties for documents (up to 12 docs = 4 x 3)
  const propertiesToDocument = LANDLORD_RENTALS.slice(0, 4);

  for (let pIdx = 0; pIdx < propertiesToDocument.length; pIdx++) {
    const property = propertiesToDocument[pIdx];
    const listingId = DEMO_LISTING_IDS[property.id];

    for (let dIdx = 0; dIdx < docTypes.length; dIdx++) {
      const doc = docTypes[dIdx];

      // Default: valid with 6-11 months expiry
      let expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 6 + (pIdx + dIdx) % 6);

      // Fire-drill overrides
      if (scenario === "fire-drill") {
        // First property's gas_safety: expired yesterday
        if (pIdx === 0 && doc.type === "gas_safety") {
          expiryDate = daysAgo(1);
        }
        // Second property's eicr: expiring in 7 days
        if (pIdx === 1 && doc.type === "eicr") {
          expiryDate = new Date(now);
          expiryDate.setDate(expiryDate.getDate() + 7);
        }
      }

      // Calculate status from expiry_date
      let status: string;
      if (expiryDate < now) {
        status = "expired";
      } else {
        const thirtyDaysOut = new Date(now);
        thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
        status = expiryDate <= thirtyDaysOut ? "expiring" : "valid";
      }

      // Reminder date: 30 days before expiry
      const reminderDate = new Date(expiryDate);
      reminderDate.setDate(reminderDate.getDate() - 30);

      rows.push({
        id: documentId(pIdx, dIdx),
        listing_id: listingId,
        document_type: doc.type,
        file_url: `/demo/documents/${doc.type}_${property.postcode.replace(/\s/g, "")}.pdf`,
        file_name: `${doc.label} - ${property.address_line1}.pdf`,
        expiry_date: expiryDate.toISOString().split("T")[0],
        reminder_date: reminderDate.toISOString().split("T")[0],
        status,
        notes: null,
      });
    }
  }

  return rows;
}

function buildMaintenanceRequests(
  scenario: Scenario,
): Record<string, unknown>[] {
  const tenancy1ListingId = RENTAL_LISTING_IDS[0]; // property 0008
  const tenancy2ListingId = RENTAL_LISTING_IDS[1]; // property 0009

  const rows: Record<string, unknown>[] = [
    // Open requests
    {
      id: MAINTENANCE_IDS[0],
      listing_id: tenancy1ListingId,
      tenant_id: RENTER.id,
      reported_by: RENTER.id,
      title: "Leaking kitchen tap",
      description:
        "The kitchen mixer tap has started dripping constantly. Water pools around the base when in use. Tried tightening but it hasn't helped.",
      priority: "medium",
      status: "open",
      category: "plumbing",
      photos: JSON.stringify([]),
      resolution_notes: null,
      resolved_at: null,
      created_at: daysAgo(3).toISOString(),
    },
    {
      id: MAINTENANCE_IDS[1],
      listing_id: tenancy1ListingId,
      tenant_id: RENTER.id,
      reported_by: RENTER.id,
      title: "Boiler not heating",
      description:
        "The boiler fires up but radiators remain cold. Hot water is working fine but central heating won't come on. Tried resetting the thermostat.",
      priority: "high",
      status: "open",
      category: "plumbing",
      photos: JSON.stringify([]),
      resolution_notes: null,
      resolved_at: null,
      created_at: daysAgo(1).toISOString(),
    },
    // Completed requests
    {
      id: MAINTENANCE_IDS[2],
      listing_id: tenancy1ListingId,
      tenant_id: RENTER.id,
      reported_by: RENTER.id,
      title: "Broken window lock",
      description:
        "The lock mechanism on the bedroom window has snapped. Window can't be secured properly.",
      priority: "medium",
      status: "completed",
      category: "structural",
      photos: JSON.stringify([]),
      resolution_notes: "Lock replaced with new UPVC mechanism. Window fully functional.",
      resolved_at: daysAgo(14).toISOString(),
      created_at: daysAgo(21).toISOString(),
    },
    {
      id: MAINTENANCE_IDS[3],
      listing_id: tenancy2ListingId,
      tenant_id: LANDLORD.id,
      reported_by: LANDLORD.id,
      title: "Smoke alarm battery",
      description:
        "Smoke alarm in the hallway is chirping intermittently, indicating low battery.",
      priority: "low",
      status: "completed",
      category: "electrical",
      photos: JSON.stringify([]),
      resolution_notes: "Battery replaced in all smoke alarms during routine check.",
      resolved_at: daysAgo(7).toISOString(),
      created_at: daysAgo(10).toISOString(),
    },
    {
      id: MAINTENANCE_IDS[4],
      listing_id: tenancy2ListingId,
      tenant_id: LANDLORD.id,
      reported_by: LANDLORD.id,
      title: "Blocked drain",
      description:
        "Kitchen sink is draining very slowly. Tried using drain cleaner but it hasn't cleared the blockage.",
      priority: "medium",
      status: "completed",
      category: "plumbing",
      photos: JSON.stringify([]),
      resolution_notes: "Drain cleared by plumber. Grease buildup was the cause.",
      resolved_at: daysAgo(30).toISOString(),
      created_at: daysAgo(35).toISOString(),
    },
  ];

  // Fire-drill: add emergency request from last night
  if (scenario === "fire-drill") {
    rows.push({
      id: MAINTENANCE_IDS[5],
      listing_id: tenancy1ListingId,
      tenant_id: RENTER.id,
      reported_by: RENTER.id,
      title: "Burst pipe in bathroom",
      description:
        "A pipe has burst under the bathroom sink. Water is spraying everywhere. I've turned off the stopcock but there's significant water on the floor.",
      priority: "emergency",
      status: "open",
      category: "plumbing",
      photos: JSON.stringify([]),
      resolution_notes: null,
      resolved_at: null,
      created_at: hoursAgo(8).toISOString(),
    });
  }

  return rows;
}

function buildDepositRegistrations(): Record<string, unknown>[] {
  const configs = [
    { tenancyId: TENANCY_IDS.T1, amount: 1200, scheme: "TDS" as const },
    { tenancyId: TENANCY_IDS.T2, amount: 950, scheme: "DPS" as const },
    { tenancyId: TENANCY_IDS.T3, amount: 1500, scheme: "mydeposits" as const },
  ];

  return configs.map((c, idx) => ({
    id: DEPOSIT_IDS[idx],
    tenancy_id: c.tenancyId,
    amount: c.amount,
    scheme: c.scheme,
    registration_number: `${c.scheme.toUpperCase()}-2025-${String(100000 + idx * 11111).slice(0, 6)}`,
    registered_date: daysAgo(
      idx === 0 ? 180 : idx === 1 ? 90 : 270,
    )
      .toISOString()
      .split("T")[0],
    certificate_url: `/demo/deposits/${c.scheme.toLowerCase()}_cert_${idx + 1}.pdf`,
    status: "registered",
  }));
}

// ---------------------------------------------------------------------------
// Main Seed Function
// ---------------------------------------------------------------------------

export type SeedLandlordResult = {
  tenanciesSeeded: number;
  financialEntriesSeeded: number;
  propertyDocumentsSeeded: number;
  maintenanceRequestsSeeded: number;
  depositRegistrationsSeeded: number;
};

export async function seedLandlord(
  supabase: SupabaseClient,
  scenario: Scenario,
): Promise<SeedLandlordResult> {
  console.log(`\n--- Seeding Landlord Dashboard (scenario: ${scenario}) ---\n`);

  // 1. Tenancies
  const tenancyRows = buildTenancies();
  const tenancyResult = await seedTable(supabase, "tenancies", tenancyRows);

  // 2. Financial entries (rent payments)
  const financialRows = buildFinancialEntries(scenario);
  const financialResult = await seedTable(
    supabase,
    "financial_entries",
    financialRows,
  );

  // 3. Property documents (compliance)
  const documentRows = buildPropertyDocuments(scenario);
  const documentResult = await seedTable(
    supabase,
    "property_documents",
    documentRows,
  );

  // 4. Maintenance requests
  const maintenanceRows = buildMaintenanceRequests(scenario);
  const maintenanceResult = await seedTable(
    supabase,
    "maintenance_requests",
    maintenanceRows,
  );

  // 5. Deposit registrations
  const depositRows = buildDepositRegistrations();
  const depositResult = await seedTable(
    supabase,
    "deposit_registrations",
    depositRows,
  );

  const result: SeedLandlordResult = {
    tenanciesSeeded: tenancyResult.success ? tenancyResult.count : 0,
    financialEntriesSeeded: financialResult.success
      ? financialResult.count
      : 0,
    propertyDocumentsSeeded: documentResult.success
      ? documentResult.count
      : 0,
    maintenanceRequestsSeeded: maintenanceResult.success
      ? maintenanceResult.count
      : 0,
    depositRegistrationsSeeded: depositResult.success
      ? depositResult.count
      : 0,
  };

  console.log("\n--- Landlord Dashboard Summary ---");
  console.log(`  Tenancies seeded:            ${result.tenanciesSeeded}`);
  console.log(`  Financial entries seeded:     ${result.financialEntriesSeeded}`);
  console.log(`  Property documents seeded:    ${result.propertyDocumentsSeeded}`);
  console.log(`  Maintenance requests seeded:  ${result.maintenanceRequestsSeeded}`);
  console.log(`  Deposit registrations seeded: ${result.depositRegistrationsSeeded}`);

  return result;
}
