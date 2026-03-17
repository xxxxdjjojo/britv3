import { z } from "zod";

// ============================================================================
// Enum constant arrays
// ============================================================================

export const LEAD_STAGES = [
  "new_enquiry",
  "qualified",
  "viewing_booked",
  "offer_made",
  "closed",
] as const;

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

export const TEAM_ROLES = [
  "admin",
  "senior_negotiator",
  "negotiator",
  "lettings_manager",
  "viewer",
] as const;

export const OFFER_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "countered",
  "withdrawn",
] as const;

export const AIP_STATUSES = [
  "not_provided",
  "provided",
  "verified",
] as const;

export const COMMISSION_STATUSES = [
  "pending",
  "invoiced",
  "paid",
] as const;

export const CLIENT_TYPES = [
  "buyer",
  "seller",
  "landlord",
  "tenant",
] as const;

export const LEAD_SOURCES = [
  "website",
  "portal",
  "phone",
  "walk_in",
  "referral",
  "other",
] as const;

export const FEED_PROVIDERS = [
  "reapit",
  "alto",
  "jupix",
] as const;

export const SYNC_STATUSES = [
  "disconnected",
  "connected",
  "syncing",
  "error",
] as const;

export const PRICE_OPINIONS = [
  "too_high",
  "about_right",
  "good_value",
] as const;

export const LIKELIHOOD_TO_OFFER = [
  "unlikely",
  "possible",
  "likely",
  "very_likely",
] as const;

export const REPORT_TYPES = [
  "listing_performance",
  "viewing_summary",
  "market_analysis",
] as const;

export const TEAM_MEMBER_STATUSES = [
  "active",
  "inactive",
  "pending",
] as const;

// ============================================================================
// Derived union types
// ============================================================================

export type LeadStage = (typeof LEAD_STAGES)[number];
export type SaleStage = (typeof SALE_STAGES)[number];
export type TeamRole = (typeof TEAM_ROLES)[number];
export type OfferStatus = (typeof OFFER_STATUSES)[number];
export type AipStatus = (typeof AIP_STATUSES)[number];
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];
export type ClientType = (typeof CLIENT_TYPES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type FeedProvider = (typeof FEED_PROVIDERS)[number];
export type SyncStatus = (typeof SYNC_STATUSES)[number];
export type PriceOpinion = (typeof PRICE_OPINIONS)[number];
export type LikelihoodToOffer = (typeof LIKELIHOOD_TO_OFFER)[number];
export type ReportType = (typeof REPORT_TYPES)[number];
export type TeamMemberStatus = (typeof TEAM_MEMBER_STATUSES)[number];

// ============================================================================
// Table row types (matching SQL column names)
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

export type AgentLeadActivity = Readonly<{
  id: string;
  lead_id: string;
  actor_id: string;
  activity_type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
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
  solicitor_details: Record<string, unknown> | null;
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
  solicitor_buyer: Record<string, unknown> | null;
  solicitor_seller: Record<string, unknown> | null;
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

export type AgentTeamMember = Readonly<{
  id: string;
  agent_id: string;
  user_id: string;
  branch_id: string | null;
  role: TeamRole;
  status: TeamMemberStatus;
  email: string;
  name: string;
  invited_at: string;
  joined_at: string | null;
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

export type AgentCrmClient = Readonly<{
  id: string;
  agent_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  client_type: ClientType;
  preferences: Record<string, unknown> | null;
  notes: string | null;
  tags: string[] | null;
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
  viewing_slot_id: string | null;
  buyer_name: string;
  interest_level: number;
  price_opinion: PriceOpinion;
  likelihood_to_offer: LikelihoodToOffer;
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
  field_mapping: Record<string, unknown> | null;
  error_log: Record<string, unknown>[] | null;
  created_at: string;
  updated_at: string;
}>;

export type AgentVendorReport = Readonly<{
  id: string;
  agent_id: string;
  property_id: string;
  report_type: ReportType;
  data: Record<string, unknown> | null;
  generated_at: string;
  pdf_url: string | null;
}>;

export type AgentDashboardKpis = Readonly<{
  active_listings_count: number;
  new_leads_count: number;
  viewings_this_week_count: number;
  pending_offers_count: number;
  performance_score: number;
}>;

// ============================================================================
// Form input types
// ============================================================================

export type CreateLeadInput = {
  property_id?: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  stage?: LeadStage;
  source?: LeadSource;
  assigned_to?: string;
  notes?: string;
};

export type UpdateLeadInput = Partial<CreateLeadInput>;

export type CreateOfferInput = {
  property_id: string;
  lead_id?: string;
  buyer_name: string;
  buyer_email?: string;
  buyer_phone?: string;
  amount: number;
  conditions?: string;
  solicitor_details?: Record<string, unknown>;
  aip_status?: AipStatus;
};

export type CreateTeamMemberInput = {
  user_id: string;
  email: string;
  name: string;
  role: TeamRole;
  branch_id?: string;
};

export type CreateBranchInput = {
  name: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  is_head_office?: boolean;
};

export type CreateCrmClientInput = {
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  client_type: ClientType;
  preferences?: Record<string, unknown>;
  notes?: string;
  tags?: string[];
};

// ============================================================================
// Zod validation schemas
// ============================================================================

export const createLeadSchema = z.object({
  property_id: z.string().uuid().optional(),
  contact_name: z.string().min(1),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  stage: z.enum(LEAD_STAGES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  assigned_to: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const createOfferSchema = z.object({
  property_id: z.string().uuid(),
  lead_id: z.string().uuid().optional(),
  buyer_name: z.string().min(1),
  buyer_email: z.string().email().optional(),
  buyer_phone: z.string().optional(),
  amount: z.number().int().positive(),
  conditions: z.string().optional(),
  solicitor_details: z.record(z.string(), z.unknown()).optional(),
  aip_status: z.enum(AIP_STATUSES).optional(),
});

export const createTeamMemberSchema = z.object({
  user_id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(TEAM_ROLES),
  branch_id: z.string().uuid().optional(),
});

export const createBranchSchema = z.object({
  name: z.string().min(1),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  is_head_office: z.boolean().optional(),
});

export const createCrmClientSchema = z.object({
  user_id: z.string().uuid().optional(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  client_type: z.enum(CLIENT_TYPES),
  preferences: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const agencyProfileSchema = z.object({
  agency_name: z.string().min(1),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  description: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  coverage_areas: z.array(z.string()).optional(),
  logo_url: z.string().url().optional(),
  brand_primary_colour: z.string().optional(),
  brand_secondary_colour: z.string().optional(),
  social_facebook: z.union([z.string().url(), z.literal("")]).optional(),
  social_twitter: z.union([z.string().url(), z.literal("")]).optional(),
  social_instagram: z.union([z.string().url(), z.literal("")]).optional(),
  social_linkedin: z.union([z.string().url(), z.literal("")]).optional(),
  website_url: z.union([z.string().url(), z.literal("")]).optional(),
});
