/**
 * Marketplace domain types -- mirrors the database schema in 002_marketplace.sql.
 * All field names and constraints match the SQL exactly.
 */

// -- Enum types (mirror SQL enums) ------------------------------------------

export type ServiceCategory =
  | "conveyancing"
  | "surveying"
  | "mortgage_broker"
  | "moving_company"
  | "home_inspector"
  | "cleaning"
  | "handyman"
  | "plumber"
  | "electrician"
  | "landscaping"
  | "interior_design"
  | "architect"
  | "property_management"
  | "pest_control"
  | "locksmith"
  | "builder"
  | "plasterer"
  | "painter"
  | "carpenter"
  | "other";

export type VerificationDocumentType =
  | "identity_proof"
  | "qualification_certificate"
  | "insurance_certificate"
  | "business_registration"
  | "dbs_check"
  | "reference_letter"
  // UK trade credentials — added for Phase 16 provider dashboard
  | "gas_safe_certificate"
  | "niceic_registration"
  | "napit_registration"
  | "cscs_card"
  | "part_p_certificate"
  | "acs_qualification"
  | "public_liability_insurance";

export type DocumentVerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "more_info_required";

export type ProviderVerificationStatus =
  | "unverified"
  | "pending_review"
  | "verified"
  | "suspended"
  | "rejected";

export type RfqStatus =
  | "open"
  | "quotes_received"
  | "awarded"
  | "cancelled"
  | "expired";

export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "declined"
  | "expired"
  | "withdrawn";

export type BookingStatus =
  | "pending_confirmation"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export type SentimentScore =
  | "very_negative"
  | "negative"
  | "neutral"
  | "positive"
  | "very_positive";

export type ModerationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "flagged";

export type UrgencyLevel =
  | "low"
  | "normal"
  | "high"
  | "emergency";

export type ReviewFlagReason =
  | "spam"
  | "inappropriate"
  | "fake"
  | "off_topic"
  | "contact_info"
  | "promotional"
  | "duplicate";

// -- JSONB sub-types --------------------------------------------------------

export type QuoteLineItem = Readonly<{
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}>;

// -- Table row types --------------------------------------------------------

/** Mirrors public.service_provider_details table */
export type ServiceProviderDetails = Readonly<{
  user_id: string;
  business_name: string;
  business_description: string | null;
  trading_name: string | null;
  company_number: string | null;
  vat_number: string | null;
  services: ServiceCategory[];
  service_postcodes: string[];
  service_radius: number;
  base_location: unknown | null;
  pricing: Record<string, unknown>;
  qualifications: string[] | null;
  accreditations: string[] | null;
  insurance_details: Record<string, unknown> | null;
  portfolio_urls: string[] | null;
  slug: string;
  website_url: string | null;
  years_in_business: number;
  completed_jobs_count: number;
  response_time_hours: number | null;
  created_at: Date;
  updated_at: Date;
}>;

/** Mirrors public.provider_documents table */
export type ProviderDocument = Readonly<{
  id: string;
  user_id: string;
  document_type: VerificationDocumentType;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  verification_status: DocumentVerificationStatus;
  expiry_date: Date | null;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}>;

/** Mirrors public.provider_availability table */
export type ProviderAvailability = Readonly<{
  id: string;
  provider_id: string;
  start_date: Date;
  end_date: Date;
  reason: string | null;
  created_at: Date;
  updated_at: Date;
}>;

/** Mirrors public.service_requests (RFQ) table */
export type ServiceRequest = Readonly<{
  id: string;
  user_id: string;
  service_category: ServiceCategory;
  title: string;
  description: string;
  property_address: string | null;
  property_postcode: string;
  property_location: unknown | null;
  preferred_start_date: Date | null;
  urgency_level: UrgencyLevel;
  budget_min: number | null;
  budget_max: number | null;
  attachments: Record<string, unknown>[];
  status: RfqStatus;
  expires_at: Date;
  view_count: number;
  quote_count: number;
  created_at: Date;
  updated_at: Date;
}>;

/** Mirrors public.quotes table */
export type Quote = Readonly<{
  id: string;
  service_request_id: string;
  provider_id: string;
  quote_number: string;
  total_amount: number;
  vat_included: boolean;
  line_items: QuoteLineItem[];
  scope_of_work: string;
  estimated_duration: string | null;
  payment_terms: string | null;
  warranty_info: string | null;
  validity_date: Date | null;
  status: QuoteStatus;
  version: number;
  created_at: Date;
  updated_at: Date;
}>;

/** Mirrors public.bookings table */
export type Booking = Readonly<{
  id: string;
  service_request_id: string | null;
  quote_id: string | null;
  user_id: string;
  provider_id: string;
  booking_reference: string;
  scheduled_start_date: Date;
  scheduled_end_date: Date;
  actual_start_date: Date | null;
  actual_end_date: Date | null;
  status: BookingStatus;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  created_at: Date;
  updated_at: Date;
}>;

/** Mirrors public.booking_state_transitions lookup table */
export type BookingStateTransition = Readonly<{
  id: string;
  from_status: BookingStatus;
  to_status: BookingStatus;
  allowed_by: string[];
  requires_reason: boolean;
}>;

/** Mirrors public.booking_status_history table */
export type BookingStatusHistory = Readonly<{
  id: string;
  booking_id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  changed_by: string | null;
  reason: string | null;
  created_at: Date;
}>;

/** Mirrors public.reviews table */
export type Review = Readonly<{
  id: string;
  booking_id: string;
  provider_id: string;
  reviewer_id: string;
  overall_rating: number;
  punctuality_rating: number | null;
  quality_rating: number | null;
  value_rating: number | null;
  professionalism_rating: number | null;
  title: string;
  review_text: string;
  search_vector: unknown | null;
  sentiment: SentimentScore | null;
  authenticity_score: number;
  fake_review_probability: number;
  spam_indicators: Record<string, unknown>;
  moderation_status: ModerationStatus;
  provider_response: string | null;
  provider_response_at: Date | null;
  helpful_count: number;
  not_helpful_count: number;
  edited_at: Date | null;
  original_text: string | null;
  edit_count: number;
  edit_history: Array<{ text: string; title: string; edited_at: string }>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}>;

/** Mirrors public.review_helpfulness table */
export type ReviewHelpfulness = Readonly<{
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: Date;
}>;

/** Mirrors public.review_flags table */
export type ReviewFlag = Readonly<{
  id: string;
  review_id: string;
  user_id: string;
  reason: ReviewFlagReason;
  description: string | null;
  admin_status: string;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}>;

/** Mirrors public.moderation_queue table */
export type ModerationQueueEntry = Readonly<{
  id: string;
  review_id: string;
  priority_score: number;
  assigned_to: string | null;
  assigned_at: Date | null;
  completed_at: Date | null;
  decision: string | null;
  reason: string | null;
  created_at: Date;
}>;

/** Mirrors public.provider_rating_stats table */
export type ProviderRatingStats = Readonly<{
  provider_id: string;
  average_rating: number;
  total_reviews: number;
  avg_punctuality: number;
  avg_quality: number;
  avg_value: number;
  avg_professionalism: number;
  count_5_star: number;
  count_4_star: number;
  count_3_star: number;
  count_2_star: number;
  count_1_star: number;
  total_helpful_votes: number;
  reviews_with_responses: number;
  response_rate: number;
  last_review_date: Date | null;
  updated_at: Date;
}>;
