/**
 * Dashboard domain types -- role-specific dashboard data structures.
 * Each role gets a tailored dashboard with aggregated stats and activity.
 */

import type { UserRole } from "./auth";

// -- Shared dashboard types --------------------------------------------------

/** Data for a single stat card widget */
export type StatCardData = Readonly<{
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: string;
}>;

/** A single entry in the activity feed (cursor-paginated via created_at) */
export type ActivityLogEntry = Readonly<{
  id: number;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}>;

// -- Viewing summary (shared across roles) ------------------------------------

export type ViewingSummary = Readonly<{
  id: string;
  property_address: string;
  scheduled_at: Date;
  status: "confirmed" | "pending" | "cancelled";
}>;

// -- Offer summary (shared across roles) --------------------------------------

export type OfferSummary = Readonly<{
  id: string;
  property_address: string;
  amount: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  submitted_at: Date;
}>;

// -- Role-specific dashboard types --------------------------------------------

/** Homebuyer dashboard: saved properties, active searches, upcoming viewings */
export type HomebuyerDashboard = Readonly<{
  role: "homebuyer";
  saved_properties_count: number;
  active_searches_count: number;
  upcoming_viewings: ReadonlyArray<ViewingSummary>;
  recent_activity: ReadonlyArray<ActivityLogEntry>;
}>;

/** Renter dashboard: saved rentals, application status, tenancy details */
export type RenterDashboard = Readonly<{
  role: "renter";
  saved_rentals_count: number;
  application_status: ReadonlyArray<{
    id: string;
    property_address: string;
    status: "submitted" | "under_review" | "approved" | "rejected";
    submitted_at: Date;
  }>;
  tenancy_details: Readonly<{
    property_address: string | null;
    lease_start: Date | null;
    lease_end: Date | null;
    monthly_rent: number | null;
  }> | null;
  recent_activity: ReadonlyArray<ActivityLogEntry>;
}>;

/** Seller dashboard: listings with metrics, viewing requests, offers */
export type SellerDashboard = Readonly<{
  role: "seller";
  listings: ReadonlyArray<
    Readonly<{
      id: string;
      address: string;
      price: number;
      views_count: number;
      saves_count: number;
      enquiries_count: number;
      status: "active" | "under_offer" | "sold" | "withdrawn";
    }>
  >;
  viewing_requests: ReadonlyArray<ViewingSummary>;
  offers: ReadonlyArray<OfferSummary>;
  recent_activity: ReadonlyArray<ActivityLogEntry>;
}>;

/** Landlord dashboard: portfolio overview with occupancy and income */
export type LandlordDashboard = Readonly<{
  role: "landlord";
  portfolio_count: number;
  occupancy_rate: number;
  total_income: number;
  properties: ReadonlyArray<
    Readonly<{
      id: string;
      address: string;
      status: "occupied" | "vacant" | "maintenance";
      monthly_rent: number;
      tenant_name: string | null;
      lease_end: Date | null;
    }>
  >;
  recent_activity: ReadonlyArray<ActivityLogEntry>;
}>;

/** Agent dashboard: active listings, leads pipeline, viewings, revenue */
export type AgentDashboard = Readonly<{
  role: "agent";
  active_listings_count: number;
  leads_pipeline: Readonly<{
    new: number;
    contacted: number;
    viewing_booked: number;
    offer_made: number;
    closed: number;
  }>;
  viewings: ReadonlyArray<ViewingSummary>;
  revenue: Readonly<{
    current_month: number;
    previous_month: number;
    year_to_date: number;
  }>;
  recent_activity: ReadonlyArray<ActivityLogEntry>;
}>;

/** Provider dashboard: verification, jobs, ratings, earnings, quotes */
export type ProviderDashboard = Readonly<{
  role: "service_provider";
  verification_status: "pending" | "verified" | "rejected";
  active_jobs_count: number;
  average_rating: number;
  total_earnings: number;
  pending_quotes_count: number;
  recent_activity: ReadonlyArray<ActivityLogEntry>;
}>;

// -- Union type ---------------------------------------------------------------

/** Discriminated union of all role-specific dashboards */
export type DashboardData =
  | HomebuyerDashboard
  | RenterDashboard
  | SellerDashboard
  | LandlordDashboard
  | AgentDashboard
  | ProviderDashboard;

/** Map from role to its dashboard type */
export type DashboardForRole<R extends UserRole> = R extends "homebuyer"
  ? HomebuyerDashboard
  : R extends "renter"
    ? RenterDashboard
    : R extends "seller"
      ? SellerDashboard
      : R extends "landlord"
        ? LandlordDashboard
        : R extends "agent"
          ? AgentDashboard
          : R extends "service_provider"
            ? ProviderDashboard
            : never;
