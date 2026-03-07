/**
 * Shared dashboard test fixtures.
 * All data is deterministic (no random values) for snapshot-safe tests.
 */

import type { UserRole } from "@/types/auth";
import type {
  ActivityLogEntry,
  DashboardData,
  StatCardData,
} from "@/types/dashboard";

// ---------------------------------------------------------------------------
// Activity log fixtures
// ---------------------------------------------------------------------------

const FIXED_DATE = new Date("2026-01-15T10:00:00Z");

export function createMockActivityLogEntry(
  overrides?: Partial<ActivityLogEntry>,
): ActivityLogEntry {
  return {
    id: 1,
    event_type: "property_saved",
    description: "Saved a property to favourites",
    metadata: { property_id: "prop-001" },
    created_at: FIXED_DATE,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Stat card fixtures
// ---------------------------------------------------------------------------

const STAT_CARDS_BY_ROLE: Record<UserRole, StatCardData[]> = {
  homebuyer: [
    { label: "Saved Properties", value: 12, change: 3, trend: "up", icon: "Heart" },
    { label: "Active Searches", value: 4, change: 0, trend: "neutral", icon: "Search" },
    { label: "Upcoming Viewings", value: 2, change: 1, trend: "up", icon: "Calendar" },
  ],
  renter: [
    { label: "Saved Rentals", value: 8, change: 2, trend: "up", icon: "Heart" },
    { label: "Applications", value: 3, change: -1, trend: "down", icon: "FileText" },
    { label: "Monthly Rent", value: "1,200", change: 0, trend: "neutral", icon: "PoundSterling" },
  ],
  seller: [
    { label: "Active Listings", value: 2, change: 0, trend: "neutral", icon: "Home" },
    { label: "Total Views", value: 345, change: 28, trend: "up", icon: "Eye" },
    { label: "Offers Received", value: 3, change: 1, trend: "up", icon: "Tag" },
  ],
  landlord: [
    { label: "Portfolio", value: 5, change: 0, trend: "neutral", icon: "Building" },
    { label: "Occupancy", value: "80%", change: -10, trend: "down", icon: "Users" },
    { label: "Monthly Income", value: "6,000", change: 500, trend: "up", icon: "PoundSterling" },
  ],
  agent: [
    { label: "Active Listings", value: 24, change: 3, trend: "up", icon: "Home" },
    { label: "Leads", value: 42, change: 5, trend: "up", icon: "Users" },
    { label: "Revenue (MTD)", value: "12,500", change: 2000, trend: "up", icon: "PoundSterling" },
  ],
  service_provider: [
    { label: "Active Jobs", value: 7, change: 2, trend: "up", icon: "Briefcase" },
    { label: "Rating", value: 4.8, change: 0.1, trend: "up", icon: "Star" },
    { label: "Earnings (MTD)", value: "3,200", change: 400, trend: "up", icon: "PoundSterling" },
  ],
};

export function createMockStatCards(role: UserRole): StatCardData[] {
  return STAT_CARDS_BY_ROLE[role];
}

// ---------------------------------------------------------------------------
// Dashboard data fixtures
// ---------------------------------------------------------------------------

const DASHBOARD_DATA_BY_ROLE: Record<UserRole, DashboardData> = {
  homebuyer: {
    role: "homebuyer",
    saved_properties_count: 12,
    active_searches_count: 4,
    upcoming_viewings: [
      {
        id: "view-001",
        property_address: "14 Elm Street, London SW1A 1AA",
        scheduled_at: new Date("2026-01-20T14:00:00Z"),
        status: "confirmed",
      },
    ],
    recent_activity: [createMockActivityLogEntry()],
  },
  renter: {
    role: "renter",
    saved_rentals_count: 8,
    application_status: [
      {
        id: "app-001",
        property_address: "7 Oak Avenue, Manchester M1 1AA",
        status: "under_review",
        submitted_at: new Date("2026-01-10T09:00:00Z"),
      },
    ],
    tenancy_details: {
      property_address: "22 Birch Lane, Leeds LS1 1AA",
      lease_start: new Date("2025-06-01T00:00:00Z"),
      lease_end: new Date("2026-05-31T00:00:00Z"),
      monthly_rent: 1200,
    },
    recent_activity: [createMockActivityLogEntry({ event_type: "application_submitted" })],
  },
  seller: {
    role: "seller",
    listings: [
      {
        id: "list-001",
        address: "9 Pine Road, Bristol BS1 1AA",
        price: 350000,
        views_count: 345,
        saves_count: 28,
        enquiries_count: 12,
        status: "active",
      },
    ],
    viewing_requests: [
      {
        id: "view-002",
        property_address: "9 Pine Road, Bristol BS1 1AA",
        scheduled_at: new Date("2026-01-22T11:00:00Z"),
        status: "pending",
      },
    ],
    offers: [
      {
        id: "offer-001",
        property_address: "9 Pine Road, Bristol BS1 1AA",
        amount: 340000,
        status: "pending",
        submitted_at: new Date("2026-01-18T16:00:00Z"),
      },
    ],
    recent_activity: [createMockActivityLogEntry({ event_type: "offer_received" })],
  },
  landlord: {
    role: "landlord",
    portfolio_count: 5,
    occupancy_rate: 0.8,
    total_income: 6000,
    properties: [
      {
        id: "prop-001",
        address: "3 Maple Close, Birmingham B1 1AA",
        status: "occupied",
        monthly_rent: 1500,
        tenant_name: "Jane Smith",
        lease_end: new Date("2026-08-31T00:00:00Z"),
      },
    ],
    recent_activity: [createMockActivityLogEntry({ event_type: "rent_received" })],
  },
  agent: {
    role: "agent",
    active_listings_count: 24,
    leads_pipeline: {
      new: 10,
      contacted: 8,
      viewing_booked: 12,
      offer_made: 7,
      closed: 5,
    },
    viewings: [
      {
        id: "view-003",
        property_address: "1 Cedar Way, London E1 1AA",
        scheduled_at: new Date("2026-01-21T09:30:00Z"),
        status: "confirmed",
      },
    ],
    revenue: {
      current_month: 12500,
      previous_month: 10000,
      year_to_date: 45000,
    },
    recent_activity: [createMockActivityLogEntry({ event_type: "lead_assigned" })],
  },
  service_provider: {
    role: "service_provider",
    verification_status: "verified",
    active_jobs_count: 7,
    average_rating: 4.8,
    total_earnings: 3200,
    pending_quotes_count: 3,
    recent_activity: [createMockActivityLogEntry({ event_type: "quote_requested" })],
  },
};

export function createMockDashboardData(role: UserRole): DashboardData {
  return DASHBOARD_DATA_BY_ROLE[role];
}
