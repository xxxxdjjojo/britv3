/**
 * Seed Demo — Homebuyer Dashboard Data
 *
 * Seeds saved_properties, saved_searches, viewing_slots, and viewings
 * for Sarah Mitchell's homebuyer dashboard.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_PROPERTIES, DEMO_USERS, type Scenario } from "./config";
import { DEMO_LISTING_IDS } from "./properties";
import { daysAgo, seedTable } from "./utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOMEBUYER = DEMO_USERS.HOMEBUYER;
const AGENT = DEMO_USERS.AGENT;

/** All sale-type listing IDs for Sarah to browse */
const SALE_LISTINGS = DEMO_PROPERTIES.filter(
  (p) => p.listing_type === "sale",
);

// ---------------------------------------------------------------------------
// Hardcoded UUIDs (i8000000 prefix pattern)
// ---------------------------------------------------------------------------

function savedPropertyId(n: number): string {
  return `i8000000-1${String(n).padStart(3, "0")}-4000-8000-000000000001`;
}

function savedSearchId(n: number): string {
  return `i8000000-2${String(n).padStart(3, "0")}-4000-8000-000000000001`;
}

function viewingSlotId(n: number): string {
  return `i8000000-3${String(n).padStart(3, "0")}-4000-8000-000000000001`;
}

function viewingRecordId(n: number): string {
  return `i8000000-4${String(n).padStart(3, "0")}-4000-8000-000000000001`;
}

// ---------------------------------------------------------------------------
// Row Builders
// ---------------------------------------------------------------------------

function buildSavedProperties(): Record<string, unknown>[] {
  // Sarah saved 8 properties — pick from sale listings
  const savedListings = SALE_LISTINGS.slice(0, 8);

  return savedListings.map((p, idx) => ({
    id: savedPropertyId(idx + 1),
    user_id: HOMEBUYER.id,
    listing_id: DEMO_LISTING_IDS[p.id],
    notes: [
      "Love the garden, need to check school catchment.",
      "Great location near tube station.",
      "Slightly over budget but worth a viewing.",
      "Modern kitchen, exactly what we want.",
      "Period features are stunning.",
      "Good investment potential.",
      "Need second viewing to decide.",
      "Perfect for our family size.",
    ][idx],
    created_at: daysAgo(30 - idx * 3).toISOString(),
  }));
}

function buildSavedSearches(): Record<string, unknown>[] {
  return [
    {
      id: savedSearchId(1),
      user_id: HOMEBUYER.id,
      name: "2+ bed in Islington under £650k",
      filters: JSON.stringify({
        location: "Islington, London",
        min_bedrooms: 2,
        max_price: 650000,
        property_types: ["flat", "terraced"],
        listing_type: "sale",
      }),
      alerts_enabled: true,
      alert_frequency: "daily",
      last_alerted_at: daysAgo(1).toISOString(),
      new_results_count: 3,
      created_at: daysAgo(45).toISOString(),
    },
    {
      id: savedSearchId(2),
      user_id: HOMEBUYER.id,
      name: "Family homes in Battersea",
      filters: JSON.stringify({
        location: "Battersea, London",
        min_bedrooms: 3,
        max_price: 950000,
        property_types: ["terraced", "semi_detached", "detached"],
        listing_type: "sale",
      }),
      alerts_enabled: true,
      alert_frequency: "weekly",
      last_alerted_at: daysAgo(5).toISOString(),
      new_results_count: 1,
      created_at: daysAgo(30).toISOString(),
    },
    {
      id: savedSearchId(3),
      user_id: HOMEBUYER.id,
      name: "New builds in Bristol under £600k",
      filters: JSON.stringify({
        location: "Bristol",
        max_price: 600000,
        new_build: true,
        listing_type: "sale",
      }),
      alerts_enabled: false,
      alert_frequency: "daily",
      last_alerted_at: null,
      new_results_count: 0,
      created_at: daysAgo(60).toISOString(),
    },
  ];
}

function buildViewingSlots(): Record<string, unknown>[] {
  const now = new Date();
  const slots: Record<string, unknown>[] = [];

  // 5 viewing slots on Agent's listings that Sarah will book
  // Pick 5 sale listings managed by the agent
  const agentSaleListings = SALE_LISTINGS.filter(
    (p) => p.owner_key === "AGENT",
  );
  const viewedListings = [
    ...agentSaleListings.slice(0, 3), // 3 agent listings
    SALE_LISTINGS[0], // Emma's listing 1 (14 Rosemary Lane)
    SALE_LISTINGS[1], // Emma's listing 2 (Flat 7, The Meridian)
  ];

  for (let i = 0; i < 5; i++) {
    const isPast = i < 2;
    const listing = viewedListings[i];

    let startTime: Date;
    if (isPast) {
      startTime = daysAgo(14 - i * 7);
      startTime.setHours(10 + i * 2, 0, 0, 0);
    } else {
      startTime = new Date(now);
      startTime.setDate(startTime.getDate() + (i - 1) * 3);
      startTime.setHours(11 + i, 0, 0, 0);
    }

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 30);

    slots.push({
      id: viewingSlotId(i + 1),
      listing_id: DEMO_LISTING_IDS[listing.id],
      agent_id: AGENT.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      type: i === 2 ? "virtual" : "in_person",
      status: "booked",
    });
  }

  return slots;
}

function buildViewings(): Record<string, unknown>[] {
  const agentSaleListings = SALE_LISTINGS.filter(
    (p) => p.owner_key === "AGENT",
  );
  const viewedListings = [
    ...agentSaleListings.slice(0, 3),
    SALE_LISTINGS[0],
    SALE_LISTINGS[1],
  ];

  return viewedListings.map((listing, i) => ({
    id: viewingRecordId(i + 1),
    user_id: HOMEBUYER.id,
    slot_id: viewingSlotId(i + 1),
    listing_id: DEMO_LISTING_IDS[listing.id],
    status: i < 2 ? "completed" : "confirmed",
    type: i === 2 ? "virtual" : "in_person",
    notes: i < 2
      ? [
          "Property was in excellent condition. Loved the harbour views.",
          "Charming cottage but slightly small for our needs.",
        ][i]
      : null,
  }));
}

// ---------------------------------------------------------------------------
// Main Seed Function
// ---------------------------------------------------------------------------

export type SeedHomebuyerResult = {
  savedPropertiesSeeded: number;
  savedSearchesSeeded: number;
  viewingSlotsSeeded: number;
  viewingsSeeded: number;
};

export async function seedHomebuyer(
  supabase: SupabaseClient,
  scenario: Scenario,
): Promise<SeedHomebuyerResult> {
  console.log(
    `\n--- Seeding Homebuyer Dashboard (scenario: ${scenario}) ---\n`,
  );

  // 1. Saved properties
  const savedPropertyRows = buildSavedProperties();
  const savedPropertyResult = await seedTable(
    supabase,
    "saved_properties",
    savedPropertyRows,
  );

  // 2. Saved searches
  const savedSearchRows = buildSavedSearches();
  const savedSearchResult = await seedTable(
    supabase,
    "saved_searches",
    savedSearchRows,
  );

  // 3. Viewing slots (must be created before viewings)
  const slotRows = buildViewingSlots();
  const slotResult = await seedTable(supabase, "viewing_slots", slotRows);

  // 4. Viewings
  const viewingRows = buildViewings();
  const viewingResult = await seedTable(supabase, "viewings", viewingRows);

  const result: SeedHomebuyerResult = {
    savedPropertiesSeeded: savedPropertyResult.success
      ? savedPropertyResult.count
      : 0,
    savedSearchesSeeded: savedSearchResult.success
      ? savedSearchResult.count
      : 0,
    viewingSlotsSeeded: slotResult.success ? slotResult.count : 0,
    viewingsSeeded: viewingResult.success ? viewingResult.count : 0,
  };

  console.log("\n--- Homebuyer Dashboard Summary ---");
  console.log(`  Saved properties seeded:  ${result.savedPropertiesSeeded}`);
  console.log(`  Saved searches seeded:    ${result.savedSearchesSeeded}`);
  console.log(`  Viewing slots seeded:     ${result.viewingSlotsSeeded}`);
  console.log(`  Viewings seeded:          ${result.viewingsSeeded}`);

  return result;
}
