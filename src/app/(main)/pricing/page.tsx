// src/app/(main)/pricing/page.tsx
import { PLANS_BY_ROLE } from "@/lib/billing-config";
import type { Plan } from "@/lib/billing-config";
import { PricingTabs } from "@/components/pricing/PricingTabs";
import Link from "next/link";

// Marketing metadata that doesn't belong in billing-config.ts.
// Prices, names, and features are derived from PLANS_BY_ROLE (source of truth).
type PlanMeta = Readonly<{
  audience: string;
  cta: string;
  ctaHref: string;
  badge?: string;
}>;

const PLAN_META: Record<string, PlanMeta> = {
  // Provider plans
  provider_member: { audience: "Getting started", cta: "Request invite", ctaHref: "/register?role=service_provider" },
  provider_professional: { audience: "For growing businesses", cta: "Request invite", ctaHref: "/register?role=service_provider&plan=professional", badge: "Most Popular" },
  provider_elite: { audience: "For established firms", cta: "Request invite", ctaHref: "/register?role=service_provider&plan=elite" },
  // Agent plans
  agent_performance: { audience: "Zero risk, zero cost", cta: "Apply as founding agency", ctaHref: "/register?role=agent" },
  agent_professional: { audience: "Growing agencies", cta: "Apply as founding agency", ctaHref: "/register?role=agent&plan=professional", badge: "Most Popular" },
  agent_enterprise: { audience: "High-volume agencies", cta: "Contact sales", ctaHref: "/register?role=agent&plan=enterprise" },
  // Landlord plans
  landlord_ess: { audience: "Up to 3 properties", cta: "Start free trial", ctaHref: "/register?role=landlord" },
  landlord_pro: { audience: "Unlimited properties", cta: "Start free trial", ctaHref: "/register?role=landlord&plan=professional", badge: "Most Popular" },
};

function planToTabData(plan: Plan) {
  const meta = PLAN_META[plan.id] ?? { audience: "", cta: "Get started", ctaHref: "/register" };
  return {
    name: plan.name,
    audience: meta.audience,
    monthlyPricePence: plan.priceMonthly,
    annualPricePence: plan.priceAnnual,
    features: plan.features,
    cta: meta.cta,
    ctaHref: meta.ctaHref,
    highlighted: plan.highlighted,
    badge: meta.badge,
  };
}

const PRICING_TABS = [
  {
    id: "homeowners",
    label: "Homeowners",
    description:
      "Free forever for homebuyers and renters. Search properties, get AI recommendations, and book viewings.",
    plans: [
      {
        name: "Free",
        audience: "Homebuyers & Renters",
        monthlyPricePence: 0,
        annualPricePence: 0,
        features: [
          "Property search & saved searches",
          "AI-powered recommendations",
          "Viewing bookings",
          "Transaction tracking",
          "Marketplace access",
          "Move-in service bundles",
        ],
        cta: "Sign up free",
        ctaHref: "/register",
      },
    ],
  },
  {
    id: "tradespeople",
    label: "Tradespeople",
    description:
      "Join Britain's most trusted trade network. Invite-only membership with verified leads.",
    plans: PLANS_BY_ROLE.provider.map(planToTabData),
  },
  {
    id: "agents",
    label: "Estate Agents",
    description:
      "Zero upfront costs. We only earn when you earn — performance-based pricing.",
    plans: PLANS_BY_ROLE.agent.map(planToTabData),
  },
  {
    id: "landlords",
    label: "Landlords",
    description:
      "Manage your rental portfolio with professional tools and tenant screening.",
    plans: PLANS_BY_ROLE.landlord.map(planToTabData),
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          Free for homeowners. Performance-based for agents. Membership-based
          for tradespeople.
        </p>
      </div>

      <div className="mt-10">
        <PricingTabs tabs={PRICING_TABS} defaultTab="tradespeople" />
      </div>

      <p className="mt-16 text-center text-sm text-neutral-500">
        Have questions?{" "}
        <Link
          href="/contact"
          className="text-[#1B4D3E] underline-offset-4 hover:underline"
        >
          Contact our sales team
        </Link>
      </p>
    </div>
  );
}
