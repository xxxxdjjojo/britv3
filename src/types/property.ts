/**
 * Property portal domain types -- mirrors the database schema in 003_property_portal.sql.
 * All field names and constraints match the SQL exactly.
 */

import type { SearchFilters } from "./search";

// -- Enum types (mirror SQL enums) ------------------------------------------

export type PropertyType =
  | "detached"
  | "semi_detached"
  | "terraced"
  | "flat"
  | "bungalow"
  | "land"
  | "cottage"
  | "penthouse"
  | "studio"
  | "maisonette"
  | "other";

export type ListingType = "sale" | "rent";

export type ListingStatus =
  | "draft"
  | "active"
  | "under_offer"
  | "sold_stc"
  | "sold"
  | "let"
  | "withdrawn"
  | "archived";

export type TenureType = "freehold" | "leasehold" | "shared_ownership";

export type MediaType = "image" | "floor_plan" | "epc_document";

export type PriceQualifier =
  | "offers_over"
  | "guide_price"
  | "fixed_price"
  | "from"
  | "poa";

export type RentFrequency = "weekly" | "monthly" | "yearly";

export type EpcRating = "A" | "B" | "C" | "D" | "E" | "F" | "G";

// -- Table row types --------------------------------------------------------

/** Mirrors public.properties table */
export type Property = Readonly<{
  id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  coordinates: { lat: number; lng: number } | null;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  reception_rooms: number | null;
  square_footage: number | null;
  title: string;
  description: string;
  description_tsv: string | null;
  features: Record<string, unknown>;
  epc_rating: EpcRating | null;
  epc_score: number | null;
  tenure: TenureType | null;
  lease_remaining_years: number | null;
  council_tax_band: string | null;
  year_built: number | null;
  new_build: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}>;

/** Mirrors public.listings table */
export type Listing = Readonly<{
  id: string;
  property_id: string;
  user_id: string;
  listing_type: ListingType;
  status: ListingStatus;
  price: number;
  rent_frequency: RentFrequency | null;
  price_qualifier: PriceQualifier | null;
  service_charge_annual: number | null;
  ground_rent_annual: number | null;
  listed_date: string;
  available_from: string | null;
  slug: string | null;
  view_count: number;
  enquiry_count: number;
  favorite_count: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}>;

/** Mirrors public.property_media table */
export type PropertyMedia = Readonly<{
  id: string;
  listing_id: string;
  media_type: MediaType;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  alt_text: string | null;
  sort_order: number;
  file_size: number | null;
  original_filename: string | null;
  uploaded_by: string | null;
  created_at: Date;
}>;

/** Mirrors public.price_history table */
export type PriceHistory = Readonly<{
  id: string;
  listing_id: string;
  old_price: number;
  new_price: number;
  changed_at: Date;
  changed_by: string | null;
}>;

/** Mirrors public.saved_properties table */
export type SavedProperty = Readonly<{
  id: string;
  user_id: string;
  listing_id: string;
  notes: string | null;
  created_at: Date;
}>;

/** Mirrors public.saved_searches table */
export type SavedSearch = Readonly<{
  id: string;
  user_id: string;
  name: string;
  filters: SearchFilters;
  alerts_enabled: boolean;
  alert_frequency: "instant" | "daily" | "weekly";
  last_alerted_at: Date | null;
  new_results_count: number;
  created_at: Date;
  updated_at: Date;
}>;

/** Mirrors public.search_analytics table */
export type SearchAnalytics = Readonly<{
  id: number;
  user_id: string | null;
  filters: Record<string, unknown>;
  result_count: number;
  query_duration_ms: number | null;
  created_at: Date;
}>;

/** Mirrors public.viewing_history table */
export type ViewingHistory = Readonly<{
  id: number;
  user_id: string;
  listing_id: string;
  viewed_at: Date;
}>;

// -- Composite types --------------------------------------------------------

/** Listing joined with Property data (for API responses) */
export type ListingWithProperty = Readonly<{
  listing: Listing;
  property: Property;
  media: PropertyMedia[];
}>;

/** Matches the search_listings materialized view columns exactly */
export type SearchListingRow = Readonly<{
  listing_id: string;
  property_id: string;
  listing_type: ListingType;
  status: ListingStatus;
  price: number;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  city: string;
  postcode: string;
  coordinates: { lat: number; lng: number } | null;
  description_tsv: string | null;
  features: Record<string, unknown>;
  epc_rating: EpcRating | null;
  new_build: boolean;
  listed_date: string;
  slug: string | null;
  thumbnail_url: string | null;
  title: string;
  address_line1: string;
  rent_frequency: RentFrequency | null;
  price_qualifier: PriceQualifier | null;
  reception_rooms: number | null;
  square_footage: number | null;
  view_count: number;
  favorite_count: number;
  enquiry_count: number;
}>;

// -- Input types (for forms) ------------------------------------------------

/** Input for creating a property (no id, timestamps) */
export type CreatePropertyInput = Readonly<{
  address_line1: string;
  address_line2?: string | null;
  city: string;
  county?: string | null;
  postcode: string;
  coordinates?: { lat: number; lng: number } | null;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  reception_rooms?: number | null;
  square_footage?: number | null;
  title: string;
  description: string;
  features?: Record<string, unknown>;
  epc_rating?: EpcRating | null;
  epc_score?: number | null;
  tenure?: TenureType | null;
  lease_remaining_years?: number | null;
  council_tax_band?: string | null;
  year_built?: number | null;
  new_build?: boolean;
}>;

/** Input for updating a property */
export type UpdatePropertyInput = Partial<CreatePropertyInput>;

/** Input for creating a listing */
export type CreateListingInput = Readonly<{
  property_id: string;
  listing_type: ListingType;
  price: number;
  rent_frequency?: RentFrequency | null;
  price_qualifier?: PriceQualifier | null;
  service_charge_annual?: number | null;
  ground_rent_annual?: number | null;
  available_from?: string | null;
}>;

/** Input for updating a listing */
export type UpdateListingInput = Partial<Omit<CreateListingInput, "property_id">>;
