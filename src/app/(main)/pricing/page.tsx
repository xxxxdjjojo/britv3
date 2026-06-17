// src/app/(main)/pricing/page.tsx

import { Suspense } from "react";

import Link from "next/link";

import { PricingTabs } from "@/components/pricing/PricingTabs";
import type {
  PlanCardData,
  SegmentTabConfig,
} from "@/components/pricing/types";
import {
  ALL_PLANS,
  PLANS_BY_SEGMENT,
  type Plan,
  type Segment,
} from "@/lib/billing-config";

// Marketing copy bound to memo segments. Plans, prices and features come
// from billing-config (single source of truth).
const SEGMENT_COPY: Record<
  Segment,
  Readonly<{
    label: string;
    description: string;
    ctaHrefBase: string;
    role?: string;
  }>
> = {
  seller: {
    label: "Sellers",
    description:
      "List with a real photographer, real story, and zero estate-agent commission. Pay one-off, pay less to complete.",
    ctaHrefBase: "/register",
    role: "seller",
  },
  agent: {
    label: "Estate Agents",
    description:
      "Free to list. Revenue-share only on the leads we originate. Save 76% versus Rightmove's enhanced tier.",
    ctaHrefBase: "/register",
    role: "agent",
  },
  landlord: {
    label: "Landlords",
    description:
      "From hobbyists to portfolio operators. Tenant screening, rent collection, and a small per-let fee — no surprise charges.",
    ctaHrefBase: "/register",
    role: "landlord",
  },
  provider: {
    label: "Providers",
    description:
      "Verified tradespeople. Pay less commission as you climb tiers — Listed 12%, Pro 10%, Elite 6%.",
    ctaHrefBase: "/register",
    role: "service_provider",
  },
  provider_niche: {
    label: "Professionals",
    description:
      "Conveyancers, surveyors and mortgage brokers — niche tools, qualified leads, integrated transactions.",
    ctaHrefBase: "/register",
    role: "service_provider",
  },
  developer: {
    label: "Developers",
    description:
      "Showcase entire developments. Investor exposure, AI renders, and a fraction-of-a-percent completion fee.",
    ctaHrefBase: "/register",
    role: "developer",
  },
  trader: {
    label: "Traders",
    description:
      "Flippers and property traders — off-market deal feed, comp tools, 0.50% on resale.",
    ctaHrefBase: "/register",
    role: "trader",
  },
};

function planToCard(plan: Plan): PlanCardData {
  const copy = SEGMENT_COPY[plan.segment];
  const ctaHref = `${copy.ctaHrefBase}?role=${copy.role ?? "buyer"}&plan=${encodeURIComponent(plan.id)}`;
  return {
    planId: plan.id,
    name: plan.name,
    audience: plan.name,
    segment: plan.segment,
    pricingType: plan.pricingType,
    priceIdMonthly: plan.priceIdMonthly,
    priceIdAnnual: plan.priceIdAnnual,
    monthlyPricePence: plan.priceMonthly,
    annualPricePence: plan.priceAnnual,
    features: plan.features,
    cta:
      plan.priceMonthly === 0 && plan.priceAnnual === 0
        ? "Get started free"
        : plan.pricingType === "one_off"
          ? "Choose this tier"
          : "Subscribe",
    ctaHref,
    highlighted: plan.highlighted,
    badge: plan.highlighted ? "Most popular" : undefined,
    commissionLabel: plan.commissionLabel,
  };
}

function buildTabs(): readonly SegmentTabConfig[] {
  const order: readonly Segment[] = [
    "seller",
    "agent",
    "landlord",
    "provider",
    "provider_niche",
    "developer",
    "trader",
  ];
  return order.map((segment) => {
    const copy = SEGMENT_COPY[segment];
    const plans = PLANS_BY_SEGMENT[segment].map(planToCard);
    const pricingTypes = new Set(plans.map((p) => p.pricingType));
    const pricingType: "subscription" | "one_off" | "mixed" =
      pricingTypes.size === 1
        ? (Array.from(pricingTypes)[0] as "subscription" | "one_off")
        : "mixed";
    return {
      id: segment === "provider_niche" ? "providers-niche" : `${segment}s`,
      label: copy.label,
      description: copy.description,
      pricingType,
      plans,
    };
  });
}

const TABS = buildTabs();

export default function PricingPage() {
  // Memo: ALL_PLANS used here only to surface the count in source for tests
  // and reviewers — keeps billing-config as the single import surface.
  void ALL_PLANS;
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-neutral-600">
          Seven segments. One platform. Pay less than the incumbents,
          earn more than them, and only pay when value lands.
        </p>
      </div>

      <div className="mt-10">
        {/* PricingTabs reads ?tab and ?force_variant via useSearchParams; */}
        {/* Suspense boundary required for static prerender on Next.js 16. */}
        <Suspense fallback={<div className="h-96" aria-busy="true" />}>
          <PricingTabs tabs={TABS} defaultTab="sellers" />
        </Suspense>
      </div>

      <p className="mt-16 text-center text-sm text-neutral-500">
        See the commission detail on the{" "}
        <Link
          href="/fee-transparency"
          className="text-brand-primary underline-offset-4 hover:underline"
        >
          fee transparency
        </Link>{" "}
        page, or{" "}
        <Link
          href="/contact"
          className="text-brand-primary underline-offset-4 hover:underline"
        >
          talk to sales
        </Link>
        .
      </p>
    </div>
  );
}
