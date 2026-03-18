// src/types/entitlements.ts

/**
 * Every gatable feature in the platform.
 * Add new keys here when new features need plan-based gating.
 *
 * Naming: DOMAIN_CAPABILITY (e.g., QUOTES_UNLIMITED, LEADS_PRIORITY)
 */
export const FEATURE_KEYS = [
  // Provider features
  "QUOTES_BASIC",           // 3 quotes/month (Member)
  "QUOTES_UNLIMITED",       // Unlimited quotes (Professional+)
  "LEADS_STANDARD",         // Standard lead notifications
  "LEADS_PRIORITY",         // Priority lead matching (Professional+)
  "LEADS_FIRST_ACCESS",     // First-access premium leads (Elite)
  "PROFILE_BASIC",          // Basic profile listing
  "PROFILE_FEATURED",       // Featured profile listing (Professional+)
  "PROFILE_PREMIUM_BADGE",  // Premium trust badges (Elite)
  "BOOKING_SYSTEM",         // Integrated booking (Professional+)
  "CRM_BASIC",              // Basic CRM (Professional+)
  "CRM_ADVANCED",           // Advanced CRM + analytics (Elite)
  "FOLLOW_UPS_AUTO",        // Automated follow-ups (Professional+)
  "ANALYTICS_BASIC",        // Basic analytics
  "ANALYTICS_ADVANCED",     // Advanced analytics (Professional+)
  "SUPPORT_EMAIL",          // Email support
  "SUPPORT_PRIORITY",       // Priority support 4hr SLA (Professional+)
  "SUPPORT_DEDICATED",      // Dedicated account manager (Elite)
  "TEAM_MULTI_USER",        // Multi-user team accounts (Elite)
  "API_ACCESS",             // API access (Elite)
  "WHITE_LABEL",            // White-label portal (Elite)
  "RECRUITMENT",            // Recruitment posting (Elite)
  // Agent features
  "LISTINGS_25",            // Up to 25 listings (Performance)
  "LISTINGS_UNLIMITED",     // Unlimited listings (Professional+)
  "LISTINGS_MULTI_BRANCH",  // Multi-branch management (Enterprise)
  "AGENT_CRM",              // Full CRM suite (Professional+)
  "AGENT_VIEWING_CALENDAR", // Viewing calendar (Professional+)
  "AGENT_OFFER_MGMT",      // Offer management (Professional+)
  "AGENT_CUSTOM_BRANDING",  // Custom branding (Enterprise)
  "AGENT_TEAM_ACCOUNTS",    // Team member accounts (Enterprise)
  "AGENT_API_ACCESS",       // API access (Enterprise)
  // Landlord features
  "PROPERTIES_3",           // Up to 3 properties (Essential)
  "PROPERTIES_UNLIMITED",   // Unlimited properties (Professional)
  "TENANT_SCREENING_BASIC", // Basic tenant screening
  "TENANT_SCREENING_ADV",   // Advanced tenant screening (Professional)
  "RENT_COLLECTION",        // Rent collection tools (Professional)
  "MAINTENANCE_BASIC",      // Basic maintenance tracking
  "MAINTENANCE_WORKFLOWS",  // Full maintenance workflows (Professional)
  "FINANCIAL_REPORTING",    // Financial reporting (Professional)
  // Universal
  "REFERRAL_PROGRAM",       // Access to referral program (all paid)
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export type UserEntitlements = {
  planId: string | null;
  planName: string | null;
  features: ReadonlySet<FeatureKey>;
};
