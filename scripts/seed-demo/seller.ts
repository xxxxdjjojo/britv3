/**
 * Seed Demo — Seller Dashboard Data
 *
 * Seeds seller_listings, agent_enquiries, seller_viewings, seller_offers,
 * and listing_analytics_events for Emma Thompson's seller dashboard.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_PROPERTIES, DEMO_USERS, type Scenario } from "./config";
import { daysAgo, randomDateBetween, seedTable } from "./utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SELLER = DEMO_USERS.SELLER;
const AGENT = DEMO_USERS.AGENT;

/** Emma's properties (owner_key === 'SELLER') */
const SELLER_PROPERTIES = DEMO_PROPERTIES.filter(
  (p) => p.owner_key === "SELLER",
);

// ---------------------------------------------------------------------------
// Hardcoded UUIDs (h7000000 prefix pattern)
// ---------------------------------------------------------------------------

const SELLER_LISTING_IDS = {
  SL1: "h7000000-0001-4000-8000-000000000001", // 14 Rosemary Lane
  SL2: "h7000000-0002-4000-8000-000000000002", // Flat 7, The Meridian
  SL3: "h7000000-0003-4000-8000-000000000003", // 8 Oakfield Drive
  SL4: "h7000000-0004-4000-8000-000000000004", // The Old Rectory
  SL5: "h7000000-0005-4000-8000-000000000005", // Flat 22, Deansgate Towers (draft)
} as const;

const SELLER_LISTING_IDS_ARR = Object.values(SELLER_LISTING_IDS);

function enquiryId(n: number): string {
  return `h7000000-1${String(n).padStart(3, "0")}-4000-8000-000000000001`;
}

function viewingId(n: number): string {
  return `h7000000-2${String(n).padStart(3, "0")}-4000-8000-000000000001`;
}

function offerId(n: number): string {
  return `h7000000-3${String(n).padStart(3, "0")}-4000-8000-000000000001`;
}

function analyticsId(listing: number, n: number): string {
  return `h7000000-4${listing}${String(n).padStart(3, "0")}-4000-8000-000000000001`;
}

// ---------------------------------------------------------------------------
// Row Builders
// ---------------------------------------------------------------------------

function buildSellerListings(): Record<string, unknown>[] {
  return SELLER_PROPERTIES.map((p, idx) => {
    const slId = SELLER_LISTING_IDS_ARR[idx];
    const publishedAt =
      p.listing_status === "draft" ? null : daysAgo(60 + idx * 10).toISOString();

    return {
      id: slId,
      seller_id: SELLER.id,
      postcode: p.postcode,
      address_line_1: p.address_line1,
      address_line_2: p.address_line2,
      city: p.city,
      property_type: p.property_type === "semi_detached"
        ? "semi-detached"
        : p.property_type === "flat" || p.property_type === "terraced" || p.property_type === "detached" || p.property_type === "bungalow"
          ? p.property_type
          : "other",
      tenure: p.tenure === "shared_ownership" ? "freehold" : p.tenure,
      leasehold_years_remaining: p.tenure === "leasehold" ? 985 : null,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      features: ["Central heating", "Double glazing"],
      council_tax_band: "D",
      epc_band: p.epc_rating === "N" ? null : p.epc_rating,
      photos: JSON.stringify([]),
      floor_plan_url: null,
      description: p.description,
      description_tone: "professional",
      key_selling_points: [p.title],
      asking_price: p.price,
      listing_type: "for_sale",
      price_qualifier: null,
      ai_valuation_estimate: Math.round(p.price * (0.95 + Math.random() * 0.1)),
      epc_url: null,
      managed_by_agent_id: AGENT.id,
      status: p.listing_status === "under_offer" ? "under_offer" : p.listing_status,
      published_at: publishedAt,
    };
  });
}

function buildAgentEnquiries(): Record<string, unknown>[] {
  const statuses: Array<"sent" | "responded" | "booked"> = [
    "sent", "responded", "booked", "responded",
    "sent", "booked", "responded", "sent",
  ];

  const messages = [
    "I'm interested in listing your property. We've had great success in your area recently.",
    "Following up on the valuation — I'd love to discuss our marketing strategy for your home.",
    "We have active buyers looking in your postcode. Could we arrange a viewing?",
    "Just wanted to share our recent sale prices in your area. I think your property could achieve even more.",
    "Our digital marketing package includes professional photography and a virtual tour. Shall I send details?",
    "I noticed your listing and would like to offer a free market appraisal.",
    "We've just sold a similar property nearby for above asking price. I'd love to help with yours.",
    "As a local specialist, I believe I can maximise your sale price. Let's chat?",
  ];

  return statuses.map((status, idx) => ({
    id: enquiryId(idx + 1),
    seller_id: SELLER.id,
    agent_id: AGENT.id,
    listing_id: SELLER_LISTING_IDS_ARR[idx % 4], // spread across first 4 active listings
    message: messages[idx],
    status,
    created_at: daysAgo(30 - idx * 3).toISOString(),
  }));
}

function buildSellerViewings(): Record<string, unknown>[] {
  const now = new Date();
  const buyers = [
    { name: "David Chen", email: "david.chen@example.com" },
    { name: "Sophie Williams", email: "sophie.w@example.com" },
    { name: "Marcus Johnson", email: "marcus.j@example.com" },
    { name: "Emma Patel", email: "emma.patel@example.com" },
    { name: "Oliver Brown", email: "oliver.b@example.com" },
    { name: "Charlotte Davies", email: "charlotte.d@example.com" },
    { name: "James Wilson", email: "james.w@example.com" },
    { name: "Amelia Taylor", email: "amelia.t@example.com" },
    { name: "George Harris", email: "george.h@example.com" },
    { name: "Isabella Clark", email: "isabella.c@example.com" },
    { name: "Harry Martin", email: "harry.m@example.com" },
    { name: "Lily Robinson", email: "lily.r@example.com" },
  ];

  // 7 completed (past), 5 upcoming (future)
  const viewings: Record<string, unknown>[] = [];

  for (let i = 0; i < 12; i++) {
    const isPast = i < 7;
    const buyer = buyers[i];
    const listingIdx = i % 4; // spread across 4 active listings

    let viewingDate: Date;
    if (isPast) {
      viewingDate = daysAgo(30 - i * 4);
    } else {
      viewingDate = new Date(now);
      viewingDate.setDate(viewingDate.getDate() + (i - 6) * 3);
      viewingDate.setHours(10 + (i % 4), 0, 0, 0);
    }

    viewings.push({
      id: viewingId(i + 1),
      listing_id: SELLER_LISTING_IDS_ARR[listingIdx],
      seller_id: SELLER.id,
      buyer_name: buyer.name,
      buyer_email: buyer.email,
      viewing_datetime: viewingDate.toISOString(),
      viewing_type: i % 3 === 0 ? "virtual" : "in_person",
      status: isPast ? "completed" : i === 11 ? "pending" : "confirmed",
      feedback: isPast
        ? [
            "Loved the garden, concerned about the kitchen size.",
            "Very impressed, will discuss with partner.",
            "Not quite what they were looking for.",
            "Excellent condition, very interested.",
            "Liked the location, wants a second viewing.",
            "Good property but slightly over budget.",
            "Very keen, asked about offers.",
          ][i]
        : null,
      notes: null,
    });
  }

  return viewings;
}

function buildSellerOffers(): Record<string, unknown>[] {
  const now = new Date();

  return [
    // Offer 1: Accepted on Flat 7, The Meridian (under_offer listing)
    {
      id: offerId(1),
      listing_id: SELLER_LISTING_IDS.SL2,
      seller_id: SELLER.id,
      buyer_name: "David Chen",
      buyer_email: "david.chen@example.com",
      amount: 610000,
      buyer_type: "mortgage",
      chain_status: "chain_free",
      chain_length: 0,
      is_verified: true,
      conditions: "Subject to survey and mortgage approval.",
      solicitor_name: "Harrison & Co Solicitors",
      solicitor_email: "conveyancing@harrison.co.uk",
      solicitor_phone: "020 7946 0958",
      status: "accepted",
      counter_amount: null,
      counter_message: null,
      offered_at: daysAgo(14).toISOString(),
      responded_at: daysAgo(12).toISOString(),
    },
    // Offer 2: Rejected on 14 Rosemary Lane
    {
      id: offerId(2),
      listing_id: SELLER_LISTING_IDS.SL1,
      seller_id: SELLER.id,
      buyer_name: "Sophie Williams",
      buyer_email: "sophie.w@example.com",
      amount: 780000,
      buyer_type: "mortgage",
      chain_status: "in_chain",
      chain_length: 2,
      is_verified: false,
      conditions: "Subject to sale of current property.",
      solicitor_name: null,
      solicitor_email: null,
      solicitor_phone: null,
      status: "rejected",
      counter_amount: null,
      counter_message: "Offer too low and chain too long.",
      offered_at: daysAgo(21).toISOString(),
      responded_at: daysAgo(19).toISOString(),
    },
    // Offer 3: Pending on 14 Rosemary Lane
    {
      id: offerId(3),
      listing_id: SELLER_LISTING_IDS.SL1,
      seller_id: SELLER.id,
      buyer_name: "Marcus Johnson",
      buyer_email: "marcus.j@example.com",
      amount: 860000,
      buyer_type: "cash",
      chain_status: "chain_free",
      chain_length: 0,
      is_verified: true,
      conditions: "Cash buyer, no chain. Flexible on completion date.",
      solicitor_name: "Bennett Legal LLP",
      solicitor_email: "info@bennettlegal.co.uk",
      solicitor_phone: "020 7123 4567",
      status: "pending",
      counter_amount: null,
      counter_message: null,
      offered_at: daysAgo(2).toISOString(),
      responded_at: null,
    },
  ];
}

function buildListingAnalyticsEvents(): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const eventTypes: Array<"view" | "save" | "enquiry" | "phone_click" | "email_click"> = [
    "view", "save", "enquiry", "phone_click", "email_click",
  ];
  const eventWeights = [60, 20, 10, 5, 5]; // % distribution

  // Generate events for first 4 active seller listings over 90 days
  const activeListings = SELLER_LISTING_IDS_ARR.slice(0, 4);
  let globalIdx = 0;

  for (let lIdx = 0; lIdx < activeListings.length; lIdx++) {
    const listingId = activeListings[lIdx];

    // ~55 events per listing = ~220 total
    for (let day = 0; day < 90; day++) {
      // Increasing trend: more events in recent days
      const trendMultiplier = 0.5 + (day / 90) * 1.5; // 0.5x to 2x
      const dailyEvents = Math.max(0, Math.round(trendMultiplier * (0.3 + Math.random() * 0.8)));

      for (let e = 0; e < dailyEvents; e++) {
        // Pick event type based on weights
        const roll = Math.random() * 100;
        let cumulative = 0;
        let eventType = eventTypes[0];
        for (let w = 0; w < eventWeights.length; w++) {
          cumulative += eventWeights[w];
          if (roll < cumulative) {
            eventType = eventTypes[w];
            break;
          }
        }

        const eventDate = daysAgo(90 - day);
        eventDate.setHours(
          8 + Math.floor(Math.random() * 14),
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60),
        );

        rows.push({
          id: analyticsId(lIdx, globalIdx),
          listing_id: listingId,
          event_type: eventType,
          occurred_at: eventDate.toISOString(),
          visitor_fingerprint: `fp_${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`,
        });

        globalIdx++;
      }
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Main Seed Function
// ---------------------------------------------------------------------------

export type SeedSellerResult = {
  sellerListingsSeeded: number;
  agentEnquiriesSeeded: number;
  sellerViewingsSeeded: number;
  sellerOffersSeeded: number;
  analyticsEventsSeeded: number;
};

export async function seedSeller(
  supabase: SupabaseClient,
  scenario: Scenario,
): Promise<SeedSellerResult> {
  console.log(`\n--- Seeding Seller Dashboard (scenario: ${scenario}) ---\n`);

  // 1. Seller listings
  const sellerListingRows = buildSellerListings();
  const sellerListingResult = await seedTable(
    supabase,
    "seller_listings",
    sellerListingRows,
  );

  // 2. Agent enquiries
  const enquiryRows = buildAgentEnquiries();
  const enquiryResult = await seedTable(
    supabase,
    "agent_enquiries",
    enquiryRows,
  );

  // 3. Seller viewings
  const viewingRows = buildSellerViewings();
  const viewingResult = await seedTable(
    supabase,
    "seller_viewings",
    viewingRows,
  );

  // 4. Seller offers
  const offerRows = buildSellerOffers();
  const offerResult = await seedTable(supabase, "seller_offers", offerRows);

  // 5. Listing analytics events
  const analyticsRows = buildListingAnalyticsEvents();
  const analyticsResult = await seedTable(
    supabase,
    "listing_analytics_events",
    analyticsRows,
  );

  const result: SeedSellerResult = {
    sellerListingsSeeded: sellerListingResult.success
      ? sellerListingResult.count
      : 0,
    agentEnquiriesSeeded: enquiryResult.success ? enquiryResult.count : 0,
    sellerViewingsSeeded: viewingResult.success ? viewingResult.count : 0,
    sellerOffersSeeded: offerResult.success ? offerResult.count : 0,
    analyticsEventsSeeded: analyticsResult.success
      ? analyticsResult.count
      : 0,
  };

  console.log("\n--- Seller Dashboard Summary ---");
  console.log(`  Seller listings seeded:    ${result.sellerListingsSeeded}`);
  console.log(`  Agent enquiries seeded:    ${result.agentEnquiriesSeeded}`);
  console.log(`  Seller viewings seeded:    ${result.sellerViewingsSeeded}`);
  console.log(`  Seller offers seeded:      ${result.sellerOffersSeeded}`);
  console.log(`  Analytics events seeded:   ${result.analyticsEventsSeeded}`);

  return result;
}
