/**
 * Local fixtures for the M3 agent listings/offers/sales test area.
 *
 * The agent listing components (ActiveListings / ArchivedDraftListings /
 * SoldLetListings) accept `Record<string, unknown>[]` with denormalised field
 * names (`price`, `views`, `created_at`, `primary_image_url`, ...) rather than
 * the typed `Listing` row in `src/__tests__/fixtures/listings.ts`. These
 * fixtures mirror the exact shape those components read.
 */

import type {
  AgentOffer,
  AgentOfferHistory,
  AgentSaleProgressionWithRisk,
  AgentVendorReport,
  SaleStage,
} from "@/types/agent";

// ---------------------------------------------------------------------------
// Active / sold listings (denormalised record shape)
// ---------------------------------------------------------------------------

export type AgentListingRecord = Record<string, unknown>;

export function makeListing(
  overrides: AgentListingRecord = {},
): AgentListingRecord {
  return {
    id: "listing-1",
    title: "1 Mock Street",
    price: 300000,
    status: "active",
    primary_image_url: "https://example.com/1.webp",
    views: 100,
    saves: 10,
    enquiries: 5,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-10T00:00:00Z",
    ...overrides,
  };
}

/** Three active listings with distinct price / views / created_at for sort tests. */
export const ACTIVE_LISTINGS: AgentListingRecord[] = [
  makeListing({
    id: "a",
    title: "A — cheap, few views, oldest",
    price: 100000,
    views: 5,
    created_at: "2026-01-01T00:00:00Z",
  }),
  makeListing({
    id: "b",
    title: "B — mid price, most views, newest",
    price: 250000,
    views: 90,
    created_at: "2026-03-01T00:00:00Z",
  }),
  makeListing({
    id: "c",
    title: "C — expensive, mid views, middle date",
    price: 500000,
    views: 40,
    created_at: "2026-02-01T00:00:00Z",
  }),
];

/** Mixed archived + draft listings for the tab tests. */
export const ARCHIVED_DRAFT_LISTINGS: AgentListingRecord[] = [
  makeListing({ id: "arch-1", title: "Archived one", status: "archived" }),
  makeListing({ id: "arch-2", title: "Archived two", status: "archived" }),
  makeListing({ id: "draft-1", title: "Draft one", status: "draft" }),
];

/** Sold + let listings. */
export const SOLD_LET_LISTINGS: AgentListingRecord[] = [
  makeListing({
    id: "sold-1",
    title: "Sold house",
    status: "sold",
    price: 425000,
    commission_amount: 6375,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-31T00:00:00Z",
    completion_date: "2026-01-31T00:00:00Z",
  }),
  makeListing({
    id: "let-1",
    title: "Let flat",
    status: "let",
    price: 1500,
    commission_amount: 0,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-15T00:00:00Z",
  }),
];

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

export function makeOffer(overrides: Partial<AgentOffer> = {}): AgentOffer {
  return {
    id: "offer-1",
    agent_id: "agent-1",
    property_id: "11111111-2222-3333-4444-555555555555",
    lead_id: null,
    buyer_name: "Alice Buyer",
    buyer_email: "alice@example.com",
    buyer_phone: null,
    amount: 300000,
    conditions: null,
    solicitor_details: null,
    aip_status: "provided",
    status: "pending",
    counter_amount: null,
    vendor_notified: false,
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
    ...overrides,
  };
}

/** Two properties; property A has 2 offers, property B has 1. */
export const GROUPED_OFFERS: Record<string, AgentOffer[]> = {
  "aaaaaaaa-0000-0000-0000-000000000000": [
    makeOffer({ id: "o1", buyer_name: "Alice Buyer", status: "pending" }),
    makeOffer({ id: "o2", buyer_name: "Bob Bidder", status: "accepted" }),
  ],
  "bbbbbbbb-0000-0000-0000-000000000000": [
    makeOffer({
      id: "o3",
      property_id: "bbbbbbbb-0000-0000-0000-000000000000",
      buyer_name: "Carol Client",
      status: "rejected",
    }),
  ],
};

export function makeHistory(
  overrides: Partial<AgentOfferHistory> = {},
): AgentOfferHistory {
  return {
    id: "hist-1",
    offer_id: "offer-1",
    previous_status: "pending",
    new_status: "countered",
    actor_id: "agent-1-uuid-aaaa",
    note: "Vendor wants more",
    created_at: "2026-03-02T09:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Sale progression (Kanban)
// ---------------------------------------------------------------------------

export function makeProgression(
  overrides: Partial<AgentSaleProgressionWithRisk> = {},
): AgentSaleProgressionWithRisk {
  return {
    id: "prog-1",
    agent_id: "agent-1",
    offer_id: "offer-1",
    property_id: "cccccccc-0000-0000-0000-000000000000",
    stage: "offer_accepted",
    expected_completion_date: null,
    solicitor_buyer: null,
    solicitor_seller: null,
    notes: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    chain_risk: null,
    ...overrides,
  };
}

export const PROGRESSIONS_BY_STAGE: Partial<
  Record<SaleStage, AgentSaleProgressionWithRisk[]>
> = {
  offer_accepted: [
    makeProgression({ id: "p1", stage: "offer_accepted" }),
    makeProgression({ id: "p2", stage: "offer_accepted" }),
  ],
  searches: [makeProgression({ id: "p3", stage: "searches" })],
};

// ---------------------------------------------------------------------------
// Vendor reports
// ---------------------------------------------------------------------------

export type VendorListing = Readonly<{
  id: string;
  address_line_1: string;
  city: string | null;
}>;

export const VENDOR_LISTINGS: VendorListing[] = [
  { id: "vl-1", address_line_1: "12 Report Road", city: "Leeds" },
  { id: "vl-2", address_line_1: "9 Vendor Way", city: null },
];

export function makeVendorReport(
  overrides: Partial<AgentVendorReport> = {},
): AgentVendorReport {
  return {
    id: "rep-1",
    agent_id: "agent-1",
    property_id: "vl-1",
    report_type: "listing_performance",
    data: null,
    generated_at: "2026-03-05T12:00:00Z",
    pdf_url: null,
    ...overrides,
  };
}
