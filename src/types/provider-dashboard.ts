/**
 * Provider Dashboard domain types — mirrors the database schema in
 * 20260316100000_provider_dashboard_tables.sql.
 * All monetary values in pence (integer) unless noted otherwise.
 */

// -- Enum string unions ---------------------------------------------------

export type PricingType = "hourly" | "fixed" | "quote_on_request";

export type ProviderReferenceType = "client" | "peer";

export type ProviderReferenceStatus =
  | "pending"
  | "sent"
  | "submitted"
  | "verified"
  | "declined"
  | "expired"
  | "revoked"
  | "rejected"
  | "flagged";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export type BoostType = "featured_profile" | "area_spotlight" | "category_top";

export type ReferralStatus = "pending" | "signed_up" | "verified" | "rewarded";

export type ZoneType = "radius" | "polygon";

// -- JSONB sub-types --------------------------------------------------------

/** Line item within a provider invoice */
export type InvoiceLineItem = Readonly<{
  name: string;
  description?: string;
  quantity: number;
  unit_price_pence: number;
  total_pence: number;
  vat_rate?: number;
}>;

/** Recurring availability rule stored in provider_availability.recurring_rules */
export type RecurringAvailabilityRule = Readonly<{
  days: number[]; // 0 = Sunday … 6 = Saturday
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  effective_from: string; // ISO date string
  effective_until?: string; // ISO date string
}>;

// -- Table row types --------------------------------------------------------

/** Mirrors provider_services table */
export type ProviderService = Readonly<{
  id: string;
  provider_id: string;
  name: string;
  category: string;
  description: string | null;
  pricing_type: PricingType;
  price_amount: number | null;
  created_at: string;
  updated_at: string;
}>;

/**
 * Mirrors provider_references table.
 * NOTE: `invite_token_hash` (sha256 of the raw invite token) is intentionally
 * omitted — it is server-only and must never reach client-facing code.
 */
export type ProviderReference = Readonly<{
  id: string;
  provider_id: string;
  reference_type: ProviderReferenceType;
  referee_name: string;
  referee_email: string;
  referee_phone: string | null;
  relationship: string | null;
  status: ProviderReferenceStatus;
  reference_text: string | null;
  requested_at: string;
  submitted_at: string | null;
  verified_at: string | null;
  // Invitation lifecycle (referee-driven vouching flow)
  invite_expires_at: string | null;
  invite_sent_at: string | null;
  invite_last_sent_at: string | null;
  invite_send_count: number;
  work_date: string | null; // client refs: date work occurred (recency source)
  rating: number | null; // 1–5
  declined_reason: string | null;
  declined_at: string | null;
  revoked_at: string | null;
  // Admin review
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_reason: string | null;
}>;

/**
 * Mirrors verification_vouch_rules (single-row config governing the vouching
 * gate). `id` is always TRUE (enforces the singleton).
 */
export type VouchRules = Readonly<{
  id: true;
  required_peer_vouches: number;
  required_client_vouches: number;
  client_recency_days: number;
  invite_expiry_days: number;
  resend_cooldown_hours: number;
  gate_enabled: boolean;
  updated_at: string | null;
  updated_by: string | null;
}>;

/** Mirrors provider_badges table */
export type ProviderBadge = Readonly<{
  id: string;
  provider_id: string;
  badge_type: string;
  badge_label: string;
  description: string | null;
  earned_at: string;
  expires_at: string | null;
  is_active: boolean;
}>;

/** Mirrors provider_portfolio_items table (Phase 16 extended) */
export type ProviderPortfolioItem = Readonly<{
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  category: string | null;
  before_image_path: string | null;
  after_image_path: string | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}>;

/** Mirrors provider_invoices table */
export type ProviderInvoice = Readonly<{
  id: string;
  provider_id: string;
  booking_id: string | null;
  client_id: string;
  invoice_number: string;
  line_items: InvoiceLineItem[];
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}>;

/** Mirrors stripe_connect_accounts table */
export type StripeConnectAccount = Readonly<{
  id: string;
  provider_id: string;
  stripe_account_id: string;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  kyc_status: string | null;
  last_payout_amount: number | null; // pence (bigint)
  last_payout_status: string | null;
  last_payout_at: string | null;
  created_at: string;
  updated_at: string;
}>;

/** Mirrors provider_boosts table */
export type ProviderBoost = Readonly<{
  id: string;
  provider_id: string;
  boost_type: BoostType;
  coverage_area: string | null;
  duration_days: number;
  starts_at: string;
  ends_at: string;
  stripe_payment_intent_id: string | null;
  amount_paid: number | null;
  is_active: boolean;
  created_at: string;
}>;

/** Mirrors provider_referrals table */
export type ProviderReferral = Readonly<{
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referral_code: string;
  status: ReferralStatus;
  reward_amount: number | null;
  rewarded_at: string | null;
  created_at: string;
}>;

/** Mirrors provider_service_areas table */
export type ProviderServiceArea = Readonly<{
  id: string;
  provider_id: string;
  name: string | null;
  zone: unknown; // GeoJSON geometry — use as-is or cast to GeoJSON types
  radius_km: number | null;
  zone_type: ZoneType;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}>;

/** Mirrors stripe_events table */
export type StripeEvent = Readonly<{
  id: string;
  event_id: string;
  event_type: string;
  processed_at: string;
  account_id: string | null;
  created_at: string;
}>;

/** Mirrors provider_analytics_daily table */
export type ProviderAnalyticsDaily = Readonly<{
  id: string;
  provider_id: string;
  date: string; // ISO date string YYYY-MM-DD
  profile_views: number;
  enquiries_received: number;
  quotes_sent: number;
  bookings_won: number;
  earnings_pence: number;
  created_at: string;
}>;

// -- Aggregate / view types ------------------------------------------------

/** KPI summary for the provider dashboard home */
export type ProviderDashboardStats = Readonly<{
  new_leads_count: number;
  active_jobs_count: number;
  pending_reviews_count: number;
  monthly_earnings_pence: number;
  verification_complete_pct: number; // 0–100
}>;

/** Recent activity feed item */
export type RecentActivityItem = Readonly<{
  id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
  link?: string;
}>;

/** Upcoming job entry shown on dashboard home */
export type UpcomingJob = Readonly<{
  id: string;
  title: string;
  client_name: string;
  scheduled_date: string;
  status: string;
  total_amount_pence: number;
}>;

/** Conversion funnel metrics */
export type ConversionFunnel = Readonly<{
  viewed: number;
  enquired: number;
  quoted: number;
  booked: number;
}>;
