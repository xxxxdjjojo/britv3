/**
 * Search domain types for property search, filtering, and geocoding.
 */

import type { EpcRating, PropertyType, SearchListingRow } from "./property";

// -- Search types -----------------------------------------------------------

/** Filter criteria for property search */
export type SearchFilters = Readonly<{
  listing_type?: "sale" | "rent";
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  property_type?: PropertyType[];
  epc_rating?: EpcRating;
  new_build?: boolean;
  amenities?: string[];
}>;

/** Full search parameters (filters + location + pagination) */
export type SearchParams = SearchFilters &
  Readonly<{
    q?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    postcode?: string;
    sort?: SearchSort;
    cursor?: string;
    per_page?: number;
  }>;

/** Sort options for search results */
export type SearchSort =
  | "price_asc"
  | "price_desc"
  | "date_desc"
  | "date_asc"
  | "relevance";

/** Paginated search result */
export type SearchResult = Readonly<{
  data: SearchListingRow[];
  count: number;
  cursor: string | null;
}>;

// -- Geocoding types --------------------------------------------------------

/** Geocoded location from postcodes.io */
export type GeocodedLocation = Readonly<{
  lat: number;
  lng: number;
  admin_district: string;
  region: string;
  postcode: string;
}>;

/** Postcode autocomplete results */
export type PostcodeAutocompleteResult = string[];
