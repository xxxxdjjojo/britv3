#!/usr/bin/env tsx
/**
 * Seed Demo — Main Orchestrator
 *
 * Usage:
 *   SEED_TARGET=local pnpm seed:demo
 *   SEED_TARGET=local pnpm seed:demo --scenario fire-drill
 *   SEED_TARGET=local pnpm seed:demo --help
 *
 * Runs all seed steps in order, catches per-step errors so partial
 * data is better than no data, and prints a summary table at the end.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Scenario } from "./seed-demo/config";

import { SCENARIO_DESCRIPTIONS } from "./seed-demo/config";
import { isValidScenario, VALID_SCENARIOS } from "./seed-demo/scenarios";
import { createSupabaseAdmin } from "./seed-demo/utils";
import { cleanup } from "./seed-demo/cleanup";

import { seedUsers } from "./seed-demo/users";
import { seedProperties } from "./seed-demo/properties";
import { seedPhotos } from "./seed-demo/photos";
import { seedLandlord } from "./seed-demo/landlord";
import { seedAgent } from "./seed-demo/agent";
import { seedProvider } from "./seed-demo/provider";
import { seedSeller } from "./seed-demo/seller";
import { seedHomebuyer } from "./seed-demo/homebuyer";
import { seedRenter } from "./seed-demo/renter";
import { seedMessaging } from "./seed-demo/messaging";
import { seedReviews } from "./seed-demo/reviews";
import { seedAdmin } from "./seed-demo/admin";

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------

function printHelp(): void {
  console.log(`
Britestate Demo Seed Script
════════════════════════════

Seeds Supabase with realistic demo data for all 7 user roles.

Usage:
  SEED_TARGET=local pnpm seed:demo [options]

Options:
  --scenario <name>   Scenario preset (default: happy-path)
  --clean             Run cleanup before seeding (fresh start)
  --help              Show this help message

Scenarios:
${VALID_SCENARIOS.map((s) => `  ${s.padEnd(16)} ${SCENARIO_DESCRIPTIONS[s]}`).join("\n")}

Environment:
  SEED_TARGET must be 'local' or 'staging' (safety guard).
  Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
`);
}

function parseArgs(): { scenario: Scenario; clean: boolean } {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  let scenario: Scenario = "happy-path";
  let clean = args.includes("--clean");

  const scenarioIdx = args.indexOf("--scenario");
  if (scenarioIdx !== -1) {
    const value = args[scenarioIdx + 1];
    if (!value || value.startsWith("--")) {
      console.error("Error: --scenario requires a value.");
      console.error(`Valid scenarios: ${VALID_SCENARIOS.join(", ")}`);
      process.exit(1);
    }
    if (!isValidScenario(value)) {
      console.error(`Error: Unknown scenario '${value}'.`);
      console.error(`Valid scenarios: ${VALID_SCENARIOS.join(", ")}`);
      process.exit(1);
    }
    scenario = value;
  }

  return { scenario, clean };
}

// ---------------------------------------------------------------------------
// Step Runner
// ---------------------------------------------------------------------------

type StepStatus = "ok" | "failed" | "skipped";

interface StepResult {
  name: string;
  status: StepStatus;
  details: string;
  durationMs: number;
  error?: string;
}

async function runStep(
  name: string,
  fn: () => Promise<string>,
): Promise<StepResult> {
  const start = performance.now();
  try {
    const details = await fn();
    return {
      name,
      status: "ok",
      details,
      durationMs: performance.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n  ERROR in "${name}": ${message}\n`);
    return {
      name,
      status: "failed",
      details: message.slice(0, 60),
      durationMs: performance.now() - start,
      error: message,
    };
  }
}

// ---------------------------------------------------------------------------
// Summary Printer
// ---------------------------------------------------------------------------

function printSummary(
  scenario: Scenario,
  results: StepResult[],
  totalMs: number,
): void {
  const statusIcon = (s: StepStatus) =>
    s === "ok" ? "\u2705 OK" : s === "failed" ? "\u274C FAIL" : "\u23ED\uFE0F SKIP";

  console.log("\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  console.log("  DEMO SEED COMPLETE");
  console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  console.log(`  Scenario:   ${scenario}`);
  console.log(`  Duration:   ${(totalMs / 1000).toFixed(1)}s`);
  console.log("");

  // Column widths
  const nameWidth = 24;
  const statusWidth = 10;

  console.log(
    `  ${"Step".padEnd(nameWidth)}${"Status".padEnd(statusWidth)}Details`,
  );
  console.log(
    `  ${"\u2500".repeat(nameWidth)}${"\u2500".repeat(statusWidth)}${"\u2500".repeat(26)}`,
  );

  for (const r of results) {
    const icon = statusIcon(r.status);
    console.log(
      `  ${r.name.padEnd(nameWidth)}${icon.padEnd(statusWidth)}${r.details}`,
    );
  }

  const passed = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status === "failed").length;
  console.log("");
  console.log(`  ${passed}/${results.length} steps passed${failed > 0 ? `, ${failed} failed` : ""}`);
  console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { scenario, clean } = parseArgs();
  const totalStart = performance.now();

  console.log("\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  console.log("  BRITESTATE DEMO SEED");
  console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  console.log(`  Scenario:   ${scenario}`);
  console.log(`  Desc:       ${SCENARIO_DESCRIPTIONS[scenario]}`);
  console.log(`  Target:     ${process.env.SEED_TARGET}`);
  console.log("");

  // Create admin client (will throw if env is missing / production)
  const supabase: SupabaseClient = createSupabaseAdmin();

  // Optional cleanup before seeding
  if (clean) {
    console.log("Running cleanup first (--clean flag)...");
    await cleanup(supabase);
  }

  // ── Seed steps ─────────────────────────────────────────────────────────
  const results: StepResult[] = [];

  // Step 1: Users & Profiles
  results.push(
    await runStep("Users & Profiles", async () => {
      const r = await seedUsers(supabase);
      return `${r.usersCreated} created, ${r.usersSkipped} skipped, ${r.profilesSeeded} profiles`;
    }),
  );

  // Step 2: Properties & Listings
  results.push(
    await runStep("Properties & Listings", async () => {
      const r = await seedProperties(supabase);
      return `${r.propertiesSeeded} properties, ${r.listingsSeeded} listings`;
    }),
  );

  // Step 3: Photos
  results.push(
    await runStep("Photos", async () => {
      const r = await seedPhotos(supabase);
      return `${r.photosSeeded} photos`;
    }),
  );

  // Step 4: Landlord data
  results.push(
    await runStep("Landlord", async () => {
      const r = await seedLandlord(supabase, scenario);
      return `${r.tenanciesSeeded} tenancies, ${r.financialEntriesSeeded} payments, ${r.maintenanceRequestsSeeded} maint`;
    }),
  );

  // Step 5: Agent data
  results.push(
    await runStep("Agent", async () => {
      const r = await seedAgent(supabase, scenario);
      return `${r.leadsSeeded} leads, ${r.commissionsSeeded} commissions, ${r.offersSeeded} offers`;
    }),
  );

  // Step 6: Provider data
  results.push(
    await runStep("Provider", async () => {
      const r = await seedProvider(supabase, scenario);
      return `${r.serviceRequestsSeeded} requests, ${r.bookingsSeeded} bookings, ${r.invoicesSeeded} invoices`;
    }),
  );

  // Step 7: Seller data
  results.push(
    await runStep("Seller", async () => {
      const r = await seedSeller(supabase, scenario);
      return `${r.sellerListingsSeeded} listings, ${r.sellerOffersSeeded} offers, ${r.analyticsEventsSeeded} events`;
    }),
  );

  // Step 8: Homebuyer data
  results.push(
    await runStep("Homebuyer", async () => {
      const r = await seedHomebuyer(supabase, scenario);
      return `${r.savedPropertiesSeeded} saved, ${r.viewingsSeeded} viewings`;
    }),
  );

  // Step 9: Renter data
  results.push(
    await runStep("Renter", async () => {
      const r = await seedRenter(supabase, scenario);
      return `${r.tenantApplicationsSeeded} applications, ${r.financialEntriesSeeded} payments`;
    }),
  );

  // Step 10: Messaging
  results.push(
    await runStep("Messaging", async () => {
      await seedMessaging(supabase, scenario);
      return "conversations & messages seeded";
    }),
  );

  // Step 11: Reviews
  results.push(
    await runStep("Reviews", async () => {
      await seedReviews(supabase, scenario);
      return "reviews seeded";
    }),
  );

  // Step 12: Admin data
  results.push(
    await runStep("Admin", async () => {
      await seedAdmin(supabase, scenario);
      return "audit log & activity log seeded";
    }),
  );

  // ── Summary ────────────────────────────────────────────────────────────
  const totalMs = performance.now() - totalStart;
  printSummary(scenario, results, totalMs);

  // Exit with error code if any step failed
  const failures = results.filter((r) => r.status === "failed");
  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
