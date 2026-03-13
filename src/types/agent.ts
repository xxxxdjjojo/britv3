/**
 * Estate Agent domain types -- mirrors the database schema in
 * 20260313_agent_dashboard.sql.
 * All field names and constraints match the SQL exactly.
 */

import { z } from "zod";

// -- Enum constants (mirror SQL enums) ----------------------------------------

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

export const PRICE_OPINIONS = [
  "too_high",
  "about_right",
  "good_value",
] as const;
export type PriceOpinion = (typeof PRICE_OPINIONS)[number];

export const LIKELIHOOD_TO_OFFER = [
  "unlikely",
  "possible",
  "likely",
  "very_likely",
] as const;
export type LikelihoodToOffer = (typeof LIKELIHOOD_TO_OFFER)[number];

export const INTEREST_LEVELS = [1, 2, 3, 4, 5] as const;
export type InterestLevel = (typeof INTEREST_LEVELS)[number];

export const REPORT_TYPES = [
  "listing_performance",
  "viewing_summary",
  "market_analysis",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const MEMBER_STATUSES = [
  "active",
  "inactive",
  "pending",
] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

// -- Table row types ----------------------------------------------------------

/** Mirrors public.agent_agency_profiles table */
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
  specializations: string[] | null;
  coverage_areas: string[] | null;
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

/** Mirrors public.agent_leads table */
export type AgentLead = Readonly<{
  id: string;
  agent_id: string;
  property_id: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  stage: LeadStage;
  source: LeadSource | null;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}>;

/** Mirrors public.agent_lead_activities table */
export type AgentLeadActivity = Readonly<{
  id: string;
  lead_id: string;
  actor_id: string;
  activity_type: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}>;

/** Mirrors public.agent_offers table */
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
  solicitor_details: Record<string, unknown> | null;
  aip_status: AipStatus;
  status: OfferStatus;
  counter_amount: number | null;
  vendor_notified: boolean;
  created_at: string;
  updated_at: string;
}>;

/** Mirrors public.agent_offer_history table */
export type AgentOfferHistory = Readonly<{
  id: string;
  offer_id: string;
  previous_status: string | null;
  new_status: string;
  actor_id: string;
  note: string | null;
  created_at: string;
}>;

/** Mirrors public.agent_sale_progressions table */
export type AgentSaleProgression = Readonly<{
  id: string;
  agent_id: string;
  offer_id: string;
  property_id: string | null;
  stage: SaleStage;
  expected_completion_date: string | null;
  solicitor_buyer: Record<string, unknown> | null;
  solicitor_seller: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}>;

/** Mirrors public.agent_commissions table */
export type AgentCommission = Readonly<{
  id: string;
  agent_id: string;
  property_id: string | null;
  sale_price: number;
  commission_rate: number;
  commission_amount: number;
  status: CommissionStatus;
  paid_at: string | null;
  created_at: string;
}>;

/** Mirrors public.agent_team_members table */
export type AgentTeamMember = Readonly<{
  id: string;
  agent_id: string;
  user_id: string;
  branch_id: string | null;
  role: TeamRole;
  status: MemberStatus;
  email: string;
  name: string;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
}>;

/** Mirrors public.agent_branches table */
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

/** Mirrors public.agent_crm_clients table */
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
  tags: string[] | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
}>;

/** Mirrors public.agent_viewing_slots table */
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

/** Mirrors public.agent_viewing_feedback table */
export type AgentViewingFeedback = Readonly<{
  id: string;
  agent_id: string;
  viewing_slot_id: string;
  buyer_name: string;
  interest_level: InterestLevel;
  price_opinion: PriceOpinion | null;
  likelihood_to_offer: LikelihoodToOffer | null;
  comments: string | null;
  created_at: string;
}>;

/** Mirrors public.agent_api_keys table */
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

/** Mirrors public.agent_feed_integrations table */
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

/** Mirrors public.agent_vendor_reports table */
export type AgentVendorReport = Readonly<{
  id: string;
  agent_id: string;
  property_id: string | null;
  report_type: ReportType;
  data: Record<string, unknown>;
  generated_at: string;
  pdf_url: string | null;
}>;

/** Return type of get_agent_dashboard_kpis RPC */
export type AgentDashboardKpis = Readonly<{
  active_listings_count: number;
  new_leads_count: number;
  viewings_this_week_count: number;
  pending_offers_count: number;
  performance_score: number;
}>;

// -- Form / input types -------------------------------------------------------

export type CreateLeadInput = Readonly<{
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  property_id?: string;
  stage: LeadStage;
  source?: LeadSource;
  assigned_to?: string;
  notes?: string;
}>;

export type UpdateLeadInput = Readonly<{
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  property_id?: string;
  stage?: LeadStage;
  source?: LeadSource;
  assigned_to?: string;
  notes?: string;
}>;

export type CreateOfferInput = Readonly<{
  property_id: string;
  lead_id?: string;
  buyer_name: string;
  buyer_email?: string;
  buyer_phone?: string;
  amount: number;
  conditions?: string;
  solicitor_details?: Record<string, unknown>;
  aip_status?: AipStatus;
}>;

export type CreateTeamMemberInput = Readonly<{
  email: string;
  name: string;
  role: TeamRole;
  branch_id?: string;
}>;

export type CreateBranchInput = Readonly<{
  name: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  is_head_office?: boolean;
}>;

export type CreateCrmClientInput = Readonly<{
  name: string;
  email?: string;
  phone?: string;
  client_type: ClientType;
  preferences?: Record<string, unknown>;
  notes?: string;
  tags?: string[];
}>;

export type UpdateAgencyProfileInput = Readonly<{
  agency_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postcode?: string;
  description?: string;
  specializations?: string[];
  coverage_areas?: string[];
  logo_url?: string;
  brand_primary_colour?: string;
  brand_secondary_colour?: string;
  social_facebook?: string;
  social_twitter?: string;
  social_instagram?: string;
  social_linkedin?: string;
  website_url?: string;
}>;

// -- Zod schemas for form validation ------------------------------------------

export const createLeadSchema = z.object({
  contact_name: z.string().min(1, "Contact name is required"),
  contact_email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  contact_phone: z.string().optional().or(z.literal("")),
  property_id: z.string().uuid().optional().or(z.literal("")),
  stage: z.enum(LEAD_STAGES).default("new_enquiry"),
  source: z.enum(LEAD_SOURCES).optional(),
  assigned_to: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const updateLeadSchema = z.object({
  contact_name: z.string().min(1, "Contact name is required").optional(),
  contact_email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  contact_phone: z.string().optional().or(z.literal("")),
  property_id: z.string().uuid().optional().or(z.literal("")),
  stage: z.enum(LEAD_STAGES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  assigned_to: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const createOfferSchema = z.object({
  property_id: z.string().uuid("Property is required"),
  lead_id: z.string().uuid().optional().or(z.literal("")),
  buyer_name: z.string().min(1, "Buyer name is required"),
  buyer_email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  buyer_phone: z.string().optional().or(z.literal("")),
  amount: z.coerce.number().positive("Offer amount must be positive"),
  conditions: z.string().optional().or(z.literal("")),
  aip_status: z.enum(AIP_STATUSES).default("not_provided"),
});

export const createTeamMemberSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(TEAM_ROLES).default("negotiator"),
  branch_id: z.string().uuid().optional().or(z.literal("")),
});

export const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address_line_1: z.string().optional().or(z.literal("")),
  address_line_2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  postcode: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  is_head_office: z.boolean().default(false),
});

export const createCrmClientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  client_type: z.enum(CLIENT_TYPES),
  notes: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

export const agencyProfileSchema = z.object({
  agency_name: z.string().min(1, "Agency name is required"),
  contact_email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  contact_phone: z.string().optional().or(z.literal("")),
  address_line_1: z.string().optional().or(z.literal("")),
  address_line_2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  postcode: z.string().optional().or(z.literal("")),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
  specializations: z.array(z.string()).optional(),
  coverage_areas: z.array(z.string()).optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  brand_primary_colour: z.string().optional().or(z.literal("")),
  brand_secondary_colour: z.string().optional().or(z.literal("")),
  social_facebook: z.string().url().optional().or(z.literal("")),
  social_twitter: z.string().url().optional().or(z.literal("")),
  social_instagram: z.string().url().optional().or(z.literal("")),
  social_linkedin: z.string().url().optional().or(z.literal("")),
  website_url: z.string().url().optional().or(z.literal("")),
});

// -- Inferred form types from Zod schemas -------------------------------------

export type CreateLeadFormData = z.infer<typeof createLeadSchema>;
export type UpdateLeadFormData = z.infer<typeof updateLeadSchema>;
export type CreateOfferFormData = z.infer<typeof createOfferSchema>;
export type CreateTeamMemberFormData = z.infer<typeof createTeamMemberSchema>;
export type CreateBranchFormData = z.infer<typeof createBranchSchema>;
export type CreateCrmClientFormData = z.infer<typeof createCrmClientSchema>;
export type AgencyProfileFormData = z.infer<typeof agencyProfileSchema>;
