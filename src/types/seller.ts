// src/types/seller.ts
// Seller dashboard domain types — Phase 13

export type PropertyType = "detached" | "semi-detached" | "terraced" | "flat" | "bungalow" | "other";
export type Tenure = "freehold" | "leasehold";
export type ListingStatus = "draft" | "active" | "under_offer" | "sold" | "paused" | "archived";
export type ListingType = "for_sale" | "auction" | "expressions_of_interest";
export type PriceQualifier = "offers_over" | "offers_in_excess_of" | "guide_price" | "fixed_price" | "poa" | null;
export type DescriptionTone = "professional" | "warm" | "luxury";
export type EpcBand = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type CouncilTaxBand = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
export type ViewingStatus = "pending" | "confirmed" | "rescheduled" | "cancelled" | "completed";
export type ViewingType = "in_person" | "virtual";
export type OfferStatus = "pending" | "accepted" | "countered" | "rejected" | "withdrawn";
export type BuyerType = "cash" | "mortgage";
export type ChainStatus = "chain_free" | "in_chain";
export type AnalyticsEventType = "view" | "save" | "enquiry" | "phone_click" | "email_click";

export type ListingPhoto = Readonly<{
  url: string;
  order: number;
  caption?: string;
}>;

export type SellerListing = Readonly<{
  id: string;
  seller_id: string;
  postcode: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  property_type: PropertyType;
  tenure: Tenure;
  leasehold_years_remaining: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  features: string[] | null;
  council_tax_band: CouncilTaxBand | null;
  epc_band: EpcBand | null;
  photos: ListingPhoto[];
  floor_plan_url: string | null;
  description: string | null;
  description_tone: DescriptionTone | null;
  key_selling_points: string[] | null;
  asking_price: number | null;
  listing_type: ListingType | null;
  price_qualifier: PriceQualifier;
  ai_valuation_estimate: number | null;
  epc_url: string | null;
  status: ListingStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}>;

export type ListingWithStats = SellerListing & Readonly<{
  views_count: number;
  saves_count: number;
  enquiries_count: number;
  weekly_views: number[];
}>;

export type ListingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ListingAnalyticsEvent = Readonly<{
  id: string;
  listing_id: string;
  event_type: AnalyticsEventType;
  occurred_at: string;
  visitor_fingerprint: string | null;
}>;

export type ListingAnalyticsSummary = Readonly<{
  listing_id: string;
  total_views: number;
  total_saves: number;
  total_enquiries: number;
  total_phone_clicks: number;
  total_email_clicks: number;
  ctr: number;
  daily_views: Array<Readonly<{ date: string; count: number }>>;
}>;

export type DescriptionAttempt = Readonly<{
  id: string;
  listing_id: string;
  seller_id: string;
  tone: DescriptionTone;
  created_at: string;
}>;

export type SellerViewing = Readonly<{
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_name: string;
  buyer_email: string;
  viewing_datetime: string;
  viewing_type: ViewingType;
  status: ViewingStatus;
  feedback: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  listing?: Pick<SellerListing, "id" | "address_line_1" | "city" | "postcode" | "photos">;
}>;

export type SellerOffer = Readonly<{
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_name: string;
  buyer_email: string;
  amount: number;
  buyer_type: BuyerType | null;
  chain_status: ChainStatus | null;
  chain_length: number | null;
  is_verified: boolean;
  conditions: string | null;
  solicitor_name: string | null;
  solicitor_email: string | null;
  solicitor_phone: string | null;
  status: OfferStatus;
  counter_amount: number | null;
  counter_message: string | null;
  offered_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  listing?: Pick<SellerListing, "id" | "address_line_1" | "city" | "postcode" | "asking_price" | "photos">;
}>;

export type SaleStageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type SaleProgressionDocument = Readonly<{
  name: string;
  url: string | null;
  status: "uploaded" | "pending" | "missing";
  stage: SaleStageNumber;
}>;

export type SaleProgressionStage = Readonly<{
  id: string;
  offer_id: string;
  seller_id: string;
  current_stage: SaleStageNumber;
  stage_dates: Record<string, string>;
  expected_dates: Record<string, string>;
  documents: SaleProgressionDocument[];
  solicitor_name: string | null;
  solicitor_email: string | null;
  solicitor_phone: string | null;
  buyer_solicitor_name: string | null;
  buyer_solicitor_email: string | null;
  mortgage_broker_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}>;

export type AgentProfile = Readonly<{
  id: string;
  full_name: string;
  agency_name: string;
  avatar_url: string | null;
  areas_covered: string[];
  fee_percentage: number | null;
  average_rating: number | null;
  review_count: number;
  sold_count: number;
  average_days_to_sell: number | null;
  bio: string | null;
}>;

export type AgentEnquiry = Readonly<{
  id: string;
  seller_id: string;
  agent_id: string;
  listing_id: string | null;
  message: string;
  status: "sent" | "responded" | "booked";
  created_at: string;
}>;

export type SellerDashboardKPIs = Readonly<{
  active_listings: number;
  total_views_30d: number;
  views_change_pct: number;
  enquiries_30d: number;
  enquiries_change_pct: number;
  upcoming_viewings: number;
  viewings_change_pct: number;
}>;

export type LandRegistryComparable = Readonly<{
  address: string;
  postcode: string;
  /** Sale price in PENCE (Land Registry quotes pounds; scaled by POUNDS_TO_PENCE on ingest). */
  price: number;
  sale_date: string;
  property_type: string;
  tenure: string;
  distance_metres: number | null;
}>;
