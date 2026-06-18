// Local fixtures for M3 seller-area component tests.
// Built from the prop TYPES in src/types/seller.ts.

import type {
  SellerListing,
  SellerOffer,
  SellerViewing,
  AgentProfile,
  LandRegistryComparable,
} from "@/types/seller";

export function makeListing(overrides: Partial<SellerListing> = {}): SellerListing {
  return {
    id: "listing-1",
    seller_id: "seller-1",
    postcode: "SW1A 1AA",
    address_line_1: "14 Elm Road",
    address_line_2: null,
    city: "London",
    property_type: "terraced",
    tenure: "freehold",
    leasehold_years_remaining: null,
    bedrooms: 3,
    bathrooms: 2,
    features: ["Garden", "Parking"],
    council_tax_band: "D",
    epc_band: "C",
    photos: [{ url: "https://example.com/p1.jpg", order: 0 }],
    floor_plan_url: null,
    description:
      "A bright and spacious three-bedroom terraced home with a south-facing garden and off-street parking.",
    description_tone: "professional",
    key_selling_points: ["South-facing garden"],
    asking_price: 35000000, // pence -> £350,000
    listing_type: "for_sale",
    price_qualifier: null,
    ai_valuation_estimate: null,
    epc_url: "https://example.com/epc.pdf",
    status: "draft",
    published_at: null,
    created_at: "2026-06-01T10:00:00.000Z",
    updated_at: "2026-06-01T10:00:00.000Z",
    ...overrides,
  };
}

type OfferOverrides = Partial<SellerOffer> & {
  listing?: SellerOffer["listing"];
};

export function makeOffer(overrides: OfferOverrides = {}): SellerOffer {
  return {
    id: "offer-1",
    listing_id: "listing-1",
    seller_id: "seller-1",
    buyer_name: "Alice Buyer",
    buyer_email: "alice@example.com",
    amount: 35000000, // £350,000 — at asking
    buyer_type: "cash",
    chain_status: "chain_free",
    chain_length: null,
    is_verified: true,
    conditions: null,
    solicitor_name: null,
    solicitor_email: null,
    solicitor_phone: null,
    status: "pending",
    counter_amount: null,
    counter_message: null,
    offered_at: "2026-06-10T14:30:00.000Z",
    responded_at: null,
    created_at: "2026-06-10T14:30:00.000Z",
    updated_at: "2026-06-10T14:30:00.000Z",
    listing: {
      id: "listing-1",
      address_line_1: "14 Elm Road",
      city: "London",
      postcode: "SW1A 1AA",
      asking_price: 35000000,
      photos: [{ url: "https://example.com/p1.jpg", order: 0 }],
    },
    ...overrides,
  };
}

export function makeViewing(overrides: Partial<SellerViewing> = {}): SellerViewing {
  return {
    id: "viewing-1",
    listing_id: "listing-1",
    seller_id: "seller-1",
    buyer_name: "Bob Viewer",
    buyer_email: "bob@example.com",
    viewing_datetime: "2026-06-20T15:00:00.000Z",
    viewing_type: "in_person",
    status: "pending",
    feedback: null,
    notes: null,
    created_at: "2026-06-12T09:00:00.000Z",
    updated_at: "2026-06-12T09:00:00.000Z",
    listing: {
      id: "listing-1",
      address_line_1: "14 Elm Road",
      city: "London",
      postcode: "SW1A 1AA",
      photos: [{ url: "https://example.com/p1.jpg", order: 0 }],
    },
    ...overrides,
  };
}

export function makeAgent(overrides: Partial<AgentProfile> = {}): AgentProfile {
  return {
    id: "agent-1",
    full_name: "Carol Agent",
    agency_name: "Prime Estates",
    avatar_url: null,
    areas_covered: ["Kensington", "Chelsea", "Fulham", "Battersea", "Wandsworth"],
    fee_percentage: 1.25,
    average_rating: 4.7,
    review_count: 42,
    sold_count: 38,
    average_days_to_sell: 28,
    bio: "Experienced central London agent.",
    ...overrides,
  };
}

export function makeComparable(
  overrides: Partial<LandRegistryComparable> = {},
): LandRegistryComparable {
  return {
    address: "12 Elm Road",
    postcode: "SW1A 1AA",
    price: 34000000,
    sale_date: "2026-01-15",
    property_type: "Terraced",
    tenure: "Freehold",
    distance_metres: 120,
    ...overrides,
  };
}
