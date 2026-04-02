/**
 * Seed Demo — Properties & Listings
 *
 * Upserts property rows and their associated listing rows
 * from DEMO_PROPERTIES config definitions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_PROPERTIES, DEMO_USERS, type DemoUserKey } from "./config";
import { daysAgo, randomDateBetween, seedTable } from "./utils";

// ---------------------------------------------------------------------------
// Hardcoded Listing UUIDs (so other seed modules can reference them)
// ---------------------------------------------------------------------------

/**
 * Maps property ID -> listing ID.
 * Pattern: replace "b1000001" prefix with "c2000001" for listings.
 */
export const DEMO_LISTING_IDS: Record<string, string> = Object.fromEntries(
  DEMO_PROPERTIES.map((p) => [
    p.id,
    p.id.replace(/^b1000001/, "c2000001"),
  ]),
);

// ---------------------------------------------------------------------------
// Row Builders
// ---------------------------------------------------------------------------

function buildPropertyRows(): Record<string, unknown>[] {
  return DEMO_PROPERTIES.map((p) => ({
    id: p.id,
    address_line1: p.address_line1,
    address_line2: p.address_line2,
    city: p.city,
    county: p.county,
    postcode: p.postcode,
    property_type: p.property_type,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    reception_rooms: p.reception_rooms,
    square_footage: p.square_footage || null,
    title: p.title,
    description: p.description,
    epc_rating: p.epc_rating,
    tenure: p.tenure,
    year_built: p.year_built || null,
    new_build: p.new_build,
    features: {},
  }));
}

function buildListingRows(): Record<string, unknown>[] {
  const now = new Date();
  const ninetyDaysAgo = daysAgo(90);

  return DEMO_PROPERTIES.map((p) => {
    const userId = DEMO_USERS[p.owner_key as DemoUserKey].id;
    const listingId = DEMO_LISTING_IDS[p.id];
    const listedDate = randomDateBetween(ninetyDaysAgo, now);
    const viewCount = Math.floor(Math.random() * 451) + 50; // 50-500

    const row: Record<string, unknown> = {
      id: listingId,
      property_id: p.id,
      user_id: userId,
      listing_type: p.listing_type,
      status: p.listing_status,
      price: p.price,
      price_qualifier: null,
      view_count: viewCount,
      listed_date: listedDate.toISOString().split("T")[0],
    };

    // rent_frequency only for rental listings
    if (p.listing_type === "rent") {
      row.rent_frequency = "monthly";
    }

    return row;
  });
}

// ---------------------------------------------------------------------------
// Main Seed Function
// ---------------------------------------------------------------------------

export type SeedPropertiesResult = {
  propertiesSeeded: number;
  listingsSeeded: number;
};

export async function seedProperties(
  supabase: SupabaseClient,
): Promise<SeedPropertiesResult> {
  console.log("\n--- Seeding Properties ---\n");

  const propertyRows = buildPropertyRows();
  const propertyResult = await seedTable(supabase, "properties", propertyRows);

  console.log("\n--- Seeding Listings ---\n");

  const listingRows = buildListingRows();
  const listingResult = await seedTable(supabase, "listings", listingRows);

  const propertiesSeeded = propertyResult.success ? propertyResult.count : 0;
  const listingsSeeded = listingResult.success ? listingResult.count : 0;

  console.log("\n--- Properties Summary ---");
  console.log(`  Properties seeded: ${propertiesSeeded}`);
  console.log(`  Listings seeded:   ${listingsSeeded}`);

  return { propertiesSeeded, listingsSeeded };
}
