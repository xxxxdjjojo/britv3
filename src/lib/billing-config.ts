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
  priceId: string;     // Stripe price ID
  price: number;       // pence / month
  interval: "month" | "year";
  role: BillingRole;
  features: readonly string[];
  highlighted?: boolean;
}>;

// ============================================================================
// Price ID allowlist
// Every priceId accepted by the checkout API must appear in this set.
// ============================================================================

export const ALLOWED_PRICE_IDS: ReadonlySet<string> = new Set([
  // Agent plans
  process.env.STRIPE_AGENT_BASIC_PRICE_ID ?? "price_agent_basic_test",
  process.env.STRIPE_AGENT_PRO_PRICE_ID ?? "price_agent_pro_test",
  process.env.STRIPE_AGENT_ENT_PRICE_ID ?? "price_agent_ent_test",
  // Landlord plans
  process.env.STRIPE_LANDLORD_ESSENTIAL_PRICE_ID ?? "price_landlord_ess_test",
  process.env.STRIPE_LANDLORD_PRO_PRICE_ID ?? "price_landlord_pro_test",
  // Provider plans
  process.env.STRIPE_PROVIDER_STARTER_PRICE_ID ?? "price_provider_start_test",
  process.env.STRIPE_PROVIDER_GROWTH_PRICE_ID ?? "price_provider_growth_test",
  // One-time boosts
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
    id: "agent_basic",
    name: "Basic",
    priceId: process.env.STRIPE_AGENT_BASIC_PRICE_ID ?? "price_agent_basic_test",
    price: 4900,
    interval: "month",
    role: "agent",
    features: [
      "Up to 25 active listings",
      "Standard property photos",
      "Lead management",
      "Email support",
    ],
  },
  {
    id: "agent_pro",
    name: "Professional",
    priceId: process.env.STRIPE_AGENT_PRO_PRICE_ID ?? "price_agent_pro_test",
    price: 9900,
    interval: "month",
    role: "agent",
    highlighted: true,
    features: [
      "Unlimited active listings",
      "Premium photo hosting",
      "Full CRM suite",
      "Viewing calendar",
      "Offer management",
      "Priority support",
    ],
  },
  {
    id: "agent_ent",
    name: "Enterprise",
    priceId: process.env.STRIPE_AGENT_ENT_PRICE_ID ?? "price_agent_ent_test",
    price: 24900,
    interval: "month",
    role: "agent",
    features: [
      "Everything in Professional",
      "Multi-branch management",
      "Team member accounts",
      "API access",
      "Dedicated account manager",
      "Custom branding",
    ],
  },
];

export const LANDLORD_PLANS: readonly Plan[] = [
  {
    id: "landlord_ess",
    name: "Essential",
    priceId: process.env.STRIPE_LANDLORD_ESSENTIAL_PRICE_ID ?? "price_landlord_ess_test",
    price: 1900,
    interval: "month",
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
    priceId: process.env.STRIPE_LANDLORD_PRO_PRICE_ID ?? "price_landlord_pro_test",
    price: 4900,
    interval: "month",
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
    id: "provider_starter",
    name: "Starter",
    priceId: process.env.STRIPE_PROVIDER_STARTER_PRICE_ID ?? "price_provider_start_test",
    price: 2900,
    interval: "month",
    role: "provider",
    features: [
      "Up to 10 active jobs",
      "Basic profile listing",
      "Quote management",
      "Email notifications",
    ],
  },
  {
    id: "provider_growth",
    name: "Growth",
    priceId: process.env.STRIPE_PROVIDER_GROWTH_PRICE_ID ?? "price_provider_growth_test",
    price: 5900,
    interval: "month",
    role: "provider",
    highlighted: true,
    features: [
      "Unlimited active jobs",
      "Featured profile listing",
      "Priority job matching",
      "Reviews & ratings",
      "Analytics dashboard",
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
  ].find((p) => p.priceId === priceId);
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
