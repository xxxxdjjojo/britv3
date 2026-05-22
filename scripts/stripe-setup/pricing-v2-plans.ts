// scripts/stripe-setup/pricing-v2-plans.ts
//
// Single source of truth for the memo-v2 plan registry used by the
// provisioning and verification scripts. Importing the runtime
// billing-config from here would pull in "server-only", so we
// duplicate the plan IDs + prices intentionally and have the
// verification script assert they stay in lock-step.

export type PricingType = "subscription" | "one_off";

export interface PlanDef {
  readonly planId: string;
  readonly segment: string;
  readonly name: string;
  readonly monthlyPence: number;
  readonly annualPence: number;
  readonly pricingType: PricingType;
  readonly envVarMonthly: string;
  readonly envVarAnnual: string;
}

export interface BoostDef {
  readonly boostId: string;
  readonly name: string;
  readonly pricePence: number;
  readonly envVar: string;
}

export const PLANS: ReadonlyArray<PlanDef> = [
  // ---- Sellers (one-off) ----
  { planId: "seller_basic",   segment: "seller",         name: "Seller Basic",    monthlyPence: 9900,  annualPence: 0,      pricingType: "one_off",     envVarMonthly: "STRIPE_SELLER_BASIC_PRICE_ID",   envVarAnnual: "" },
  { planId: "seller_plus",    segment: "seller",         name: "Seller Plus",     monthlyPence: 24900, annualPence: 0,      pricingType: "one_off",     envVarMonthly: "STRIPE_SELLER_PLUS_PRICE_ID",    envVarAnnual: "" },
  { planId: "seller_premium", segment: "seller",         name: "Seller Premium",  monthlyPence: 44900, annualPence: 0,      pricingType: "one_off",     envVarMonthly: "STRIPE_SELLER_PREMIUM_PRICE_ID", envVarAnnual: "" },

  // ---- Agents (subscription) ----
  { planId: "agent_pro",    segment: "agent", name: "Agent Pro",      monthlyPence: 9900,  annualPence: 95000,  pricingType: "subscription", envVarMonthly: "STRIPE_AGENT_PRO_PRICE_ID",         envVarAnnual: "STRIPE_AGENT_PRO_ANNUAL_PRICE_ID" },
  { planId: "agent_elite",  segment: "agent", name: "Agent Elite",    monthlyPence: 34900, annualPence: 335000, pricingType: "subscription", envVarMonthly: "STRIPE_AGENT_ELITE_PRICE_ID",       envVarAnnual: "STRIPE_AGENT_ELITE_ANNUAL_PRICE_ID" },

  // ---- Landlords (subscription) ----
  { planId: "landlord_essential", segment: "landlord", name: "Landlord Essential", monthlyPence: 1500, annualPence: 14400, pricingType: "subscription", envVarMonthly: "STRIPE_LANDLORD_ESSENTIAL_PRICE_ID", envVarAnnual: "STRIPE_LANDLORD_ESSENTIAL_ANNUAL_PRICE_ID" },
  { planId: "landlord_pro",       segment: "landlord", name: "Landlord Pro",       monthlyPence: 3900, annualPence: 37400, pricingType: "subscription", envVarMonthly: "STRIPE_LANDLORD_PRO_PRICE_ID",       envVarAnnual: "STRIPE_LANDLORD_PRO_ANNUAL_PRICE_ID" },
  { planId: "landlord_portfolio", segment: "landlord", name: "Landlord Portfolio", monthlyPence: 9900, annualPence: 95000, pricingType: "subscription", envVarMonthly: "STRIPE_LANDLORD_PORTFOLIO_PRICE_ID", envVarAnnual: "STRIPE_LANDLORD_PORTFOLIO_ANNUAL_PRICE_ID" },

  // ---- Providers (subscription) ----
  { planId: "provider_pro",   segment: "provider", name: "Provider Pro",   monthlyPence: 3900,  annualPence: 37400,  pricingType: "subscription", envVarMonthly: "STRIPE_PROVIDER_PRO_PRICE_ID",   envVarAnnual: "STRIPE_PROVIDER_PRO_ANNUAL_PRICE_ID" },
  { planId: "provider_elite", segment: "provider", name: "Provider Elite", monthlyPence: 14900, annualPence: 143000, pricingType: "subscription", envVarMonthly: "STRIPE_PROVIDER_ELITE_PRICE_ID", envVarAnnual: "STRIPE_PROVIDER_ELITE_ANNUAL_PRICE_ID" },

  // ---- Providers niche (subscription) ----
  { planId: "provider_conveyancer",     segment: "provider_niche", name: "Conveyancer",     monthlyPence: 7900, annualPence: 75800, pricingType: "subscription", envVarMonthly: "STRIPE_PROVIDER_CONVEYANCER_PRICE_ID",     envVarAnnual: "STRIPE_PROVIDER_CONVEYANCER_ANNUAL_PRICE_ID" },
  { planId: "provider_surveyor",        segment: "provider_niche", name: "Surveyor",        monthlyPence: 7900, annualPence: 75800, pricingType: "subscription", envVarMonthly: "STRIPE_PROVIDER_SURVEYOR_PRICE_ID",        envVarAnnual: "STRIPE_PROVIDER_SURVEYOR_ANNUAL_PRICE_ID" },
  { planId: "provider_mortgage_broker", segment: "provider_niche", name: "Mortgage Broker", monthlyPence: 4900, annualPence: 47000, pricingType: "subscription", envVarMonthly: "STRIPE_PROVIDER_MORTGAGE_BROKER_PRICE_ID", envVarAnnual: "STRIPE_PROVIDER_MORTGAGE_BROKER_ANNUAL_PRICE_ID" },

  // ---- Developers (subscription) ----
  { planId: "developer_single",     segment: "developer", name: "Developer Single",     monthlyPence: 29900,  annualPence: 287000,  pricingType: "subscription", envVarMonthly: "STRIPE_DEVELOPER_SINGLE_PRICE_ID",     envVarAnnual: "STRIPE_DEVELOPER_SINGLE_ANNUAL_PRICE_ID" },
  { planId: "developer_multi",      segment: "developer", name: "Developer Multi",      monthlyPence: 79900,  annualPence: 767000,  pricingType: "subscription", envVarMonthly: "STRIPE_DEVELOPER_MULTI_PRICE_ID",      envVarAnnual: "STRIPE_DEVELOPER_MULTI_ANNUAL_PRICE_ID" },
  { planId: "developer_enterprise", segment: "developer", name: "Developer Enterprise", monthlyPence: 199900, annualPence: 1919000, pricingType: "subscription", envVarMonthly: "STRIPE_DEVELOPER_ENTERPRISE_PRICE_ID", envVarAnnual: "STRIPE_DEVELOPER_ENTERPRISE_ANNUAL_PRICE_ID" },

  // ---- Traders (subscription) ----
  { planId: "trader_pro",   segment: "trader", name: "Trader Pro",   monthlyPence: 9900,  annualPence: 95000,  pricingType: "subscription", envVarMonthly: "STRIPE_TRADER_PRO_PRICE_ID",   envVarAnnual: "STRIPE_TRADER_PRO_ANNUAL_PRICE_ID" },
  { planId: "trader_elite", segment: "trader", name: "Trader Elite", monthlyPence: 29900, annualPence: 287000, pricingType: "subscription", envVarMonthly: "STRIPE_TRADER_ELITE_PRICE_ID", envVarAnnual: "STRIPE_TRADER_ELITE_ANNUAL_PRICE_ID" },
];

export const BOOSTS: ReadonlyArray<BoostDef> = [
  { boostId: "7d",            name: "7-day listing boost",  pricePence: 1500, envVar: "STRIPE_BOOST_7D_PRICE_ID" },
  { boostId: "14d",           name: "14-day listing boost", pricePence: 2500, envVar: "STRIPE_BOOST_14D_PRICE_ID" },
  { boostId: "30d",           name: "30-day listing boost", pricePence: 4500, envVar: "STRIPE_BOOST_30D_PRICE_ID" },
  { boostId: "ai_valuation",  name: "AI Valuation boost",   pricePence: 2900, envVar: "STRIPE_BOOST_AI_VALUATION_PRICE_ID" },
  { boostId: "story",         name: "Story listing boost",  pricePence: 7900, envVar: "STRIPE_BOOST_STORY_PRICE_ID" },
  { boostId: "digest",        name: "Digest feature boost", pricePence: 3900, envVar: "STRIPE_BOOST_DIGEST_PRICE_ID" },
];
