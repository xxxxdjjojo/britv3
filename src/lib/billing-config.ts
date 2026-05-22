/**
 * Server-side billing configuration — Memo Pivot v2 (7 segments).
 *
 * Source of truth for every customer-facing pricing tier. The pricing
 * page, checkout API, webhook handler and Stripe provisioning script all
 * resolve plan metadata through this module.
 *
 * Price IDs come from env vars (populated by
 * `scripts/stripe-setup/create-pricing-v2.ts`). Local fallbacks are used
 * only in development so a misconfigured production deploy fails loud.
 *
 * SECURITY: this file imports "server-only" so it cannot be bundled into
 * client code. Any client-side import throws at build time.
 */
import "server-only";

// ============================================================================
// Types
// ============================================================================

export type Segment =
  | "seller"
  | "agent"
  | "landlord"
  | "provider"
  | "provider_niche"
  | "developer"
  | "trader";

export type PricingType = "subscription" | "one_off";

/** Legacy role enum kept for code paths still using BillingRole. */
export type BillingRole = "agent" | "landlord" | "provider";

export type Plan = Readonly<{
  /** Internal stable identifier — never exposed to Stripe. */
  id: string;
  /** Display name. */
  name: string;
  /** Segment this plan belongs to. */
  segment: Segment;
  /** Subscription vs one-off pricing. */
  pricingType: PricingType;
  /** Stripe Price ID for the monthly cadence (or the single one-off price). */
  priceIdMonthly: string;
  /** Stripe Price ID for the annual cadence ("" for one-off or free plans). */
  priceIdAnnual: string;
  /** Per-month / one-off price in pence. Free plans use 0. */
  priceMonthly: number;
  /** Per-year price in pence. 0 for one-off / free plans. */
  priceAnnual: number;
  /** Commission rate applied at completion / per-job (0..1 decimal). */
  commissionRate?: number;
  /** Display copy for the commission, e.g. "0.50% on completion". */
  commissionLabel?: string;
  /** Flat per-lead fee in pence (mortgage broker etc.). */
  perLeadFee?: number;
  /** Marketing bullet points. */
  features: readonly string[];
  /** Highlight as "Most popular". */
  highlighted?: boolean;
}>;

// ============================================================================
// Env helpers
// ============================================================================

const FREE = "free";

function envOrTest(key: string, testFallback: string): string {
  const v = process.env[key];
  return v && v.length > 0 ? v : testFallback;
}

// ============================================================================
// Plan registry
// Order within each segment matters — it controls UI display order.
// ============================================================================

export const SELLER_PLANS: readonly Plan[] = [
  {
    id: "seller_basic",
    name: "Basic",
    segment: "seller",
    pricingType: "one_off",
    priceIdMonthly: envOrTest("STRIPE_SELLER_BASIC_PRICE_ID", "price_seller_basic_test"),
    priceIdAnnual: "",
    priceMonthly: 9900,
    priceAnnual: 0,
    commissionRate: 0.005,
    commissionLabel: "0.50% on completion",
    features: [
      "Listing on Britestate (15 photos)",
      "Standard hero placement",
      "Tour-booking inbox",
      "Email support",
    ],
  },
  {
    id: "seller_plus",
    name: "Plus",
    segment: "seller",
    pricingType: "one_off",
    priceIdMonthly: envOrTest("STRIPE_SELLER_PLUS_PRICE_ID", "price_seller_plus_test"),
    priceIdAnnual: "",
    priceMonthly: 24900,
    priceAnnual: 0,
    commissionRate: 0.0035,
    commissionLabel: "0.35% on completion",
    highlighted: true,
    features: [
      "Everything in Basic",
      "Drone tour + floorplan",
      "Premium hero placement",
      "AI Story generator included",
      "Priority support (24hr SLA)",
    ],
  },
  {
    id: "seller_premium",
    name: "Premium",
    segment: "seller",
    pricingType: "one_off",
    priceIdMonthly: envOrTest("STRIPE_SELLER_PREMIUM_PRICE_ID", "price_seller_premium_test"),
    priceIdAnnual: "",
    priceMonthly: 44900,
    priceAnnual: 0,
    commissionRate: 0.0025,
    commissionLabel: "0.25% on completion",
    features: [
      "Everything in Plus",
      "Dedicated listing concierge",
      "AI Valuation included",
      "Featured weekly Digest",
      "Photo + video shoot",
    ],
  },
  {
    id: "seller_nsnf",
    name: "No-Sale-No-Fee",
    segment: "seller",
    pricingType: "one_off",
    priceIdMonthly: FREE,
    priceIdAnnual: "",
    priceMonthly: 0,
    priceAnnual: 0,
    commissionRate: 0.01,
    commissionLabel: "1.00% on completion (no upfront)",
    features: [
      "Zero upfront cost",
      "Full Basic listing experience",
      "Pay only when sale completes",
    ],
  },
];

export const AGENT_PLANS: readonly Plan[] = [
  {
    id: "agent_listed",
    name: "Listed",
    segment: "agent",
    pricingType: "subscription",
    priceIdMonthly: FREE,
    priceIdAnnual: FREE,
    priceMonthly: 0,
    priceAnnual: 0,
    commissionLabel: "Revenue-share only on Britestate-originated leads",
    features: [
      "Unlimited free listings",
      "Standard profile",
      "Britestate-originated leads opt-in",
      "Email support",
    ],
  },
  {
    id: "agent_pro",
    name: "Pro",
    segment: "agent",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_AGENT_PRO_PRICE_ID", "price_agent_pro_v2_test"),
    priceIdAnnual: envOrTest("STRIPE_AGENT_PRO_ANNUAL_PRICE_ID", "price_agent_pro_v2_annual_test"),
    priceMonthly: 9900,
    priceAnnual: 95000,
    commissionLabel: "70/30 split on Britestate-originated leads",
    highlighted: true,
    features: [
      "Everything in Listed",
      "Featured branch profile",
      "Lead intake CRM",
      "Viewing-calendar embed",
      "70/30 revenue share on Britestate leads",
      "Priority support (8hr SLA)",
    ],
  },
  {
    id: "agent_elite",
    name: "Elite",
    segment: "agent",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_AGENT_ELITE_PRICE_ID", "price_agent_elite_v2_test"),
    priceIdAnnual: envOrTest("STRIPE_AGENT_ELITE_ANNUAL_PRICE_ID", "price_agent_elite_v2_annual_test"),
    priceMonthly: 34900,
    priceAnnual: 335000,
    commissionLabel: "85/15 split on Britestate-originated leads",
    features: [
      "Everything in Pro",
      "Multi-branch management",
      "Team accounts",
      "API access",
      "Dedicated account manager",
      "85/15 revenue share on Britestate leads",
      "Custom branding",
    ],
  },
];

export const LANDLORD_PLANS: readonly Plan[] = [
  {
    id: "landlord_free",
    name: "Free",
    segment: "landlord",
    pricingType: "subscription",
    priceIdMonthly: FREE,
    priceIdAnnual: FREE,
    priceMonthly: 0,
    priceAnnual: 0,
    commissionLabel: "10% of first month rent on letting",
    features: [
      "1 property",
      "Basic tenant inbox",
      "Document storage",
    ],
  },
  {
    id: "landlord_essential",
    name: "Essential",
    segment: "landlord",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_LANDLORD_ESSENTIAL_PRICE_ID", "price_landlord_essential_v2_test"),
    priceIdAnnual: envOrTest("STRIPE_LANDLORD_ESSENTIAL_ANNUAL_PRICE_ID", "price_landlord_essential_v2_annual_test"),
    priceMonthly: 1500,
    priceAnnual: 14400,
    commissionLabel: "9% of first month rent on letting",
    features: [
      "Up to 3 properties",
      "Tenant screening",
      "Document storage",
      "Maintenance log",
    ],
  },
  {
    id: "landlord_pro",
    name: "Pro",
    segment: "landlord",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_LANDLORD_PRO_PRICE_ID", "price_landlord_pro_v2_test"),
    priceIdAnnual: envOrTest("STRIPE_LANDLORD_PRO_ANNUAL_PRICE_ID", "price_landlord_pro_v2_annual_test"),
    priceMonthly: 3900,
    priceAnnual: 37400,
    commissionLabel: "8% of first month rent on letting",
    highlighted: true,
    features: [
      "Up to 10 properties",
      "Advanced screening",
      "Rent collection tools",
      "Maintenance workflows",
      "Financial reporting",
    ],
  },
  {
    id: "landlord_portfolio",
    name: "Portfolio",
    segment: "landlord",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_LANDLORD_PORTFOLIO_PRICE_ID", "price_landlord_portfolio_v2_test"),
    priceIdAnnual: envOrTest("STRIPE_LANDLORD_PORTFOLIO_ANNUAL_PRICE_ID", "price_landlord_portfolio_v2_annual_test"),
    priceMonthly: 9900,
    priceAnnual: 95000,
    commissionLabel: "8% of first month rent on letting",
    features: [
      "Unlimited properties",
      "Multi-user team accounts",
      "API access",
      "Bulk listing tools",
      "Dedicated account manager",
    ],
  },
];

export const PROVIDER_PLANS: readonly Plan[] = [
  {
    id: "provider_listed",
    name: "Listed",
    segment: "provider",
    pricingType: "subscription",
    priceIdMonthly: FREE,
    priceIdAnnual: FREE,
    priceMonthly: 0,
    priceAnnual: 0,
    commissionRate: 0.12,
    commissionLabel: "12% per job",
    features: [
      "Verified profile listing",
      "Britestate Trust badge (basic)",
      "3 quotes per month",
      "Email support",
    ],
  },
  {
    id: "provider_pro",
    name: "Pro",
    segment: "provider",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_PROVIDER_PRO_PRICE_ID", "price_provider_pro_v2_test"),
    priceIdAnnual: envOrTest("STRIPE_PROVIDER_PRO_ANNUAL_PRICE_ID", "price_provider_pro_v2_annual_test"),
    priceMonthly: 3900,
    priceAnnual: 37400,
    commissionRate: 0.10,
    commissionLabel: "10% per job",
    highlighted: true,
    features: [
      "Everything in Listed",
      "Unlimited quote responses",
      "Priority lead matching",
      "Booking system",
      "Basic CRM + analytics",
      "Priority support (4hr SLA)",
    ],
  },
  {
    id: "provider_elite",
    name: "Elite",
    segment: "provider",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_PROVIDER_ELITE_PRICE_ID", "price_provider_elite_v2_test"),
    priceIdAnnual: envOrTest("STRIPE_PROVIDER_ELITE_ANNUAL_PRICE_ID", "price_provider_elite_v2_annual_test"),
    priceMonthly: 14900,
    priceAnnual: 143000,
    commissionRate: 0.06,
    commissionLabel: "6% per job",
    features: [
      "Everything in Pro",
      "First-access to premium jobs",
      "Multi-user team accounts",
      "Workflow automation",
      "API access",
      "Dedicated account manager",
      "Premium Trust badge",
    ],
  },
];

export const PROVIDER_NICHE_PLANS: readonly Plan[] = [
  {
    id: "provider_conveyancer",
    name: "Conveyancer",
    segment: "provider_niche",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_PROVIDER_CONVEYANCER_PRICE_ID", "price_provider_conveyancer_test"),
    priceIdAnnual: envOrTest("STRIPE_PROVIDER_CONVEYANCER_ANNUAL_PRICE_ID", "price_provider_conveyancer_annual_test"),
    priceMonthly: 7900,
    priceAnnual: 75800,
    commissionRate: 0.06,
    commissionLabel: "6% per transaction",
    features: [
      "Verified conveyancer badge",
      "Direct transaction integration",
      "Automated client onboarding",
      "Document workspace",
    ],
  },
  {
    id: "provider_surveyor",
    name: "Surveyor",
    segment: "provider_niche",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_PROVIDER_SURVEYOR_PRICE_ID", "price_provider_surveyor_test"),
    priceIdAnnual: envOrTest("STRIPE_PROVIDER_SURVEYOR_ANNUAL_PRICE_ID", "price_provider_surveyor_annual_test"),
    priceMonthly: 7900,
    priceAnnual: 75800,
    commissionRate: 0.06,
    commissionLabel: "6% per transaction",
    features: [
      "Verified surveyor badge",
      "Direct booking from listings",
      "Report template library",
      "Document workspace",
    ],
  },
  {
    id: "provider_mortgage_broker",
    name: "Mortgage Broker",
    segment: "provider_niche",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_PROVIDER_MORTGAGE_BROKER_PRICE_ID", "price_provider_mortgage_broker_test"),
    priceIdAnnual: envOrTest("STRIPE_PROVIDER_MORTGAGE_BROKER_ANNUAL_PRICE_ID", "price_provider_mortgage_broker_annual_test"),
    priceMonthly: 4900,
    priceAnnual: 47000,
    perLeadFee: 3500,
    commissionLabel: "£35 per qualified lead",
    features: [
      "Verified broker badge",
      "Qualified-lead routing",
      "AI affordability prescreen",
      "Client portal",
    ],
  },
];

export const DEVELOPER_PLANS: readonly Plan[] = [
  {
    id: "developer_single",
    name: "Single",
    segment: "developer",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_DEVELOPER_SINGLE_PRICE_ID", "price_developer_single_test"),
    priceIdAnnual: envOrTest("STRIPE_DEVELOPER_SINGLE_ANNUAL_PRICE_ID", "price_developer_single_annual_test"),
    priceMonthly: 29900,
    priceAnnual: 287000,
    commissionRate: 0.0025,
    commissionLabel: "0.25% on completion",
    features: [
      "Up to 1 development",
      "Showcase storefront",
      "Lead capture forms",
      "Email support",
    ],
  },
  {
    id: "developer_multi",
    name: "Multi",
    segment: "developer",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_DEVELOPER_MULTI_PRICE_ID", "price_developer_multi_test"),
    priceIdAnnual: envOrTest("STRIPE_DEVELOPER_MULTI_ANNUAL_PRICE_ID", "price_developer_multi_annual_test"),
    priceMonthly: 79900,
    priceAnnual: 767000,
    commissionRate: 0.0020,
    commissionLabel: "0.20% on completion",
    highlighted: true,
    features: [
      "Up to 5 developments",
      "AI render upgrades",
      "Investor exposure feed",
      "Priority support",
    ],
  },
  {
    id: "developer_enterprise",
    name: "Enterprise",
    segment: "developer",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_DEVELOPER_ENTERPRISE_PRICE_ID", "price_developer_enterprise_test"),
    priceIdAnnual: envOrTest("STRIPE_DEVELOPER_ENTERPRISE_ANNUAL_PRICE_ID", "price_developer_enterprise_annual_test"),
    priceMonthly: 199900,
    priceAnnual: 1919000,
    commissionRate: 0.0015,
    commissionLabel: "0.15% on completion",
    features: [
      "Unlimited developments",
      "Custom storefront branding",
      "Dedicated account manager",
      "API + integrations",
      "First placement on AI Digest",
    ],
  },
];

export const TRADER_PLANS: readonly Plan[] = [
  {
    id: "trader_pro",
    name: "Pro",
    segment: "trader",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_TRADER_PRO_PRICE_ID", "price_trader_pro_test"),
    priceIdAnnual: envOrTest("STRIPE_TRADER_PRO_ANNUAL_PRICE_ID", "price_trader_pro_annual_test"),
    priceMonthly: 9900,
    priceAnnual: 95000,
    commissionRate: 0.005,
    commissionLabel: "0.50% on resale",
    features: [
      "Up to 5 active flips",
      "Off-market alerts",
      "Comp tools",
      "Email support",
    ],
  },
  {
    id: "trader_elite",
    name: "Elite",
    segment: "trader",
    pricingType: "subscription",
    priceIdMonthly: envOrTest("STRIPE_TRADER_ELITE_PRICE_ID", "price_trader_elite_test"),
    priceIdAnnual: envOrTest("STRIPE_TRADER_ELITE_ANNUAL_PRICE_ID", "price_trader_elite_annual_test"),
    priceMonthly: 29900,
    priceAnnual: 287000,
    commissionRate: 0.005,
    commissionLabel: "0.50% on resale",
    features: [
      "Unlimited active flips",
      "First-access deal feed",
      "Bulk acquisition tools",
      "Dedicated deal scout",
      "API access",
    ],
  },
];

// ============================================================================
// Boost (one-time) prices
// ============================================================================

export const BOOST_PRICES = {
  "7d": {
    priceId: envOrTest("STRIPE_BOOST_7D_PRICE_ID", "price_boost_7d_test"),
    label: "7-day boost",
    price: 1500,
  },
  "14d": {
    priceId: envOrTest("STRIPE_BOOST_14D_PRICE_ID", "price_boost_14d_test"),
    label: "14-day boost",
    price: 2500,
  },
  "30d": {
    priceId: envOrTest("STRIPE_BOOST_30D_PRICE_ID", "price_boost_30d_test"),
    label: "30-day boost",
    price: 4500,
  },
  ai_valuation: {
    priceId: envOrTest("STRIPE_BOOST_AI_VALUATION_PRICE_ID", "price_boost_ai_valuation_test"),
    label: "AI Valuation report",
    price: 2900,
  },
  story: {
    priceId: envOrTest("STRIPE_BOOST_STORY_PRICE_ID", "price_boost_story_test"),
    label: "AI Story listing",
    price: 7900,
  },
  digest: {
    priceId: envOrTest("STRIPE_BOOST_DIGEST_PRICE_ID", "price_boost_digest_test"),
    label: "Weekly Digest feature",
    price: 3900,
  },
} as const;

// ============================================================================
// Aggregates
// ============================================================================

export const PLANS_BY_SEGMENT: Readonly<Record<Segment, readonly Plan[]>> = {
  seller: SELLER_PLANS,
  agent: AGENT_PLANS,
  landlord: LANDLORD_PLANS,
  provider: PROVIDER_PLANS,
  provider_niche: PROVIDER_NICHE_PLANS,
  developer: DEVELOPER_PLANS,
  trader: TRADER_PLANS,
};

export const ALL_PLANS: readonly Plan[] = [
  ...SELLER_PLANS,
  ...AGENT_PLANS,
  ...LANDLORD_PLANS,
  ...PROVIDER_PLANS,
  ...PROVIDER_NICHE_PLANS,
  ...DEVELOPER_PLANS,
  ...TRADER_PLANS,
];

/** Back-compat: legacy callers expect `BillingRole → Plan[]`. */
export const PLANS_BY_ROLE: Readonly<Record<BillingRole, readonly Plan[]>> = {
  agent: AGENT_PLANS,
  landlord: LANDLORD_PLANS,
  provider: PROVIDER_PLANS,
};

export function getPlansBySegment(segment: Segment): readonly Plan[] {
  return PLANS_BY_SEGMENT[segment];
}

// ============================================================================
// Allowlist
// ============================================================================

const allowedSet = new Set<string>([FREE]);
for (const plan of ALL_PLANS) {
  if (plan.priceIdMonthly) allowedSet.add(plan.priceIdMonthly);
  if (plan.priceIdAnnual) allowedSet.add(plan.priceIdAnnual);
}
for (const boost of Object.values(BOOST_PRICES)) {
  allowedSet.add(boost.priceId);
}

export const ALLOWED_PRICE_IDS: ReadonlySet<string> = allowedSet;

export function isPriceIdAllowed(priceId: string): boolean {
  return ALLOWED_PRICE_IDS.has(priceId);
}

// ============================================================================
// Lookups
// ============================================================================

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return ALL_PLANS.find(
    (p) => p.priceIdMonthly === priceId || p.priceIdAnnual === priceId,
  );
}

/**
 * Resolve a Stripe price ID to our internal plan ID.
 * Returns the fallback string when the price ID is unknown.
 */
export function resolveInternalPlanId(
  stripePriceId: string | undefined | null,
  fallback: string | null = null,
): string | null {
  if (!stripePriceId) return fallback;
  const matched = getPlanByPriceId(stripePriceId);
  return matched?.id ?? fallback;
}

// ============================================================================
// Validation helpers
// ============================================================================

/**
 * Validate that a URL is same-origin to prevent open-redirect phishing.
 * Accepts relative paths and absolute URLs on the app's own origin.
 */
export function isValidReturnUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
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
