// src/app/(main)/pricing/page.tsx
import { PLANS_BY_ROLE } from "@/lib/billing-config";
import type { Plan } from "@/lib/billing-config";
import { PricingTabs } from "@/components/pricing/PricingTabs";
import Link from "next/link";
import { ShieldCheck, ArrowRight, CheckCircle } from "lucide-react";

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

const TRUST_FEATURES = [
  "No hidden fees",
  "Cancel anytime",
  "GDPR compliant",
  "Bank-grade security",
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-primary text-white py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold backdrop-blur-sm">
            <ShieldCheck className="size-4" />
            <span>Simple, transparent pricing</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Pricing that works for everyone
          </h1>
          <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            Free for homeowners. Performance-based for agents. Membership-based
            for tradespeople. No surprises.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {TRUST_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-white/80 text-sm">
                <CheckCircle className="size-4 text-white/60" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tabs */}
      <section className="bg-neutral-50 py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <PricingTabs tabs={PRICING_TABS} defaultTab="tradespeople" />
        </div>
      </section>

      {/* FAQ / Trust Section */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <h2 className="font-heading text-3xl font-bold text-neutral-900 tracking-tight mb-8">
                Common questions
              </h2>
              <div className="space-y-6">
                {[
                  {
                    q: "Is it really free for homebuyers?",
                    a: "Yes. Searching, saving properties, booking viewings, and tracking transactions are completely free for homebuyers and renters — always.",
                  },
                  {
                    q: "How does performance pricing work for agents?",
                    a: "We charge a small percentage commission only on successfully completed transactions. No monthly fees, no upfront costs. If you don't earn, we don't earn.",
                  },
                  {
                    q: "What's included in the tradesperson membership?",
                    a: "Membership includes your verified profile, job lead access, AI scheduling, client reviews, and our dispute resolution service. Tiers differ by lead volume and feature access.",
                  },
                  {
                    q: "Can I switch plans?",
                    a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of the next billing period.",
                  },
                ].map((faq) => (
                  <div key={faq.q} className="border-b border-neutral-100 pb-6 last:border-0 last:pb-0">
                    <h3 className="font-heading text-base font-semibold text-neutral-900 mb-2">
                      {faq.q}
                    </h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-2xl bg-brand-primary p-8 text-white">
                <h3 className="font-heading text-xl font-bold mb-3">
                  Need a custom solution?
                </h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  For enterprise agencies, large portfolios, or developer
                  partnerships, we offer custom pricing and dedicated support.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-white text-brand-primary text-sm font-semibold hover:bg-brand-primary-lighter transition-colors shadow-sm"
                >
                  Contact sales
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              <div className="rounded-2xl bg-brand-primary-lighter p-8">
                <h3 className="font-heading text-xl font-bold text-brand-primary mb-3">
                  Founding member discount
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed mb-4">
                  Early members get locked-in pricing for life. Apply now while
                  founding spots are available.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["30% off", "Lock-in pricing", "Priority support"].map(
                    (badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold"
                      >
                        <CheckCircle className="size-3" />
                        {badge}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact link */}
      <div className="bg-neutral-50 py-8 text-center border-t border-neutral-100">
        <p className="text-sm text-neutral-500">
          Have questions?{" "}
          <Link
            href="/contact"
            className="text-brand-primary font-medium underline-offset-4 hover:underline"
          >
            Contact our sales team
          </Link>
        </p>
      </div>
    </>
  );
}
