/**
 * Provider public profile types -- mirrors the database schema for
 * service_provider_details, reviews, provider_rating_stats, provider_services,
 * provider_portfolio_items, provider_leads, and agent_agency_profiles.
 *
 * All field names use Supabase column names exactly.
 */

import type { ServiceCategory } from "@/types/marketplace";

// ---------------------------------------------------------------------------
// Pricing discriminated union
// ---------------------------------------------------------------------------

export type ProviderPricing =
  | { type: "hourly"; amount: number; unit: string }
  | { type: "fixed"; amount: number }
  | { type: "quote" };

// ---------------------------------------------------------------------------
// Nested embedded types (mirroring JOIN shapes from Supabase select queries)
// ---------------------------------------------------------------------------

export type ProviderProfile = {
  id: string;
  avatar_url: string | null;
  full_name: string | null;
  provider_verification_status: "pending" | "verified" | "rejected" | null;
  email: string | null;
};

export type ProviderRatingStats = {
  provider_id: string;
  avg_rating: number | null;
  total_reviews: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
};

// ---------------------------------------------------------------------------
// ServiceProviderPublicProfile
// Represents a JOIN of service_provider_details + profiles + provider_rating_stats
// ---------------------------------------------------------------------------

export type ServiceProviderPublicProfile = {
  id: string;
  user_id: string;
  slug: string;
  business_name: string;
  tagline: string | null;
  description: string | null;
  services: ServiceCategory[];
  city: string | null;
  service_postcodes: string[] | null;
  website_url: string | null;
  phone: string | null;
  years_experience: number | null;
  qualifications: string[] | null;
  insurance_verified: boolean;
  created_at: string;
  updated_at: string;
  /** Embedded from profiles JOIN */
  profiles: ProviderProfile;
  /** Embedded from provider_rating_stats JOIN (null if no stats yet) */
  provider_rating_stats: ProviderRatingStats | null;
};

// ---------------------------------------------------------------------------
// PortfolioItem — mirrors provider_portfolio_items table columns
// ---------------------------------------------------------------------------

export type PortfolioItem = {
  id: string;
  provider_id: string;
  image_url: string;
  title: string;
  description: string | null;
  category: string | null;
  sort_order: number;
  created_at: string;
};

// ---------------------------------------------------------------------------
// ProviderLead — mirrors provider_leads table columns
// ---------------------------------------------------------------------------

export type ProviderLead = {
  id: string;
  provider_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  service_type: string | null;
  preferred_date: string | null;
  description: string | null;
  source: string;
  created_at: string;
};

// ---------------------------------------------------------------------------
// ProviderService — mirrors provider_services table columns
// ---------------------------------------------------------------------------

export type ProviderService = {
  id: string;
  provider_id: string;
  name: string;
  description: string | null;
  category: ServiceCategory | null;
  pricing: ProviderPricing;
  estimated_duration_hours: number | null;
  is_active: boolean;
};

// ---------------------------------------------------------------------------
// PublicReview — mirrors reviews table + reviewer profile JOIN
// ---------------------------------------------------------------------------

export type ReviewerProfile = {
  full_name: string | null;
  avatar_url: string | null;
};

export type PublicReview = {
  id: string;
  provider_id: string;
  reviewer_id: string;
  overall_rating: number;
  quality_rating: number | null;
  communication_rating: number | null;
  value_rating: number | null;
  title: string | null;
  body: string | null;
  moderation_status: "approved" | "pending" | "rejected";
  deleted_at: string | null;
  created_at: string;
  /** Embedded reviewer profile */
  profiles: ReviewerProfile;
};

// ---------------------------------------------------------------------------
// AgentPublicStats — matches get_agent_public_stats() RPC return shape
// ---------------------------------------------------------------------------

export type AgentPublicStats = {
  active_listings_count: number;
  sold_count: number;
  avg_days_to_sell: number | null;
  avg_pct_asking: number | null;
  avg_rating: number | null;
  total_reviews: number;
};

// ---------------------------------------------------------------------------
// AgentTeamMember
// ---------------------------------------------------------------------------

export type AgentTeamMember = {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  bio: string | null;
};

// ---------------------------------------------------------------------------
// AgentPublicProfile — represents an agent_agency_profiles record + profile JOIN
// ---------------------------------------------------------------------------

export type AgencyData = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  address: string | null;
};

export type AgentPublicProfile = {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  specialisations: string[] | null;
  areas_covered: string[] | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  /** Embedded profiles JOIN */
  profiles: {
    id: string;
    avatar_url: string | null;
    full_name: string | null;
    email: string | null;
  };
  /** Embedded agency data */
  agency: AgencyData | null;
};

// ---------------------------------------------------------------------------
// Paginated listing shape for agent listings tab
// ---------------------------------------------------------------------------

export type AgentListingItem = {
  id: string;
  title: string;
  slug: string | null;
  price: number | null;
  sold_price: number | null;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: string | null;
  cover_image_url: string | null;
  address_line1: string | null;
  city: string | null;
  postcode: string | null;
  created_at: string;
  sold_at: string | null;
};

export type PaginatedListings = {
  listings: AgentListingItem[];
  total: number;
  page: number;
  pageSize: number;
};
