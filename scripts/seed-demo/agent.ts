/**
 * Seed Demo — Agent Dashboard Data
 *
 * Seeds leads, commissions, offers, viewing slots, viewing feedback,
 * and agency profile for Victoria Stone's estate agent dashboard.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_PROPERTIES, DEMO_USERS, type Scenario } from "./config";
import { DEMO_LISTING_IDS } from "./properties";
import { daysAgo, hoursAgo, seedTable } from "./utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT = DEMO_USERS.AGENT;
const HOMEBUYER = DEMO_USERS.HOMEBUYER;

/** Agent's own properties (owner_key === 'AGENT') */
const AGENT_PROPERTIES = DEMO_PROPERTIES.filter(
  (p) => p.owner_key === "AGENT",
);

/** Agent's sale properties */
const AGENT_SALE_PROPERTIES = AGENT_PROPERTIES.filter(
  (p) => p.listing_type === "sale",
);

/** Listing IDs for agent's properties */
const AGENT_LISTING_IDS = AGENT_PROPERTIES.map((p) => DEMO_LISTING_IDS[p.id]);

/** Sale listing IDs for agent's properties */
const AGENT_SALE_LISTING_IDS = AGENT_SALE_PROPERTIES.map(
  (p) => DEMO_LISTING_IDS[p.id],
);

// ---------------------------------------------------------------------------
// Hardcoded UUIDs (f5000000 prefix pattern)
// ---------------------------------------------------------------------------

// Lead IDs: f5000000-01NN
function leadId(n: number): string {
  return `f5000000-01${String(n).padStart(2, "0")}-4000-8000-000000000001`;
}

// Commission IDs: f5000000-02NN
function commissionId(n: number): string {
  return `f5000000-02${String(n).padStart(2, "0")}-4000-8000-000000000001`;
}

// Offer IDs: f5000000-03NN
function offerId(n: number): string {
  return `f5000000-03${String(n).padStart(2, "0")}-4000-8000-000000000001`;
}

// Viewing slot IDs: f5000000-04NN
function viewingSlotId(n: number): string {
  return `f5000000-04${String(n).padStart(2, "0")}-4000-8000-000000000001`;
}

// Viewing feedback IDs: f5000000-05NN
function feedbackId(n: number): string {
  return `f5000000-05${String(n).padStart(2, "0")}-4000-8000-000000000001`;
}

const AGENCY_PROFILE_ID = "f5000000-0600-4000-8000-000000000001";

// ---------------------------------------------------------------------------
// UK Names & Data
// ---------------------------------------------------------------------------

const UK_FIRST_NAMES = [
  "Oliver", "Charlotte", "Harry", "Amelia", "George", "Isla", "Jack",
  "Emily", "Thomas", "Sophia", "James", "Mia", "William", "Poppy",
  "Henry", "Ella", "Alexander", "Lily", "Daniel", "Grace",
  "Samuel", "Freya", "Benjamin", "Chloe", "Noah", "Florence",
  "Ethan", "Ruby", "Matthew", "Hannah", "Archie", "Daisy",
];

const UK_LAST_NAMES = [
  "Smith", "Jones", "Taylor", "Brown", "Wilson", "Davies", "Evans",
  "Thomas", "Roberts", "Johnson", "Walker", "Wright", "Robinson",
  "Hall", "Clarke", "Green", "Lewis", "Wood", "Harris", "King",
  "Phillips", "Turner", "Martin", "Baker", "Harrison", "Morgan",
  "Patel", "Campbell", "Bell", "Murray",
];

function ukName(firstIdx: number, lastIdx: number): string {
  return `${UK_FIRST_NAMES[firstIdx % UK_FIRST_NAMES.length]} ${UK_LAST_NAMES[lastIdx % UK_LAST_NAMES.length]}`;
}

function ukEmail(name: string): string {
  return `${name.toLowerCase().replace(/\s/g, ".")}@example.co.uk`;
}

function ukPhone(idx: number): string {
  const base = 7700100000 + idx * 1111;
  return `0${base}`;
}

// ---------------------------------------------------------------------------
// Row Builders
// ---------------------------------------------------------------------------

function buildAgencyProfile(): Record<string, unknown> {
  return {
    id: AGENCY_PROFILE_ID,
    agent_id: AGENT.id,
    agency_name: "Stone & Partners Estate Agents",
    contact_email: "info@stoneandpartners.co.uk",
    contact_phone: "020 7946 0958",
    address_line_1: "42 High Street",
    address_line_2: null,
    city: "London",
    postcode: "SW1A 1AA",
    description:
      "Award-winning independent estate agency established in 2015, specialising in residential sales and lettings across London, the South East, and beyond. Known for our personalised service and deep local market knowledge.",
    specializations: ["residential_sales", "lettings", "new_build", "luxury"],
    coverage_areas: [
      "London",
      "Bristol",
      "Edinburgh",
      "Oxfordshire",
      "Cornwall",
      "Surrey",
      "North Yorkshire",
      "Birmingham",
    ],
    logo_url: null,
    brand_primary_colour: "#1A365D",
    brand_secondary_colour: "#C69749",
    social_facebook: "https://facebook.com/stoneandpartners",
    social_twitter: "https://twitter.com/stoneandpartners",
    social_instagram: "https://instagram.com/stoneandpartners",
    social_linkedin: "https://linkedin.com/company/stoneandpartners",
    website_url: "https://stoneandpartners.co.uk",
  };
}

/**
 * Build agent leads distributed across pipeline stages.
 * DB stages: 'new_enquiry' | 'qualified' | 'viewing_booked' | 'offer_made' | 'closed'
 */
function buildLeads(scenario: Scenario): Record<string, unknown>[] {
  // Stage distribution: maps DB enum values to counts
  const stageCounts: Record<string, number> = {
    new_enquiry: scenario === "growth-mode" ? 24 : 8,
    qualified: 6,
    viewing_booked: 5,
    offer_made: 4,
    closed: 5, // 3 won + 2 lost (tracked in notes)
  };

  const sources: Array<
    "website" | "referral" | "portal" | "phone" | "walk_in"
  > = ["website", "referral", "portal", "phone", "walk_in"];

  const budgetRanges: Array<[number, number]> = [
    [150000, 250000],
    [200000, 350000],
    [250000, 400000],
    [300000, 500000],
    [350000, 550000],
    [400000, 650000],
    [450000, 700000],
    [500000, 800000],
  ];

  const propertyInterests = [
    "3-bed semi in Bristol area",
    "2-bed flat in Edinburgh, near transport",
    "Family home in Oxfordshire, good schools",
    "Investment flat in Birmingham, high yield",
    "Character cottage, Henley area",
    "New build detached, any location",
    "Penthouse or luxury flat, Edinburgh/London",
    "Building plot with planning permission",
    "Bungalow near coast",
    "Period property, Bath or Bristol",
  ];

  const rows: Record<string, unknown>[] = [];
  let idx = 0;

  for (const [stage, count] of Object.entries(stageCounts)) {
    for (let i = 0; i < count; i++) {
      const name = ukName(idx, idx + 3);
      const createdDays =
        stage === "new_enquiry"
          ? Math.floor(Math.random() * 7) + 1
          : stage === "qualified"
            ? Math.floor(Math.random() * 14) + 7
            : stage === "viewing_booked"
              ? Math.floor(Math.random() * 14) + 14
              : stage === "offer_made"
                ? Math.floor(Math.random() * 21) + 21
                : Math.floor(Math.random() * 30) + 30;

      const listingIdx = idx % AGENT_LISTING_IDS.length;

      rows.push({
        id: leadId(idx + 1),
        agent_id: AGENT.id,
        property_id: AGENT_LISTING_IDS[listingIdx],
        contact_name: name,
        contact_email: ukEmail(name),
        contact_phone: ukPhone(idx),
        stage,
        source: sources[idx % sources.length],
        assigned_to: null,
        notes:
          stage === "closed" && i >= 3
            ? "Lead went cold — decided not to proceed."
            : stage === "closed"
              ? `Completed sale. ${propertyInterests[idx % propertyInterests.length]}`
              : `Interested in: ${propertyInterests[idx % propertyInterests.length]}`,
        created_at: daysAgo(createdDays).toISOString(),
      });

      idx++;
    }
  }

  // Ensure Sarah Mitchell (HOMEBUYER) is one of the leads (override first 'qualified' lead)
  const sarahIdx = rows.findIndex(
    (r) => r.stage === "qualified",
  );
  if (sarahIdx >= 0) {
    rows[sarahIdx] = {
      ...rows[sarahIdx],
      contact_name: HOMEBUYER.name,
      contact_email: HOMEBUYER.email,
      contact_phone: "07700900001",
      notes: "Actively searching for 2-3 bed property in London. Pre-approved mortgage.",
    };
  }

  return rows;
}

/**
 * Build commissions for recent completed sales.
 * Uses agent's sale listings where possible.
 */
function buildCommissions(): Record<string, unknown>[] {
  const configs = [
    {
      listingId: AGENT_SALE_LISTING_IDS[0], // Bristol new build
      salePrice: 550000,
      rate: 1.25,
      status: "paid" as const,
      paidDaysAgo: 14,
    },
    {
      listingId: AGENT_SALE_LISTING_IDS[1], // Edinburgh penthouse
      salePrice: 710000,
      rate: 1.0,
      status: "paid" as const,
      paidDaysAgo: 30,
    },
    {
      listingId: AGENT_SALE_LISTING_IDS[2], // Henley cottage (sold)
      salePrice: 585000,
      rate: 1.5,
      status: "paid" as const,
      paidDaysAgo: 45,
    },
    {
      listingId: AGENT_SALE_LISTING_IDS[3], // Whitby bungalow
      salePrice: 320000,
      rate: 1.25,
      status: "invoiced" as const,
      paidDaysAgo: null,
    },
    {
      listingId: AGENT_SALE_LISTING_IDS[4], // Falmouth cottage
      salePrice: 380000,
      rate: 1.0,
      status: "pending" as const,
      paidDaysAgo: null,
    },
  ];

  return configs.map((c, i) => ({
    id: commissionId(i + 1),
    agent_id: AGENT.id,
    property_id: c.listingId,
    sale_price: c.salePrice,
    commission_rate: c.rate,
    commission_amount: Math.round(c.salePrice * (c.rate / 100)),
    status: c.status,
    paid_at: c.paidDaysAgo
      ? daysAgo(c.paidDaysAgo).toISOString()
      : null,
    created_at: daysAgo(c.paidDaysAgo ?? 7).toISOString(),
  }));
}

/**
 * Build offers on various listings.
 * Mix: 2 accepted, 3 pending, 2 rejected, 1 withdrawn.
 */
function buildOffers(): Record<string, unknown>[] {
  const configs: Array<{
    listingIdx: number;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    amount: number;
    status: string;
    conditions: string | null;
    aipStatus: string;
    daysAgo: number;
    vendorNotified: boolean;
  }> = [
    // Accepted
    {
      listingIdx: 0,
      buyerName: HOMEBUYER.name,
      buyerEmail: HOMEBUYER.email,
      buyerPhone: "07700900001",
      amount: 540000, // Bristol new build, asking 550k
      status: "accepted",
      conditions: "Subject to survey and mortgage approval",
      aipStatus: "verified",
      daysAgo: 10,
      vendorNotified: true,
    },
    {
      listingIdx: 2,
      buyerName: "George Robinson",
      buyerEmail: "george.robinson@example.co.uk",
      buyerPhone: "07700900012",
      amount: 580000, // Henley cottage, asking 595k (sold)
      status: "accepted",
      conditions: "Chain free, cash buyer",
      aipStatus: "not_provided",
      daysAgo: 60,
      vendorNotified: true,
    },
    // Pending
    {
      listingIdx: 1,
      buyerName: "Charlotte Davies",
      buyerEmail: "charlotte.davies@example.co.uk",
      buyerPhone: "07700900023",
      amount: 700000, // Edinburgh penthouse, asking 725k
      status: "pending",
      conditions: "Subject to sale of current property",
      aipStatus: "provided",
      daysAgo: 3,
      vendorNotified: true,
    },
    {
      listingIdx: 3,
      buyerName: "Thomas Evans",
      buyerEmail: "thomas.evans@example.co.uk",
      buyerPhone: "07700900034",
      amount: 315000, // Whitby bungalow, asking 325k
      status: "pending",
      conditions: "First time buyer, mortgage approved",
      aipStatus: "verified",
      daysAgo: 5,
      vendorNotified: true,
    },
    {
      listingIdx: 4,
      buyerName: "Amelia Wright",
      buyerEmail: "amelia.wright@example.co.uk",
      buyerPhone: "07700900045",
      amount: 375000, // Falmouth cottage, asking 385k
      status: "pending",
      conditions: null,
      aipStatus: "provided",
      daysAgo: 2,
      vendorNotified: false,
    },
    // Rejected
    {
      listingIdx: 1,
      buyerName: "Harry Johnson",
      buyerEmail: "harry.johnson@example.co.uk",
      buyerPhone: "07700900056",
      amount: 640000, // Edinburgh penthouse, asking 725k — too low
      status: "rejected",
      conditions: "Cash buyer but significantly below asking",
      aipStatus: "not_provided",
      daysAgo: 14,
      vendorNotified: true,
    },
    {
      listingIdx: 5,
      buyerName: "Jack Harris",
      buyerEmail: "jack.harris@example.co.uk",
      buyerPhone: "07700900067",
      amount: 410000, // Land plot, asking 450k
      status: "rejected",
      conditions: "Subject to planning review",
      aipStatus: "not_provided",
      daysAgo: 21,
      vendorNotified: true,
    },
    // Withdrawn
    {
      listingIdx: 0,
      buyerName: "Emily Walker",
      buyerEmail: "emily.walker@example.co.uk",
      buyerPhone: "07700900078",
      amount: 530000, // Bristol new build, asking 550k
      status: "withdrawn",
      conditions: "Mortgage fell through",
      aipStatus: "provided",
      daysAgo: 20,
      vendorNotified: true,
    },
  ];

  return configs.map((c, i) => ({
    id: offerId(i + 1),
    agent_id: AGENT.id,
    property_id: AGENT_SALE_LISTING_IDS[c.listingIdx],
    lead_id: null,
    buyer_name: c.buyerName,
    buyer_email: c.buyerEmail,
    buyer_phone: c.buyerPhone,
    amount: c.amount,
    conditions: c.conditions,
    solicitor_details: null,
    aip_status: c.aipStatus,
    status: c.status,
    counter_amount: null,
    vendor_notified: c.vendorNotified,
    created_at: daysAgo(c.daysAgo).toISOString(),
  }));
}

/**
 * Build viewing slots for agent's properties.
 * Mix of past and upcoming viewings.
 */
function buildViewingSlots(): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  // Past viewings (10 slots over last 30 days, all booked)
  for (let i = 0; i < 10; i++) {
    const dayOffset = Math.floor(Math.random() * 28) + 2;
    const hour = 10 + (i % 4) * 2; // 10:00, 12:00, 14:00, 16:00
    const start = daysAgo(dayOffset);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);

    rows.push({
      id: viewingSlotId(i + 1),
      agent_id: AGENT.id,
      property_id: AGENT_SALE_LISTING_IDS[i % AGENT_SALE_LISTING_IDS.length],
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      is_booked: true,
      booked_by: i === 0 ? HOMEBUYER.id : null,
      notes:
        i === 0
          ? "Sarah Mitchell — very keen, pre-approved mortgage"
          : null,
    });
  }

  // Future viewings (5 slots over next 7 days)
  for (let i = 0; i < 5; i++) {
    const dayOffset = i + 1;
    const hour = 11 + (i % 3) * 2;
    const start = new Date();
    start.setDate(start.getDate() + dayOffset);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);

    rows.push({
      id: viewingSlotId(11 + i),
      agent_id: AGENT.id,
      property_id:
        AGENT_SALE_LISTING_IDS[i % AGENT_SALE_LISTING_IDS.length],
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      is_booked: i < 3, // 3 booked, 2 open
      booked_by: null,
      notes: i === 0 ? "Second viewing — likely to offer" : null,
    });
  }

  return rows;
}

/**
 * Build viewing feedback for past viewings.
 * Links to viewing slots where possible.
 */
function buildViewingFeedback(): Record<string, unknown>[] {
  const feedbackConfigs: Array<{
    slotIdx: number;
    buyerName: string;
    interestLevel: number;
    priceOpinion: string;
    likelihoodToOffer: string;
    comments: string;
  }> = [
    {
      slotIdx: 0,
      buyerName: HOMEBUYER.name,
      interestLevel: 5,
      priceOpinion: "about_right",
      likelihoodToOffer: "very_likely",
      comments:
        "Loved the property. Layout is perfect for the family. Garden is a real bonus. Wants to arrange a second viewing with partner.",
    },
    {
      slotIdx: 1,
      buyerName: "Charlotte Davies",
      interestLevel: 4,
      priceOpinion: "about_right",
      likelihoodToOffer: "likely",
      comments:
        "Very impressed with the penthouse views. Minor concern about service charges but otherwise very positive.",
    },
    {
      slotIdx: 2,
      buyerName: "Thomas Evans",
      interestLevel: 4,
      priceOpinion: "good_value",
      likelihoodToOffer: "likely",
      comments:
        "Bungalow is exactly what they were looking for. Sea views exceeded expectations. Will discuss with mortgage advisor.",
    },
    {
      slotIdx: 3,
      buyerName: "Oliver Phillips",
      interestLevel: 3,
      priceOpinion: "too_high",
      likelihoodToOffer: "possible",
      comments:
        "Liked the cottage character but felt the price was above market for the area. May come back with a lower offer.",
    },
    {
      slotIdx: 4,
      buyerName: "Isla Turner",
      interestLevel: 2,
      priceOpinion: "too_high",
      likelihoodToOffer: "unlikely",
      comments:
        "Nice property but too far from the station. Commute would be difficult. Will keep looking closer to town.",
    },
    {
      slotIdx: 5,
      buyerName: "George Robinson",
      interestLevel: 5,
      priceOpinion: "good_value",
      likelihoodToOffer: "very_likely",
      comments:
        "Cash buyer, absolutely loved it. Ready to proceed immediately. Solicitor already instructed.",
    },
    {
      slotIdx: 6,
      buyerName: "Emily Walker",
      interestLevel: 3,
      priceOpinion: "about_right",
      likelihoodToOffer: "possible",
      comments:
        "Good first impression. Wants to see comparable properties before deciding. Will book second viewing if shortlisted.",
    },
    {
      slotIdx: 7,
      buyerName: "Jack Harris",
      interestLevel: 1,
      priceOpinion: "too_high",
      likelihoodToOffer: "unlikely",
      comments:
        "Not suitable for their needs. Looking for something with more land. Unlikely to proceed.",
    },
    {
      slotIdx: 8,
      buyerName: "Sophia Green",
      interestLevel: 4,
      priceOpinion: "about_right",
      likelihoodToOffer: "likely",
      comments:
        "Really liked the modern kitchen and garden. Needs to check school catchment areas. Positive overall.",
    },
    {
      slotIdx: 9,
      buyerName: "Harry Johnson",
      interestLevel: 2,
      priceOpinion: "too_high",
      likelihoodToOffer: "unlikely",
      comments:
        "Property is nice but budget is stretched. Would need a significant price reduction to proceed.",
    },
  ];

  return feedbackConfigs.map((c, i) => ({
    id: feedbackId(i + 1),
    agent_id: AGENT.id,
    viewing_slot_id: viewingSlotId(c.slotIdx + 1),
    buyer_name: c.buyerName,
    interest_level: c.interestLevel,
    price_opinion: c.priceOpinion,
    likelihood_to_offer: c.likelihoodToOffer,
    comments: c.comments,
    created_at: daysAgo(Math.floor(Math.random() * 28) + 2).toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Main Seed Function
// ---------------------------------------------------------------------------

export type SeedAgentResult = {
  agencyProfileSeeded: number;
  leadsSeeded: number;
  commissionsSeeded: number;
  offersSeeded: number;
  viewingSlotsSeeded: number;
  viewingFeedbackSeeded: number;
};

export async function seedAgent(
  supabase: SupabaseClient,
  scenario: Scenario,
): Promise<SeedAgentResult> {
  console.log(`\n--- Seeding Agent Dashboard (scenario: ${scenario}) ---\n`);

  // 1. Agency profile
  const profileRows = [buildAgencyProfile()];
  const profileResult = await seedTable(
    supabase,
    "agent_agency_profiles",
    profileRows,
  );

  // 2. Leads (28 in happy-path, 44 in growth-mode due to tripled new_enquiry)
  const leadRows = buildLeads(scenario);
  const leadResult = await seedTable(supabase, "agent_leads", leadRows);

  // 3. Commissions (5 total)
  const commissionRows = buildCommissions();
  const commissionResult = await seedTable(
    supabase,
    "agent_commissions",
    commissionRows,
  );

  // 4. Offers (8 total)
  const offerRows = buildOffers();
  const offerResult = await seedTable(supabase, "agent_offers", offerRows);

  // 5. Viewing slots (15 total: 10 past + 5 future)
  const viewingSlotRows = buildViewingSlots();
  const viewingSlotResult = await seedTable(
    supabase,
    "agent_viewing_slots",
    viewingSlotRows,
  );

  // 6. Viewing feedback (10 total)
  const feedbackRows = buildViewingFeedback();
  const feedbackResult = await seedTable(
    supabase,
    "agent_viewing_feedback",
    feedbackRows,
  );

  const result: SeedAgentResult = {
    agencyProfileSeeded: profileResult.success ? profileResult.count : 0,
    leadsSeeded: leadResult.success ? leadResult.count : 0,
    commissionsSeeded: commissionResult.success ? commissionResult.count : 0,
    offersSeeded: offerResult.success ? offerResult.count : 0,
    viewingSlotsSeeded: viewingSlotResult.success
      ? viewingSlotResult.count
      : 0,
    viewingFeedbackSeeded: feedbackResult.success
      ? feedbackResult.count
      : 0,
  };

  console.log("\n--- Agent Dashboard Summary ---");
  console.log(`  Agency profile seeded:    ${result.agencyProfileSeeded}`);
  console.log(`  Leads seeded:             ${result.leadsSeeded}`);
  console.log(`  Commissions seeded:       ${result.commissionsSeeded}`);
  console.log(`  Offers seeded:            ${result.offersSeeded}`);
  console.log(`  Viewing slots seeded:     ${result.viewingSlotsSeeded}`);
  console.log(`  Viewing feedback seeded:  ${result.viewingFeedbackSeeded}`);

  return result;
}
