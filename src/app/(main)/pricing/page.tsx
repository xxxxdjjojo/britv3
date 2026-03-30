// src/app/(main)/pricing/page.tsx
import { PLANS_BY_ROLE } from "@/lib/billing-config";
import type { Plan } from "@/lib/billing-config";
import { PricingTabs } from "@/components/pricing/PricingTabs";
import Link from "next/link";
import { ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

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

const TRUST_ITEMS = [
  { icon: ShieldCheck, text: "Bank-grade security & encryption" },
  { icon: CheckCircle2, text: "Cancel or change plan anytime" },
  { icon: Sparkles, text: "AI features included in all plans" },
];

export default function PricingPage() {
  return (
    <div className="bg-neutral-50">
      {/* Hero */}
      <section className="bg-brand-primary text-white py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm font-semibold">
            <Sparkles className="size-4" />
            <span>Performance-based. Transparent. Fair.</span>
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Free for homeowners. Performance-based for agents. Membership-based
            for tradespeople.
          </p>

          {/* Trust items */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-10">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-2 text-white/90 text-sm font-medium">
                  <Icon className="size-4 shrink-0" />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing tabs */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <PricingTabs tabs={PRICING_TABS} defaultTab="tradespeople" />
      </section>

      {/* FAQ / Contact prompt */}
      <section className="bg-brand-primary-lighter py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight mb-3">
            Have questions about pricing?
          </h2>
          <p className="text-neutral-600 text-base mb-8">
            Our team is happy to walk you through the right plan for your
            situation.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary-light transition-colors shadow-md"
          >
            Contact our sales team
          </Link>
        </div>
      </section>
    </div>
  );
}
