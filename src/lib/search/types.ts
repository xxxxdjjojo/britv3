/**
 * Shared search-result type module.
 * Lives here (not in the "use server" actions.ts) so non-server libs can
 * import SearchProperty without pulling in a server module.
 */

export type SearchProperty = {
  id: string;
  slug: string;
  image: string | null;
  price: number;
  address: string;
  city: string;
  postcode: string;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  listing_type: "sale" | "rent";
  lat: number;
  lng: number;
  epc_rating: string | null;
  tenure: string | null;
  last_sold_date: string | null;
  /** True only when the listing is genuinely verified. Never fabricated. */
  verified?: boolean;
  // --- Optional rental fields (populated only for rent listings via the mock/search adapter) ---
  rent_frequency?: string | null;   // "monthly" | "weekly"
  let_agreed?: boolean;              // true when the listing is let-agreed
  furnishing?: string | null;        // "furnished" | "unfurnished" | "part_furnished"
  available_from?: string | null;    // ISO date
  bills_included?: boolean | null;
  pets_policy?: string | null;       // enum value, e.g. "allowed" | "not_allowed" | "by_arrangement"
  students_policy?: string | null;
  deposit_amount?: number | null;
};
