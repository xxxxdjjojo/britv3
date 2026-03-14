/**
 * Agent domain types — mirrors the database schema in
 * supabase/migrations/20260313_agent_dashboard.sql.
 * All field names and constraints match the SQL exactly.
 * All monetary values are in pence (number = BIGINT in PostgreSQL).
 */

import { z } from "zod";

// ============================================================================
// Enum constants (mirror SQL CHECK constraints)
// ============================================================================

export const LEAD_STAGES = [
  "new_enquiry",
  "qualified",
  "viewing_booked",
  "offer_made",
  "closed",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const SALE_STAGES = [
  "offer_accepted",
  "memorandum_of_sale",
  "solicitors_instructed",
  "searches",
  "survey",
  "mortgage",
  "exchange",
  "completion",
] as const;
export type SaleStage = (typeof SALE_STAGES)[number];

export const TEAM_ROLES = [
  "admin",
  "senior_negotiator",
  "negotiator",
  "lettings_manager",
  "viewer",
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const OFFER_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "countered",
  "withdrawn",
] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const AIP_STATUSES = [
  "not_provided",
  "provided",
  "verified",
] as const;
export type AipStatus = (typeof AIP_STATUSES)[number];

export const COMMISSION_STATUSES = [
  "pending",
  "invoiced",
  "paid",
] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const CLIENT_TYPES = [
  "buyer",
  "seller",
  "landlord",
  "tenant",
] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const LEAD_SOURCES = [
  "website",
  "portal",
  "phone",
  "walk_in",
  "referral",
  "other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const FEED_PROVIDERS = [
  "reapit",
  "alto",
  "jupix",
] as const;
export type FeedProvider = (typeof FEED_PROVIDERS)[number];

export const SYNC_STATUSES = [
  "disconnected",
  "connected",
  "syncing",
  "error",
] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

export const TEAM_MEMBER_STATUSES = [
  "active",
  "inactive",
  "pending",
] as const;
export type TeamMemberStatus = (typeof TEAM_MEMBER_STATUSES)[number];

export const PRICE_OPINIONS = [
  "too_high",
  "about_right",
  "good_value",
] as const;
export type PriceOpinion = (typeof PRICE_OPINIONS)[number];

export const LIKELIHOOD_TO_OFFER_OPTIONS = [
  "unlikely",
  "possible",
  "likely",
  "very_likely",
] as const;
export type LikelihoodToOffer = (typeof LIKELIHOOD_TO_OFFER_OPTIONS)[number];

export const REPORT_TYPES = [
  "listing_performance",
  "viewing_summary",
  "market_analysis",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

// ============================================================================
// Row types (match table columns exactly)
// ============================================================================

export type AgentAgencyProfile = Readonly<{
  id: string;
  agent_id: string;
  agency_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postcode: string | null;
  description: string | null;
  specializations: string[];
  coverage_areas: string[];
  logo_url: string | null;
  brand_primary_colour: string | null;
  brand_secondary_colour: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}>;

export type AgentLead = Readonly<{
  id: string;
  agent_id: string;
  property_id: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  stage: LeadStage;
  source: LeadSource;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}>;

export type AgentLeadActivity = Readonly<{
  id: string;
  lead_id: string;
  actor_id: string;
  activity_type: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}>;

export type AgentOffer = Readonly<{
  id: string;
  agent_id: string;
  property_id: string;
  lead_id: string | null;
  buyer_name: string;
  buyer_email: string | null;
  buyer_phone: string | null;
  amount: number;
  conditions: string | null;
  solicitor_details: Record<string, unknown>;
  aip_status: AipStatus;
  status: OfferStatus;
  counter_amount: number | null;
  vendor_notified: boolean;
  created_at: string;
  updated_at: string;
}>;

export type AgentOfferHistory = Readonly<{
  id: string;
  offer_id: string;
  previous_status: string | null;
  new_status: string;
  actor_id: string;
  note: string | null;
  created_at: string;
}>;

export type AgentSaleProgression = Readonly<{
  id: string;
  agent_id: string;
  offer_id: string;
  property_id: string;
  stage: SaleStage;
  expected_completion_date: string | null;
  solicitor_buyer: Record<string, unknown>;
  solicitor_seller: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}>;

export type AgentCommission = Readonly<{
  id: string;
  agent_id: string;
  property_id: string;
  sale_price: number;
  commission_rate: number;
  commission_amount: number;
  status: CommissionStatus;
  paid_at: string | null;
  created_at: string;
}>;

export type AgentBranch = Readonly<{
  id: string;
  agent_id: string;
  name: string;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postcode: string | null;
  phone: string | null;
  email: string | null;
  is_head_office: boolean;
  created_at: string;
  updated_at: string;
}>;

export type AgentTeamMember = Readonly<{
  id: string;
  agent_id: string;
  user_id: string;
  branch_id: string | null;
  role: TeamRole;
  status: TeamMemberStatus;
  email: string | null;
  name: string | null;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
}>;

export type AgentCrmClient = Readonly<{
  id: string;
  agent_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  client_type: ClientType;
  preferences: Record<string, unknown>;
  notes: string | null;
  tags: string[];
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
}>;

export type AgentViewingSlot = Readonly<{
  id: string;
  agent_id: string;
  property_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  booked_by: string | null;
  notes: string | null;
  created_at: string;
}>;

export type AgentViewingFeedback = Readonly<{
  id: string;
  agent_id: string;
  viewing_slot_id: string;
  buyer_name: string | null;
  interest_level: number | null;
  price_opinion: PriceOpinion | null;
  likelihood_to_offer: LikelihoodToOffer | null;
  comments: string | null;
  created_at: string;
}>;

export type AgentApiKey = Readonly<{
  id: string;
  agent_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  rate_limit_per_minute: number;
  last_used_at: string | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  revoked_at: string | null;
}>;

export type AgentFeedIntegration = Readonly<{
  id: string;
  agent_id: string;
  provider: FeedProvider;
  api_key_encrypted: string | null;
  webhook_url: string | null;
  sync_status: SyncStatus;
  last_sync_at: string | null;
  field_mapping: Record<string, unknown>;
  error_log: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}>;

export type AgentVendorReport = Readonly<{
  id: string;
  agent_id: string;
  property_id: string;
  report_type: ReportType;
  data: Record<string, unknown>;
  generated_at: string;
  pdf_url: string | null;
}>;

// ============================================================================
// KPI response type (matches get_agent_dashboard_kpis RPC)
// ============================================================================

export type AgentDashboardKpis = Readonly<{
  active_listings_count: number;
  new_leads_count: number;
  viewings_this_week_count: number;
  pending_offers_count: number;
  performance_score: number;
}>;

// ============================================================================
// Form / input types for create and update operations
// ============================================================================

export type CreateLeadInput = Readonly<{
  property_id?: string | null;
  contact_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  stage?: LeadStage;
  source?: LeadSource;
  assigned_to?: string | null;
  notes?: string | null;
}>;

export type UpdateLeadInput = Partial<Omit<CreateLeadInput, "property_id">> &
  Readonly<{ stage?: LeadStage }>;

export type CreateOfferInput = Readonly<{
  property_id: string;
  lead_id?: string | null;
  buyer_name: string;
  buyer_email?: string | null;
  buyer_phone?: string | null;
  amount: number;
  conditions?: string | null;
  solicitor_details?: Record<string, unknown>;
  aip_status?: AipStatus;
}>;

export type UpdateOfferInput = Readonly<{
  status?: OfferStatus;
  counter_amount?: number | null;
  vendor_notified?: boolean;
  aip_status?: AipStatus;
  conditions?: string | null;
  solicitor_details?: Record<string, unknown>;
}>;

export type CreateTeamMemberInput = Readonly<{
  user_id: string;
  branch_id?: string | null;
  role: TeamRole;
  email?: string | null;
  name?: string | null;
}>;

export type UpdateTeamMemberInput = Readonly<{
  role?: TeamRole;
  status?: TeamMemberStatus;
  branch_id?: string | null;
}>;

export type CreateBranchInput = Readonly<{
  name: string;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  postcode?: string | null;
  phone?: string | null;
  email?: string | null;
  is_head_office?: boolean;
}>;

export type UpdateBranchInput = Partial<CreateBranchInput>;

export type CreateCrmClientInput = Readonly<{
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  client_type: ClientType;
  preferences?: Record<string, unknown>;
  notes?: string | null;
  tags?: string[];
}>;

export type UpdateCrmClientInput = Partial<CreateCrmClientInput> &
  Readonly<{ last_contact_at?: string | null }>;

export type AgencyProfileInput = Readonly<{
  agency_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  postcode?: string | null;
  description?: string | null;
  specializations?: string[];
  coverage_areas?: string[];
  logo_url?: string | null;
  brand_primary_colour?: string | null;
  brand_secondary_colour?: string | null;
  social_facebook?: string | null;
  social_twitter?: string | null;
  social_instagram?: string | null;
  social_linkedin?: string | null;
  website_url?: string | null;
}>;

export type CreateViewingSlotInput = Readonly<{
  property_id: string;
  start_time: string;
  end_time: string;
  notes?: string | null;
}>;

export type CreateViewingFeedbackInput = Readonly<{
  viewing_slot_id: string;
  buyer_name?: string | null;
  interest_level?: number | null;
  price_opinion?: PriceOpinion | null;
  likelihood_to_offer?: LikelihoodToOffer | null;
  comments?: string | null;
}>;

export type CreateSaleProgressionInput = Readonly<{
  offer_id: string;
  property_id: string;
  stage?: SaleStage;
  expected_completion_date?: string | null;
  solicitor_buyer?: Record<string, unknown>;
  solicitor_seller?: Record<string, unknown>;
  notes?: string | null;
}>;

export type UpdateSaleProgressionInput = Readonly<{
  stage?: SaleStage;
  expected_completion_date?: string | null;
  solicitor_buyer?: Record<string, unknown>;
  solicitor_seller?: Record<string, unknown>;
  notes?: string | null;
}>;

// ============================================================================
// Zod schemas for validation
// ============================================================================

export const createLeadSchema = z.object({
  property_id: z.string().uuid().nullable().optional(),
  contact_name: z.string().min(1, "Contact name is required"),
  contact_email: z.string().email("Invalid email").nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  stage: z.enum(LEAD_STAGES).default("new_enquiry"),
  source: z.enum(LEAD_SOURCES).default("other"),
  assigned_to: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateLeadSchema = z.object({
  contact_name: z.string().min(1).optional(),
  contact_email: z.string().email().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  stage: z.enum(LEAD_STAGES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const createOfferSchema = z.object({
  property_id: z.string().uuid("Property is required"),
  lead_id: z.string().uuid().nullable().optional(),
  buyer_name: z.string().min(1, "Buyer name is required"),
  buyer_email: z.string().email("Invalid email").nullable().optional(),
  buyer_phone: z.string().nullable().optional(),
  amount: z.number().int().positive("Offer amount must be positive"),
  conditions: z.string().nullable().optional(),
  solicitor_details: z.record(z.string(), z.unknown()).optional(),
  aip_status: z.enum(AIP_STATUSES).default("not_provided"),
});

export const createTeamMemberSchema = z.object({
  user_id: z.string().uuid("Valid user ID is required"),
  branch_id: z.string().uuid().nullable().optional(),
  role: z.enum(TEAM_ROLES),
  email: z.string().email("Invalid email").nullable().optional(),
  name: z.string().nullable().optional(),
});

export const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address_line_1: z.string().nullable().optional(),
  address_line_2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postcode: z
    .string()
    .regex(/^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i, "Invalid UK postcode")
    .nullable()
    .optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Invalid email").nullable().optional(),
  is_head_office: z.boolean().default(false),
});

export const createCrmClientSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email").nullable().optional(),
  phone: z.string().nullable().optional(),
  client_type: z.enum(CLIENT_TYPES),
  preferences: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
});

export const agencyProfileSchema = z.object({
  agency_name: z.string().min(1, "Agency name is required"),
  contact_email: z.string().email("Invalid email").nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  address_line_1: z.string().nullable().optional(),
  address_line_2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postcode: z
    .string()
    .regex(/^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i, "Invalid UK postcode")
    .nullable()
    .optional(),
  description: z.string().nullable().optional(),
  specializations: z.array(z.string()).default([]),
  coverage_areas: z.array(z.string()).default([]),
  logo_url: z.string().url("Invalid URL").nullable().optional(),
  brand_primary_colour: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex colour (#RRGGBB)")
    .nullable()
    .optional(),
  brand_secondary_colour: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex colour (#RRGGBB)")
    .nullable()
    .optional(),
  social_facebook: z.string().url("Invalid URL").nullable().optional(),
  social_twitter: z.string().url("Invalid URL").nullable().optional(),
  social_instagram: z.string().url("Invalid URL").nullable().optional(),
  social_linkedin: z.string().url("Invalid URL").nullable().optional(),
  website_url: z.string().url("Invalid URL").nullable().optional(),
});
