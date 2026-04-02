/**
 * Seed Demo — Renter Dashboard Data
 *
 * Seeds tenant_applications for James Cooper's renter dashboard.
 * Financial entries and tenancy are already created by landlord.ts,
 * so this module adds only renter-specific data that doesn't overlap.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_PROPERTIES, DEMO_USERS, type Scenario } from "./config";
import { daysAgo, seedTable } from "./utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RENTER = DEMO_USERS.RENTER;
const LANDLORD = DEMO_USERS.LANDLORD;

/** Landlord's rental properties */
const LANDLORD_RENTALS = DEMO_PROPERTIES.filter(
  (p) => p.owner_key === "LANDLORD" && p.listing_type === "rent",
);

/** First rental property ID (the one James rents) */
const JAMES_PROPERTY_ID = LANDLORD_RENTALS[0].id;

// ---------------------------------------------------------------------------
// Hardcoded UUIDs (09000000 prefix pattern)
// ---------------------------------------------------------------------------

function applicationId(n: number): string {
  return `09000000-1${String(n).padStart(3, "0")}-4000-8000-000000000001`;
}

function financialEntryId(n: number): string {
  return `09000000-2${String(n).padStart(3, "0")}-4000-8000-000000000001`;
}

// ---------------------------------------------------------------------------
// Row Builders
// ---------------------------------------------------------------------------

function buildTenantApplications(): Record<string, unknown>[] {
  // Application 1: Accepted — this is the tenancy already in landlord.ts
  //   Property 0008 (Flat 12, Crescent House)
  // Application 2: Pending — on property 0009 (28 Victoria Terrace)
  // Application 3: Rejected — on property 0010 (Apartment 4B, The Waterfront)
  return [
    {
      id: applicationId(1),
      property_id: LANDLORD_RENTALS[0].id, // Flat 12, Crescent House
      landlord_id: LANDLORD.id,
      applicant_user_id: RENTER.id,
      applicant_name: RENTER.name,
      applicant_email: RENTER.email,
      status: "approved",
      monthly_income: 4500,
      employment_status: "Full-time employed",
      credit_check_status: "passed",
      references_status: "verified",
      notes: "Excellent references from previous landlord. Stable employment.",
      rejection_reason: null,
      created_at: daysAgo(200).toISOString(),
      updated_at: daysAgo(190).toISOString(),
    },
    {
      id: applicationId(2),
      property_id: LANDLORD_RENTALS[1].id, // 28 Victoria Terrace
      landlord_id: LANDLORD.id,
      applicant_user_id: RENTER.id,
      applicant_name: RENTER.name,
      applicant_email: RENTER.email,
      status: "referencing",
      monthly_income: 4500,
      employment_status: "Full-time employed",
      credit_check_status: "passed",
      references_status: "pending",
      notes: "Applicant looking to relocate for work. Currently renting nearby.",
      rejection_reason: null,
      created_at: daysAgo(10).toISOString(),
      updated_at: daysAgo(7).toISOString(),
    },
    {
      id: applicationId(3),
      property_id: LANDLORD_RENTALS[2].id, // Apartment 4B, The Waterfront
      landlord_id: LANDLORD.id,
      applicant_user_id: RENTER.id,
      applicant_name: RENTER.name,
      applicant_email: RENTER.email,
      status: "rejected",
      monthly_income: 4500,
      employment_status: "Full-time employed",
      credit_check_status: "passed",
      references_status: "verified",
      notes: null,
      rejection_reason: "Another applicant was selected for this property.",
      created_at: daysAgo(45).toISOString(),
      updated_at: daysAgo(38).toISOString(),
    },
  ];
}

function buildAdditionalFinancialEntries(): Record<string, unknown>[] {
  // landlord.ts already seeds 6 financial_entries for tenancy T1 (James's tenancy)
  // from the landlord's perspective (user_id = LANDLORD.id, type = "income").
  // Here we add 6 entries from James's perspective as a renter expense.
  // Column names follow the same pattern as landlord.ts for consistency.
  const rows: Record<string, unknown>[] = [];
  const rent = 1200;

  for (let month = 0; month < 6; month++) {
    const paymentDate = new Date();
    paymentDate.setMonth(paymentDate.getMonth() - (5 - month));
    paymentDate.setDate(1);

    rows.push({
      id: financialEntryId(month + 1),
      property_id: JAMES_PROPERTY_ID,
      tenancy_id: "e4000000-0001-4000-8000-000000000001", // T1 from landlord.ts
      user_id: RENTER.id,
      type: "expense",
      category: "rent",
      amount: rent,
      entry_date: paymentDate.toISOString().split("T")[0],
      description: `Rent payment - ${paymentDate.toLocaleString("en-GB", { month: "long", year: "numeric" })}`,
      payment_status: "paid",
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Main Seed Function
// ---------------------------------------------------------------------------

export type SeedRenterResult = {
  tenantApplicationsSeeded: number;
  financialEntriesSeeded: number;
};

export async function seedRenter(
  supabase: SupabaseClient,
  scenario: Scenario,
): Promise<SeedRenterResult> {
  console.log(`\n--- Seeding Renter Dashboard (scenario: ${scenario}) ---\n`);

  // 1. Tenant applications
  const applicationRows = buildTenantApplications();
  const applicationResult = await seedTable(
    supabase,
    "tenant_applications",
    applicationRows,
  );

  // 2. Additional financial entries (renter perspective)
  const financialRows = buildAdditionalFinancialEntries();
  const financialResult = await seedTable(
    supabase,
    "financial_entries",
    financialRows,
  );

  const result: SeedRenterResult = {
    tenantApplicationsSeeded: applicationResult.success
      ? applicationResult.count
      : 0,
    financialEntriesSeeded: financialResult.success
      ? financialResult.count
      : 0,
  };

  console.log("\n--- Renter Dashboard Summary ---");
  console.log(
    `  Tenant applications seeded:  ${result.tenantApplicationsSeeded}`,
  );
  console.log(
    `  Financial entries seeded:     ${result.financialEntriesSeeded}`,
  );

  return result;
}
