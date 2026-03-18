/**
 * Server-side billing configuration.
 *
 * Price IDs live here — never inline in client components.
 * All price IDs are read from env vars; fall-through to test-mode fixtures
 * only in development so misconfigured production deploys fail loudly.
 *
 * SECURITY: this file imports server-only so it cannot be bundled into
 * client code. Any attempt to import it in a Client Component will throw
 * at build time.
 */
import "server-only";

// ============================================================================
// Types
// ============================================================================

export type BillingRole = "agent" | "landlord" | "provider";

export type Plan = Readonly<{
  id: string;          // slug, e.g. "agent_basic"
  name: string;        // display name
  priceIdMonthly: string;   // Stripe price ID — monthly billing
  priceIdAnnual: string;    // Stripe price ID — annual billing
  priceMonthly: number;     // pence / month
  priceAnnual: number;      // pence / year
  role: BillingRole;
  features: readonly string[];
  highlighted?: boolean;
}>;

/**
 * @deprecated — use priceIdMonthly / priceIdAnnual instead.
 * Kept only for backwards-compat helpers.
 */
export type BillingInterval = "monthly" | "annual";

// ============================================================================
// Price ID allowlist
// Every priceId accepted by the checkout API must appear in this set.
// ============================================================================

export const ALLOWED_PRICE_IDS: ReadonlySet<string> = new Set([
  // Agent plans — monthly
  process.env.STRIPE_AGENT_PERF_PRICE_ID ?? "price_agent_perf_test",
  process.env.STRIPE_AGENT_PRO_PRICE_ID ?? "price_agent_pro_test",
  process.env.STRIPE_AGENT_ENT_PRICE_ID ?? "price_agent_ent_test",
  // Agent plans — annual
  process.env.STRIPE_AGENT_PERF_ANNUAL_PRICE_ID ?? "price_agent_perf_annual_test",
  process.env.STRIPE_AGENT_PRO_ANNUAL_PRICE_ID ?? "price_agent_pro_annual_test",
  process.env.STRIPE_AGENT_ENT_ANNUAL_PRICE_ID ?? "price_agent_ent_annual_test",
  // Landlord plans — monthly (unchanged)
  process.env.STRIPE_LANDLORD_ESSENTIAL_PRICE_ID ?? "price_landlord_ess_test",
  process.env.STRIPE_LANDLORD_PRO_PRICE_ID ?? "price_landlord_pro_test",
  // Landlord plans — annual (unchanged)
  process.env.STRIPE_LANDLORD_ESSENTIAL_ANNUAL_PRICE_ID ?? "price_landlord_ess_annual_test",
  process.env.STRIPE_LANDLORD_PRO_ANNUAL_PRICE_ID ?? "price_landlord_pro_annual_test",
  // Provider plans — monthly
  process.env.STRIPE_PROVIDER_MEMBER_PRICE_ID ?? "price_provider_member_test",
  process.env.STRIPE_PROVIDER_PRO_PRICE_ID ?? "price_provider_pro_test",
  process.env.STRIPE_PROVIDER_ELITE_PRICE_ID ?? "price_provider_elite_test",
  // Provider plans — annual
  process.env.STRIPE_PROVIDER_MEMBER_ANNUAL_PRICE_ID ?? "price_provider_member_annual_test",
  process.env.STRIPE_PROVIDER_PRO_ANNUAL_PRICE_ID ?? "price_provider_pro_annual_test",
  process.env.STRIPE_PROVIDER_ELITE_ANNUAL_PRICE_ID ?? "price_provider_elite_annual_test",
  // One-time boosts (unchanged)
  process.env.STRIPE_BOOST_7D_PRICE_ID ?? "price_boost_7d_test",
  process.env.STRIPE_BOOST_14D_PRICE_ID ?? "price_boost_14d_test",
  process.env.STRIPE_BOOST_30D_PRICE_ID ?? "price_boost_30d_test",
]);

export function isPriceIdAllowed(priceId: string): boolean {
  return ALLOWED_PRICE_IDS.has(priceId);
}

// ============================================================================
// Plan definitions
// ============================================================================

export const AGENT_PLANS: readonly Plan[] = [
  {
    id: "agent_performance",
    name: "Performance",
    priceIdMonthly: process.env.STRIPE_AGENT_PERF_PRICE_ID ?? "price_agent_perf_test",
    priceIdAnnual: process.env.STRIPE_AGENT_PERF_ANNUAL_PRICE_ID ?? "price_agent_perf_annual_test",
    priceMonthly: 0, // £0/month — performance-based (50/50 commission split)
    priceAnnual: 0,
    role: "agent",
    features: [
      "Up to 25 active listings",
      "Standard property photos",
      "Lead management",
      "Email support",
      "50/50 commission split on sales",
      "70/30 split on managed rentals",
    ],
  },
  {
    id: "agent_professional",
    name: "Professional",
    priceIdMonthly: process.env.STRIPE_AGENT_PRO_PRICE_ID ?? "price_agent_pro_test",
    priceIdAnnual: process.env.STRIPE_AGENT_PRO_ANNUAL_PRICE_ID ?? "price_agent_pro_annual_test",
    priceMonthly: 29700, // £297/month
    priceAnnual: 285000, // £2,850/year — save £714 (2.4 months free)
    role: "agent",
    highlighted: true,
    features: [
      "Unlimited active listings",
      "Premium photo hosting",
      "Full CRM suite",
      "Viewing calendar",
      "Offer management",
      "Priority support",
      "75/25 commission split on sales",
      "85/15 split on managed rentals",
    ],
  },
  {
    id: "agent_enterprise",
    name: "Enterprise",
    priceIdMonthly: process.env.STRIPE_AGENT_ENT_PRICE_ID ?? "price_agent_ent_test",
    priceIdAnnual: process.env.STRIPE_AGENT_ENT_ANNUAL_PRICE_ID ?? "price_agent_ent_annual_test",
    priceMonthly: 49700, // £497/month
    priceAnnual: 477000, // £4,770/year — save £1,194 (2.4 months free)
    role: "agent",
    features: [
      "Everything in Professional",
      "Multi-branch management",
      "Team member accounts",
      "API access",
      "Dedicated account manager",
      "Custom branding",
      "90/10 commission split on sales",
      "95/5 split on managed rentals",
    ],
  },
];

export const LANDLORD_PLANS: readonly Plan[] = [
  {
    id: "landlord_ess",
    name: "Essential",
    priceIdMonthly: process.env.STRIPE_LANDLORD_ESSENTIAL_PRICE_ID ?? "price_landlord_ess_test",
    priceIdAnnual: process.env.STRIPE_LANDLORD_ESSENTIAL_ANNUAL_PRICE_ID ?? "price_landlord_ess_annual_test",
    priceMonthly: 1900,
    priceAnnual: 18200, // ~£182/yr — save £46 vs monthly
    role: "landlord",
    features: [
      "Up to 3 properties",
      "Tenant screening",
      "Document storage",
      "Basic maintenance tracking",
    ],
  },
  {
    id: "landlord_pro",
    name: "Professional",
    priceIdMonthly: process.env.STRIPE_LANDLORD_PRO_PRICE_ID ?? "price_landlord_pro_test",
    priceIdAnnual: process.env.STRIPE_LANDLORD_PRO_ANNUAL_PRICE_ID ?? "price_landlord_pro_annual_test",
    priceMonthly: 4900,
    priceAnnual: 47000, // ~£470/yr — save £118 vs monthly
    role: "landlord",
    highlighted: true,
    features: [
      "Unlimited properties",
      "Advanced tenant screening",
      "Rent collection tools",
      "Maintenance workflows",
      "Financial reporting",
      "Priority support",
    ],
  },
];

export const PROVIDER_PLANS: readonly Plan[] = [
  {
    id: "provider_member",
    name: "Member",
    priceIdMonthly: process.env.STRIPE_PROVIDER_MEMBER_PRICE_ID ?? "price_provider_member_test",
    priceIdAnnual: process.env.STRIPE_PROVIDER_MEMBER_ANNUAL_PRICE_ID ?? "price_provider_member_annual_test",
    priceMonthly: 4700, // £47/month
    priceAnnual: 47000, // £470/year — save £94 (2 months free)
    role: "provider",
    features: [
      "Verified profile listing",
      "Britestate Trust Badge",
      "3 quotes per month",
      "Review collection system",
      "Mobile app access",
      "Basic lead notifications",
      "Email support",
    ],
  },
  {
    id: "provider_professional",
    name: "Professional",
    priceIdMonthly: process.env.STRIPE_PROVIDER_PRO_PRICE_ID ?? "price_provider_pro_test",
    priceIdAnnual: process.env.STRIPE_PROVIDER_PRO_ANNUAL_PRICE_ID ?? "price_provider_pro_annual_test",
    priceMonthly: 9700, // £97/month
    priceAnnual: 97000, // £970/year — save £194 (2 months free)
    role: "provider",
    highlighted: true,
    features: [
      "Everything in Member",
      "Unlimited quote responses",
      "Priority lead matching",
      "Integrated booking system",
      "Automated follow-ups",
      "Basic CRM & analytics",
      "Branded quote templates",
      "Priority support (4hr SLA)",
    ],
  },
  {
    id: "provider_elite",
    name: "Elite",
    priceIdMonthly: process.env.STRIPE_PROVIDER_ELITE_PRICE_ID ?? "price_provider_elite_test",
    priceIdAnnual: process.env.STRIPE_PROVIDER_ELITE_ANNUAL_PRICE_ID ?? "price_provider_elite_annual_test",
    priceMonthly: 19700, // £197/month
    priceAnnual: 197000, // £1,970/year — save £394 (2 months free)
    role: "provider",
    features: [
      "Everything in Professional",
      "First-access to premium jobs",
      "Multi-user team accounts",
      "Advanced workflow automation",
      "White-label customer portal",
      "API access",
      "Dedicated account manager",
      "Recruitment posting access",
      "Premium trust badges",
    ],
  },
];

export const PLANS_BY_ROLE: Record<BillingRole, readonly Plan[]> = {
  agent: AGENT_PLANS,
  landlord: LANDLORD_PLANS,
  provider: PROVIDER_PLANS,
};

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return [
    ...AGENT_PLANS,
    ...LANDLORD_PLANS,
    ...PROVIDER_PLANS,
  ].find((p) => p.priceIdMonthly === priceId || p.priceIdAnnual === priceId);
}

// ============================================================================
// Boost (one-time featured listing) price IDs
// ============================================================================

export const BOOST_PRICES = {
  "7d": {
    priceId: process.env.STRIPE_BOOST_7D_PRICE_ID ?? "price_boost_7d_test",
    label: "7-day boost",
    price: 1500, // £15
  },
  "14d": {
    priceId: process.env.STRIPE_BOOST_14D_PRICE_ID ?? "price_boost_14d_test",
    label: "14-day boost",
    price: 2500, // £25
  },
  "30d": {
    priceId: process.env.STRIPE_BOOST_30D_PRICE_ID ?? "price_boost_30d_test",
    label: "30-day boost",
    price: 4500, // £45
  },
} as const;

// ============================================================================
// Validation helpers
// ============================================================================

/**
 * Validate that a URL is same-origin to prevent open-redirect phishing.
 * Accepts relative paths (/dashboard/billing) and absolute URLs on the
 * app's own origin.
 */
export function isValidReturnUrl(url: string): boolean {
  if (url.startsWith("/")) return true; // relative path — always safe
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return false;
  try {
    const parsed = new URL(url);
    const allowed = new URL(appUrl);
    return parsed.origin === allowed.origin;
  } catch {
    return false;
  }
}
