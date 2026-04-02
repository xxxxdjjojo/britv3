/**
 * Seed Demo — Provider Dashboard Data
 *
 * Seeds service provider details, service requests, bookings,
 * provider invoices, and provider documents for Mike Johnson's
 * plumbing & heating business.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_USERS, type Scenario } from "./config";
import { daysAgo, hoursAgo, seedTable } from "./utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER = DEMO_USERS.PROVIDER;
const LANDLORD = DEMO_USERS.LANDLORD;
const HOMEBUYER = DEMO_USERS.HOMEBUYER;
const SELLER = DEMO_USERS.SELLER;
const RENTER = DEMO_USERS.RENTER;

// ---------------------------------------------------------------------------
// Hardcoded UUIDs (g6000000 prefix pattern)
// ---------------------------------------------------------------------------

// Service requests (8 total)
const SERVICE_REQUEST_IDS = [
  "g6000000-0101-4000-8000-000000000001",
  "g6000000-0102-4000-8000-000000000002",
  "g6000000-0103-4000-8000-000000000003",
  "g6000000-0104-4000-8000-000000000004",
  "g6000000-0105-4000-8000-000000000005",
  "g6000000-0106-4000-8000-000000000006",
  "g6000000-0107-4000-8000-000000000007",
  "g6000000-0108-4000-8000-000000000008",
] as const;

// Quotes (link service requests to provider)
const QUOTE_IDS = [
  "g6000000-0201-4000-8000-000000000001",
  "g6000000-0202-4000-8000-000000000002",
  "g6000000-0203-4000-8000-000000000003",
  "g6000000-0204-4000-8000-000000000004",
  "g6000000-0205-4000-8000-000000000005",
  "g6000000-0206-4000-8000-000000000006",
  "g6000000-0207-4000-8000-000000000007",
  "g6000000-0208-4000-8000-000000000008",
] as const;

// Bookings (12 total)
const BOOKING_IDS = [
  "g6000000-0301-4000-8000-000000000001",
  "g6000000-0302-4000-8000-000000000002",
  "g6000000-0303-4000-8000-000000000003",
  "g6000000-0304-4000-8000-000000000004",
  "g6000000-0305-4000-8000-000000000005",
  "g6000000-0306-4000-8000-000000000006",
  "g6000000-0307-4000-8000-000000000007",
  "g6000000-0308-4000-8000-000000000008",
  "g6000000-0309-4000-8000-000000000009",
  "g6000000-0310-4000-8000-000000000010",
  "g6000000-0311-4000-8000-000000000011",
  "g6000000-0312-4000-8000-000000000012",
] as const;

// Invoices (10 total)
const INVOICE_IDS = [
  "g6000000-0401-4000-8000-000000000001",
  "g6000000-0402-4000-8000-000000000002",
  "g6000000-0403-4000-8000-000000000003",
  "g6000000-0404-4000-8000-000000000004",
  "g6000000-0405-4000-8000-000000000005",
  "g6000000-0406-4000-8000-000000000006",
  "g6000000-0407-4000-8000-000000000007",
  "g6000000-0408-4000-8000-000000000008",
  "g6000000-0409-4000-8000-000000000009",
  "g6000000-0410-4000-8000-000000000010",
] as const;

// Provider documents (4 total)
const DOCUMENT_IDS = [
  "g6000000-0501-4000-8000-000000000001",
  "g6000000-0502-4000-8000-000000000002",
  "g6000000-0503-4000-8000-000000000003",
  "g6000000-0504-4000-8000-000000000004",
] as const;

// ---------------------------------------------------------------------------
// Row Builders
// ---------------------------------------------------------------------------

function buildServiceProviderDetails(): Record<string, unknown> {
  return {
    user_id: PROVIDER.id,
    business_name: "Johnson Plumbing & Heating",
    business_description:
      "Reliable, Gas Safe registered plumber and heating engineer serving South London and Surrey. Over 15 years of experience in domestic and commercial plumbing, boiler installations, bathroom fitting, and emergency repairs. All work fully insured and guaranteed.",
    trading_name: "Johnson Plumbing & Heating",
    company_number: null,
    vat_number: null,
    services: ["plumber"],
    service_postcodes: ["SW11", "SW12", "SW15", "SW16", "SW17", "SW18", "SW19", "CR0", "SM1", "KT1"],
    service_radius: 15,
    pricing: JSON.stringify({
      call_out: 75,
      hourly_rate: 65,
      emergency_surcharge: 50,
    }),
    qualifications: [
      "Gas Safe Registered (Reg: 543210)",
      "City & Guilds Level 3 Plumbing & Heating",
      "Unvented Hot Water Systems Qualified",
      "WRAS Approved Installer",
    ],
    accreditations: ["Gas Safe Register", "Checkatrade Approved", "Which? Trusted Trader"],
    insurance_details: JSON.stringify({
      provider: "Hiscox",
      policy_number: "PLB-2025-987654",
      public_liability: 2000000,
      expiry: "2027-03-15",
    }),
    portfolio_urls: [],
    slug: "johnson-plumbing-heating",
    website_url: "https://www.johnsonplumbing.example.co.uk",
    years_in_business: 15,
    completed_jobs_count: 0, // Will be updated by trigger as bookings complete
    response_time_hours: 2.5,
  };
}

function buildServiceRequests(): Record<string, unknown>[] {
  // Mix of clients requesting plumbing services
  return [
    // 1. Robert Williams (landlord) - Leaking kitchen tap (awarded -> booked)
    {
      id: SERVICE_REQUEST_IDS[0],
      user_id: LANDLORD.id,
      service_category: "plumber",
      title: "Leaking kitchen tap - rental property",
      description:
        "Kitchen mixer tap dripping constantly at our rental flat in Battersea. Tenant reports water pooling around the base. Need a plumber to replace or repair the tap.",
      property_address: "Flat 12, Crescent House, 45 Park Road",
      property_postcode: "W2 4RH",
      preferred_start_date: daysAgo(25).toISOString().split("T")[0],
      urgency_level: "normal",
      budget_min: 80,
      budget_max: 200,
      status: "awarded",
      created_at: daysAgo(28).toISOString(),
    },
    // 2. Robert Williams (landlord) - Boiler service (awarded -> booked)
    {
      id: SERVICE_REQUEST_IDS[1],
      user_id: LANDLORD.id,
      service_category: "plumber",
      title: "Annual boiler service - 3 properties",
      description:
        "Need annual gas safety check and boiler service for 3 rental properties in South London. All are combi boilers (2x Worcester, 1x Vaillant).",
      property_address: "Multiple properties",
      property_postcode: "SW11 3NP",
      preferred_start_date: daysAgo(40).toISOString().split("T")[0],
      urgency_level: "low",
      budget_min: 200,
      budget_max: 350,
      status: "awarded",
      created_at: daysAgo(45).toISOString(),
    },
    // 3. Sarah Mitchell (homebuyer) - Bathroom refit (awarded -> booked)
    {
      id: SERVICE_REQUEST_IDS[2],
      user_id: HOMEBUYER.id,
      service_category: "plumber",
      title: "Complete bathroom refit",
      description:
        "Looking for a plumber to do a full bathroom refit in our Victorian terrace. Need to move soil pipe, install walk-in shower, new basin, and heated towel rail.",
      property_address: "14 Rosemary Lane",
      property_postcode: "SW11 3NP",
      preferred_start_date: daysAgo(10).toISOString().split("T")[0],
      urgency_level: "normal",
      budget_min: 3000,
      budget_max: 5000,
      status: "awarded",
      created_at: daysAgo(20).toISOString(),
    },
    // 4. Robert Williams (landlord) - Emergency burst pipe (awarded -> booked)
    {
      id: SERVICE_REQUEST_IDS[3],
      user_id: LANDLORD.id,
      service_category: "plumber",
      title: "Emergency burst pipe repair",
      description:
        "Pipe burst under bathroom sink in rental property. Tenant has turned off stopcock. Need urgent repair to minimise water damage.",
      property_address: "Flat 12, Crescent House, 45 Park Road",
      property_postcode: "W2 4RH",
      preferred_start_date: daysAgo(60).toISOString().split("T")[0],
      urgency_level: "emergency",
      budget_min: 150,
      budget_max: 400,
      status: "awarded",
      created_at: daysAgo(60).toISOString(),
    },
    // 5. Open RFQ - power flush (still open, quotes received)
    {
      id: SERVICE_REQUEST_IDS[4],
      user_id: HOMEBUYER.id,
      service_category: "plumber",
      title: "Powerflush central heating system",
      description:
        "Central heating not warming up evenly. Some radiators cold at bottom. Need a powerflush on a 10-radiator system in a 3-bed terraced house.",
      property_address: "22 Elm Street",
      property_postcode: "SW12 8QN",
      preferred_start_date: daysAgo(-5).toISOString().split("T")[0],
      urgency_level: "normal",
      budget_min: 300,
      budget_max: 600,
      status: "quotes_received",
      quote_count: 2,
      created_at: daysAgo(5).toISOString(),
    },
    // 6. Open RFQ - outside tap installation
    {
      id: SERVICE_REQUEST_IDS[5],
      user_id: SELLER.id,
      service_category: "plumber",
      title: "Outside tap installation",
      description:
        "Want an outside tap fitted to the rear of the property for garden watering. House has accessible pipework in the kitchen.",
      property_address: "8 Oakfield Drive",
      property_postcode: "M20 6WJ",
      preferred_start_date: daysAgo(-14).toISOString().split("T")[0],
      urgency_level: "low",
      budget_min: 80,
      budget_max: 150,
      status: "open",
      created_at: daysAgo(3).toISOString(),
    },
    // 7. Cancelled RFQ
    {
      id: SERVICE_REQUEST_IDS[6],
      user_id: RENTER.id,
      service_category: "plumber",
      title: "Toilet cistern repair",
      description:
        "Toilet cistern keeps running after flushing. Landlord has agreed to cover the cost. Need someone ASAP.",
      property_address: "28 Victoria Terrace",
      property_postcode: "LS3 1BQ",
      preferred_start_date: daysAgo(15).toISOString().split("T")[0],
      urgency_level: "high",
      budget_min: 60,
      budget_max: 150,
      status: "cancelled",
      created_at: daysAgo(20).toISOString(),
    },
    // 8. Expired RFQ
    {
      id: SERVICE_REQUEST_IDS[7],
      user_id: LANDLORD.id,
      service_category: "plumber",
      title: "Radiator replacement - 2 units",
      description:
        "Need two old single-panel radiators replaced with modern double-panel convectors. One in the living room, one in bedroom 2.",
      property_address: "5 Meadow Close",
      property_postcode: "B15 2TT",
      preferred_start_date: daysAgo(50).toISOString().split("T")[0],
      urgency_level: "low",
      budget_min: 200,
      budget_max: 500,
      status: "expired",
      created_at: daysAgo(65).toISOString(),
    },
  ];
}

function buildQuotes(): Record<string, unknown>[] {
  // Quotes from Mike Johnson for service requests he was awarded
  return [
    {
      id: QUOTE_IDS[0],
      service_request_id: SERVICE_REQUEST_IDS[0],
      provider_id: PROVIDER.id,
      total_amount: 145.00,
      vat_included: false,
      line_items: JSON.stringify([
        { description: "Replace kitchen mixer tap", qty: 1, unit_price: 85 },
        { description: "New Bristan tap (supply)", qty: 1, unit_price: 45 },
        { description: "Materials & sundries", qty: 1, unit_price: 15 },
      ]),
      scope_of_work: "Remove existing mixer tap, install new Bristan chrome mixer tap, test for leaks, clean up.",
      estimated_duration: "1-2 hours",
      payment_terms: "Payment on completion",
      warranty_info: "12 months on labour, manufacturer warranty on tap",
      status: "accepted",
      created_at: daysAgo(26).toISOString(),
    },
    {
      id: QUOTE_IDS[1],
      service_request_id: SERVICE_REQUEST_IDS[1],
      provider_id: PROVIDER.id,
      total_amount: 285.00,
      vat_included: false,
      line_items: JSON.stringify([
        { description: "Boiler service & gas safety check (per property)", qty: 3, unit_price: 85 },
        { description: "CP12 certificate issuance (per property)", qty: 3, unit_price: 10 },
      ]),
      scope_of_work: "Full annual boiler service including flue gas analysis, gas safety inspection, and CP12 certificate for each of 3 properties.",
      estimated_duration: "1 day (3 properties)",
      payment_terms: "Payment on completion of all 3 services",
      warranty_info: "Gas Safe registered work with certification",
      status: "accepted",
      created_at: daysAgo(43).toISOString(),
    },
    {
      id: QUOTE_IDS[2],
      service_request_id: SERVICE_REQUEST_IDS[2],
      provider_id: PROVIDER.id,
      total_amount: 4200.00,
      vat_included: false,
      line_items: JSON.stringify([
        { description: "Strip out existing bathroom", qty: 1, unit_price: 400 },
        { description: "First fix plumbing (move soil pipe)", qty: 1, unit_price: 650 },
        { description: "Second fix plumbing (shower, basin, towel rail)", qty: 1, unit_price: 800 },
        { description: "Walk-in shower enclosure & tray (supply)", qty: 1, unit_price: 850 },
        { description: "Basin & vanity unit (supply)", qty: 1, unit_price: 320 },
        { description: "Heated towel rail (supply & fit)", qty: 1, unit_price: 280 },
        { description: "Tiling (walls & floor)", qty: 1, unit_price: 600 },
        { description: "Materials, adhesives, sundries", qty: 1, unit_price: 300 },
      ]),
      scope_of_work: "Complete bathroom strip-out and refit including moving soil pipe, installing walk-in shower, new basin, heated towel rail, and full tiling.",
      estimated_duration: "5-7 working days",
      payment_terms: "50% deposit, 50% on completion",
      warranty_info: "2 years on all labour, manufacturer warranties on products",
      status: "accepted",
      created_at: daysAgo(18).toISOString(),
    },
    {
      id: QUOTE_IDS[3],
      service_request_id: SERVICE_REQUEST_IDS[3],
      provider_id: PROVIDER.id,
      total_amount: 220.00,
      vat_included: false,
      line_items: JSON.stringify([
        { description: "Emergency call-out", qty: 1, unit_price: 125 },
        { description: "Pipe repair (15mm copper)", qty: 1, unit_price: 65 },
        { description: "Materials", qty: 1, unit_price: 30 },
      ]),
      scope_of_work: "Emergency repair of burst 15mm copper pipe under bathroom sink. Isolate, cut out damaged section, solder new section, test and restore water supply.",
      estimated_duration: "1-2 hours",
      payment_terms: "Payment on completion",
      warranty_info: "12 months on repair work",
      status: "accepted",
      created_at: daysAgo(60).toISOString(),
    },
    // Quote sent for open RFQ (powerflush)
    {
      id: QUOTE_IDS[4],
      service_request_id: SERVICE_REQUEST_IDS[4],
      provider_id: PROVIDER.id,
      total_amount: 450.00,
      vat_included: false,
      line_items: JSON.stringify([
        { description: "Powerflush 10-radiator system", qty: 1, unit_price: 380 },
        { description: "MagnaClean filter installation", qty: 1, unit_price: 70 },
      ]),
      scope_of_work: "Full powerflush of central heating system (10 radiators), including system inhibitor and MagnaClean inline filter installation.",
      estimated_duration: "4-6 hours",
      payment_terms: "Payment on completion",
      warranty_info: "12 months on flush, 2 years on filter",
      status: "sent",
      created_at: daysAgo(4).toISOString(),
    },
  ];
}

function buildBookings(scenario: Scenario): Record<string, unknown>[] {
  const now = new Date();

  const rows: Record<string, unknown>[] = [
    // --- Completed bookings (7) ---
    // 1. Tap repair for landlord (completed)
    {
      id: BOOKING_IDS[0],
      service_request_id: SERVICE_REQUEST_IDS[0],
      quote_id: QUOTE_IDS[0],
      user_id: LANDLORD.id,
      provider_id: PROVIDER.id,
      scheduled_start_date: daysAgo(24).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(24).toISOString().split("T")[0],
      actual_start_date: daysAgo(24).toISOString().split("T")[0],
      actual_end_date: daysAgo(24).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(26).toISOString(),
    },
    // 2. Boiler services for landlord (completed)
    {
      id: BOOKING_IDS[1],
      service_request_id: SERVICE_REQUEST_IDS[1],
      quote_id: QUOTE_IDS[1],
      user_id: LANDLORD.id,
      provider_id: PROVIDER.id,
      scheduled_start_date: daysAgo(38).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(38).toISOString().split("T")[0],
      actual_start_date: daysAgo(38).toISOString().split("T")[0],
      actual_end_date: daysAgo(38).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(42).toISOString(),
    },
    // 3. Emergency burst pipe for landlord (completed)
    {
      id: BOOKING_IDS[2],
      service_request_id: SERVICE_REQUEST_IDS[3],
      quote_id: QUOTE_IDS[3],
      user_id: LANDLORD.id,
      provider_id: PROVIDER.id,
      scheduled_start_date: daysAgo(60).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(60).toISOString().split("T")[0],
      actual_start_date: daysAgo(60).toISOString().split("T")[0],
      actual_end_date: daysAgo(60).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(60).toISOString(),
    },
    // 4. Completed job - boiler repair (homebuyer, no RFQ, direct booking)
    {
      id: BOOKING_IDS[3],
      service_request_id: null,
      quote_id: null,
      user_id: HOMEBUYER.id,
      provider_id: PROVIDER.id,
      scheduled_start_date: daysAgo(50).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(50).toISOString().split("T")[0],
      actual_start_date: daysAgo(50).toISOString().split("T")[0],
      actual_end_date: daysAgo(50).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(52).toISOString(),
    },
    // 5. Completed job - radiator bleed & balance (landlord)
    {
      id: BOOKING_IDS[4],
      service_request_id: null,
      quote_id: null,
      user_id: LANDLORD.id,
      provider_id: PROVIDER.id,
      scheduled_start_date: daysAgo(75).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(75).toISOString().split("T")[0],
      actual_start_date: daysAgo(75).toISOString().split("T")[0],
      actual_end_date: daysAgo(75).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(78).toISOString(),
    },
    // 6. Completed job - unblock drain (seller)
    {
      id: BOOKING_IDS[5],
      service_request_id: null,
      quote_id: null,
      user_id: SELLER.id,
      provider_id: PROVIDER.id,
      scheduled_start_date: daysAgo(90).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(90).toISOString().split("T")[0],
      actual_start_date: daysAgo(90).toISOString().split("T")[0],
      actual_end_date: daysAgo(90).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(92).toISOString(),
    },
    // 7. Completed job - stopcock replacement (landlord)
    {
      id: BOOKING_IDS[6],
      service_request_id: null,
      quote_id: null,
      user_id: LANDLORD.id,
      provider_id: PROVIDER.id,
      scheduled_start_date: daysAgo(110).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(110).toISOString().split("T")[0],
      actual_start_date: daysAgo(110).toISOString().split("T")[0],
      actual_end_date: daysAgo(110).toISOString().split("T")[0],
      status: "completed",
      created_at: daysAgo(112).toISOString(),
    },

    // --- Active bookings ---
    // 8. Bathroom refit for homebuyer (in_progress)
    {
      id: BOOKING_IDS[7],
      service_request_id: SERVICE_REQUEST_IDS[2],
      quote_id: QUOTE_IDS[2],
      user_id: HOMEBUYER.id,
      provider_id: PROVIDER.id,
      scheduled_start_date: daysAgo(3).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(-4).toISOString().split("T")[0],
      actual_start_date: daysAgo(3).toISOString().split("T")[0],
      actual_end_date: null,
      status: "in_progress",
      created_at: daysAgo(15).toISOString(),
    },

    // --- Upcoming bookings (confirmed) ---
    // 9. Boiler installation (landlord)
    {
      id: BOOKING_IDS[8],
      service_request_id: null,
      quote_id: null,
      user_id: LANDLORD.id,
      provider_id: PROVIDER.id,
      scheduled_start_date: daysAgo(-7).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(-8).toISOString().split("T")[0],
      status: "confirmed",
      created_at: daysAgo(5).toISOString(),
    },
    // 10. Shower valve replacement (homebuyer)
    {
      id: BOOKING_IDS[9],
      service_request_id: null,
      quote_id: null,
      user_id: HOMEBUYER.id,
      provider_id: PROVIDER.id,
      scheduled_start_date: daysAgo(-10).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(-10).toISOString().split("T")[0],
      status: "confirmed",
      created_at: daysAgo(3).toISOString(),
    },
    // 11. Pending confirmation - toilet replacement (seller)
    {
      id: BOOKING_IDS[10],
      service_request_id: null,
      quote_id: null,
      user_id: SELLER.id,
      provider_id: PROVIDER.id,
      scheduled_start_date: daysAgo(-14).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(-14).toISOString().split("T")[0],
      status: "pending_confirmation",
      created_at: daysAgo(2).toISOString(),
    },
    // 12. Cancelled booking (renter)
    {
      id: BOOKING_IDS[11],
      service_request_id: null,
      quote_id: null,
      user_id: RENTER.id,
      provider_id: PROVIDER.id,
      scheduled_start_date: daysAgo(5).toISOString().split("T")[0],
      scheduled_end_date: daysAgo(5).toISOString().split("T")[0],
      status: "cancelled",
      cancellation_reason: "Tenant resolved the issue themselves",
      cancelled_by: RENTER.id,
      created_at: daysAgo(10).toISOString(),
    },
  ];

  // Scenario adjustments
  if (scenario === "growth-mode") {
    // Fully booked: convert pending_confirmation to confirmed
    const pendingBooking = rows.find((r) => r.id === BOOKING_IDS[10]);
    if (pendingBooking) {
      pendingBooking.status = "confirmed";
    }
  }

  if (scenario === "fire-drill") {
    // One booking has a no-show: mark the cancelled booking as disputed instead
    const cancelledBooking = rows.find((r) => r.id === BOOKING_IDS[11]);
    if (cancelledBooking) {
      cancelledBooking.status = "disputed";
      cancelledBooking.cancellation_reason = "Provider did not show up for scheduled appointment";
      cancelledBooking.cancelled_by = RENTER.id;
      // Need actual dates for a disputed booking that was supposedly completed
      cancelledBooking.actual_start_date = null;
      cancelledBooking.actual_end_date = null;
    }
  }

  return rows;
}

function buildInvoices(): Record<string, unknown>[] {
  return [
    // Paid invoices (7) — linked to completed bookings
    {
      id: INVOICE_IDS[0],
      provider_id: PROVIDER.id,
      booking_id: BOOKING_IDS[0],
      client_id: LANDLORD.id,
      invoice_number: "JP-2025-0001",
      line_items: JSON.stringify([
        { description: "Kitchen mixer tap replacement", qty: 1, unit_price: 85 },
        { description: "Bristan tap (supply)", qty: 1, unit_price: 45 },
        { description: "Materials", qty: 1, unit_price: 15 },
      ]),
      subtotal: 145.00,
      vat_amount: 0,
      total_amount: 145.00,
      status: "paid",
      due_date: daysAgo(17).toISOString().split("T")[0],
      paid_at: daysAgo(20).toISOString(),
      notes: "Tap replaced, tested, no leaks.",
      created_at: daysAgo(24).toISOString(),
    },
    {
      id: INVOICE_IDS[1],
      provider_id: PROVIDER.id,
      booking_id: BOOKING_IDS[1],
      client_id: LANDLORD.id,
      invoice_number: "JP-2025-0002",
      line_items: JSON.stringify([
        { description: "Boiler service x3 properties", qty: 3, unit_price: 85 },
        { description: "CP12 certificates x3", qty: 3, unit_price: 10 },
      ]),
      subtotal: 285.00,
      vat_amount: 0,
      total_amount: 285.00,
      status: "paid",
      due_date: daysAgo(24).toISOString().split("T")[0],
      paid_at: daysAgo(30).toISOString(),
      notes: "All 3 properties serviced. CP12 certificates issued.",
      created_at: daysAgo(38).toISOString(),
    },
    {
      id: INVOICE_IDS[2],
      provider_id: PROVIDER.id,
      booking_id: BOOKING_IDS[2],
      client_id: LANDLORD.id,
      invoice_number: "JP-2025-0003",
      line_items: JSON.stringify([
        { description: "Emergency call-out", qty: 1, unit_price: 125 },
        { description: "Burst pipe repair", qty: 1, unit_price: 65 },
        { description: "Materials", qty: 1, unit_price: 30 },
      ]),
      subtotal: 220.00,
      vat_amount: 0,
      total_amount: 220.00,
      status: "paid",
      due_date: daysAgo(46).toISOString().split("T")[0],
      paid_at: daysAgo(50).toISOString(),
      notes: null,
      created_at: daysAgo(60).toISOString(),
    },
    {
      id: INVOICE_IDS[3],
      provider_id: PROVIDER.id,
      booking_id: BOOKING_IDS[3],
      client_id: HOMEBUYER.id,
      invoice_number: "JP-2025-0004",
      line_items: JSON.stringify([
        { description: "Boiler repair - PCB replacement", qty: 1, unit_price: 180 },
        { description: "Parts (PCB board)", qty: 1, unit_price: 245 },
      ]),
      subtotal: 425.00,
      vat_amount: 0,
      total_amount: 425.00,
      status: "paid",
      due_date: daysAgo(36).toISOString().split("T")[0],
      paid_at: daysAgo(40).toISOString(),
      notes: null,
      created_at: daysAgo(50).toISOString(),
    },
    {
      id: INVOICE_IDS[4],
      provider_id: PROVIDER.id,
      booking_id: BOOKING_IDS[4],
      client_id: LANDLORD.id,
      invoice_number: "JP-2025-0005",
      line_items: JSON.stringify([
        { description: "Bleed & balance 8 radiators", qty: 1, unit_price: 120 },
      ]),
      subtotal: 120.00,
      vat_amount: 0,
      total_amount: 120.00,
      status: "paid",
      due_date: daysAgo(61).toISOString().split("T")[0],
      paid_at: daysAgo(65).toISOString(),
      notes: null,
      created_at: daysAgo(75).toISOString(),
    },
    {
      id: INVOICE_IDS[5],
      provider_id: PROVIDER.id,
      booking_id: BOOKING_IDS[5],
      client_id: SELLER.id,
      invoice_number: "JP-2025-0006",
      line_items: JSON.stringify([
        { description: "Unblock kitchen drain", qty: 1, unit_price: 95 },
      ]),
      subtotal: 95.00,
      vat_amount: 0,
      total_amount: 95.00,
      status: "paid",
      due_date: daysAgo(76).toISOString().split("T")[0],
      paid_at: daysAgo(80).toISOString(),
      notes: null,
      created_at: daysAgo(90).toISOString(),
    },
    {
      id: INVOICE_IDS[6],
      provider_id: PROVIDER.id,
      booking_id: BOOKING_IDS[6],
      client_id: LANDLORD.id,
      invoice_number: "JP-2025-0007",
      line_items: JSON.stringify([
        { description: "Replace internal stopcock", qty: 1, unit_price: 140 },
        { description: "Materials (gate valve)", qty: 1, unit_price: 35 },
      ]),
      subtotal: 175.00,
      vat_amount: 0,
      total_amount: 175.00,
      status: "paid",
      due_date: daysAgo(96).toISOString().split("T")[0],
      paid_at: daysAgo(100).toISOString(),
      notes: null,
      created_at: daysAgo(110).toISOString(),
    },

    // Outstanding invoices (3) — sent but not yet paid
    {
      id: INVOICE_IDS[7],
      provider_id: PROVIDER.id,
      booking_id: BOOKING_IDS[7], // bathroom refit (in progress)
      client_id: HOMEBUYER.id,
      invoice_number: "JP-2025-0008",
      line_items: JSON.stringify([
        { description: "Bathroom refit - 50% deposit", qty: 1, unit_price: 2100 },
      ]),
      subtotal: 2100.00,
      vat_amount: 0,
      total_amount: 2100.00,
      status: "sent",
      due_date: daysAgo(-7).toISOString().split("T")[0],
      paid_at: null,
      notes: "50% deposit for bathroom refit. Balance due on completion.",
      created_at: daysAgo(10).toISOString(),
    },
    {
      id: INVOICE_IDS[8],
      provider_id: PROVIDER.id,
      booking_id: null,
      client_id: LANDLORD.id,
      invoice_number: "JP-2025-0009",
      line_items: JSON.stringify([
        { description: "Thermostatic radiator valves x4", qty: 4, unit_price: 45 },
        { description: "TRV supply", qty: 4, unit_price: 22 },
      ]),
      subtotal: 268.00,
      vat_amount: 0,
      total_amount: 268.00,
      status: "sent",
      due_date: daysAgo(-14).toISOString().split("T")[0],
      paid_at: null,
      notes: null,
      created_at: daysAgo(7).toISOString(),
    },
    {
      id: INVOICE_IDS[9],
      provider_id: PROVIDER.id,
      booking_id: null,
      client_id: HOMEBUYER.id,
      invoice_number: "JP-2025-0010",
      line_items: JSON.stringify([
        { description: "Draft invoice - boiler installation quote", qty: 1, unit_price: 2800 },
      ]),
      subtotal: 2800.00,
      vat_amount: 0,
      total_amount: 2800.00,
      status: "draft",
      due_date: null,
      paid_at: null,
      notes: "Draft - awaiting customer confirmation on boiler model.",
      created_at: daysAgo(2).toISOString(),
    },
  ];
}

function buildProviderDocuments(): Record<string, unknown>[] {
  const now = new Date();

  return [
    // 1. Gas Safe certificate
    {
      id: DOCUMENT_IDS[0],
      user_id: PROVIDER.id,
      document_type: "gas_safe_certificate",
      file_name: "Gas_Safe_Certificate_543210.pdf",
      file_url: "/demo/provider-docs/gas-safe-cert.pdf",
      file_size: 245000,
      mime_type: "application/pdf",
      verification_status: "approved",
      expiry_date: new Date(now.getFullYear() + 1, now.getMonth(), 15).toISOString().split("T")[0],
      reviewer_notes: "Gas Safe registration verified against register.",
      reviewed_at: daysAgo(90).toISOString(),
      created_at: daysAgo(180).toISOString(),
    },
    // 2. Public liability insurance
    {
      id: DOCUMENT_IDS[1],
      user_id: PROVIDER.id,
      document_type: "public_liability_insurance",
      file_name: "Public_Liability_Insurance_Hiscox.pdf",
      file_url: "/demo/provider-docs/public-liability-insurance.pdf",
      file_size: 312000,
      mime_type: "application/pdf",
      verification_status: "approved",
      expiry_date: new Date(now.getFullYear() + 1, 2, 15).toISOString().split("T")[0],
      reviewer_notes: "Hiscox policy verified. 2M public liability cover confirmed.",
      reviewed_at: daysAgo(85).toISOString(),
      created_at: daysAgo(180).toISOString(),
    },
    // 3. Qualification certificate (City & Guilds)
    {
      id: DOCUMENT_IDS[2],
      user_id: PROVIDER.id,
      document_type: "qualification_certificate",
      file_name: "City_Guilds_Level3_Plumbing.pdf",
      file_url: "/demo/provider-docs/city-guilds-cert.pdf",
      file_size: 189000,
      mime_type: "application/pdf",
      verification_status: "approved",
      expiry_date: null, // Qualifications don't expire
      reviewer_notes: "City & Guilds Level 3 Plumbing & Heating qualification verified.",
      reviewed_at: daysAgo(175).toISOString(),
      created_at: daysAgo(180).toISOString(),
    },
    // 4. DBS check
    {
      id: DOCUMENT_IDS[3],
      user_id: PROVIDER.id,
      document_type: "dbs_check",
      file_name: "DBS_Enhanced_Check_Mike_Johnson.pdf",
      file_url: "/demo/provider-docs/dbs-check.pdf",
      file_size: 156000,
      mime_type: "application/pdf",
      verification_status: "approved",
      expiry_date: new Date(now.getFullYear() + 2, 5, 1).toISOString().split("T")[0],
      reviewer_notes: "Enhanced DBS check clear.",
      reviewed_at: daysAgo(170).toISOString(),
      created_at: daysAgo(180).toISOString(),
    },
  ];
}

// ---------------------------------------------------------------------------
// Main Seed Function
// ---------------------------------------------------------------------------

export type SeedProviderResult = {
  providerDetailsSeeded: number;
  serviceRequestsSeeded: number;
  quotesSeeded: number;
  bookingsSeeded: number;
  invoicesSeeded: number;
  documentsSeeded: number;
};

export async function seedProvider(
  supabase: SupabaseClient,
  scenario: Scenario,
): Promise<SeedProviderResult> {
  console.log(`\n--- Seeding Provider Dashboard (scenario: ${scenario}) ---\n`);

  // 1. Service provider details (upsert on user_id, not id)
  const providerDetails = buildServiceProviderDetails();
  console.log("  Seeding service_provider_details: 1 row...");
  const { error: spdError } = await supabase
    .from("service_provider_details")
    .upsert([providerDetails], { onConflict: "user_id" });
  const providerDetailsCount = spdError ? 0 : 1;
  if (spdError) {
    console.error(`  ERROR seeding service_provider_details: ${spdError.message}`);
  } else {
    console.log("  Seeded service_provider_details: 1 row");
  }

  // 2. Service requests
  const serviceRequestRows = buildServiceRequests();
  const srResult = await seedTable(supabase, "service_requests", serviceRequestRows);

  // 3. Quotes (depends on service_requests + provider details)
  const quoteRows = buildQuotes();
  const quoteResult = await seedTable(supabase, "quotes", quoteRows);

  // 4. Bookings (depends on quotes + service_requests)
  // Note: bookings_generate_reference trigger will auto-generate booking_reference
  const bookingRows = buildBookings(scenario);
  const bookingResult = await seedTable(supabase, "bookings", bookingRows);

  // 5. Provider invoices
  const invoiceRows = buildInvoices();
  const invoiceResult = await seedTable(supabase, "provider_invoices", invoiceRows);

  // 6. Provider documents
  const documentRows = buildProviderDocuments();
  const documentResult = await seedTable(supabase, "provider_documents", documentRows);

  const result: SeedProviderResult = {
    providerDetailsSeeded: providerDetailsCount,
    serviceRequestsSeeded: srResult.success ? srResult.count : 0,
    quotesSeeded: quoteResult.success ? quoteResult.count : 0,
    bookingsSeeded: bookingResult.success ? bookingResult.count : 0,
    invoicesSeeded: invoiceResult.success ? invoiceResult.count : 0,
    documentsSeeded: documentResult.success ? documentResult.count : 0,
  };

  console.log("\n--- Provider Dashboard Summary ---");
  console.log(`  Provider details seeded:  ${result.providerDetailsSeeded}`);
  console.log(`  Service requests seeded:  ${result.serviceRequestsSeeded}`);
  console.log(`  Quotes seeded:            ${result.quotesSeeded}`);
  console.log(`  Bookings seeded:          ${result.bookingsSeeded}`);
  console.log(`  Invoices seeded:          ${result.invoicesSeeded}`);
  console.log(`  Documents seeded:         ${result.documentsSeeded}`);

  return result;
}
