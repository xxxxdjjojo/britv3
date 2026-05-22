// src/components/pricing/types.ts
//
// Shared types for the pricing UI — kept client-safe.

export type PricingInterval = "monthly" | "annual" | "one_off";

export interface CheckoutCtaPayload {
  readonly planId: string;
  readonly priceId: string;
  readonly interval: PricingInterval;
  readonly segment: string;
}

export interface PlanCardData {
  readonly planId: string;
  readonly name: string;
  readonly audience: string;
  readonly segment: string;
  readonly pricingType: "subscription" | "one_off";
  readonly priceIdMonthly: string;
  readonly priceIdAnnual: string;
  readonly monthlyPricePence: number;
  readonly annualPricePence: number;
  readonly features: readonly string[];
  readonly cta: string;
  readonly ctaHref: string;
  readonly highlighted?: boolean;
  readonly badge?: string;
  readonly commissionLabel?: string;
}

export interface SegmentTabConfig {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly pricingType: "subscription" | "one_off" | "mixed";
  readonly plans: readonly PlanCardData[];
}
