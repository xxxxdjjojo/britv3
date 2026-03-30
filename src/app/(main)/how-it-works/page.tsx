"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  FileText,
  Key,
  Camera,
  Users,
  Handshake,
  CheckCircle2,
  Building2,
  Filter,
  BarChart3,
  Store,
  Megaphone,
  LayoutGrid,
  Wrench,
  Inbox,
  Star,
  ArrowRight,
  Sparkles,
} from "lucide-react";

type Step = {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
};

type Role = {
  key: string;
  label: string;
  steps: readonly Step[];
};

const roles: readonly Role[] = [
  {
    key: "buyer",
    label: "Buyer",
    steps: [
      {
        number: 1,
        icon: Search,
        title: "Search properties",
        description:
          "Browse thousands of verified listings with AI-powered recommendations tailored to your preferences, budget, and lifestyle.",
      },
      {
        number: 2,
        icon: Calendar,
        title: "Book viewings",
        description:
          "Schedule viewings directly through the platform. Get instant confirmations and manage your viewing calendar in one place.",
      },
      {
        number: 3,
        icon: FileText,
        title: "Make an offer",
        description:
          "Submit offers digitally, track their status in real time, and negotiate directly with sellers or their agents.",
      },
      {
        number: 4,
        icon: Key,
        title: "Complete your purchase",
        description:
          "Track every step of the conveyancing process, manage documents, and coordinate with solicitors and mortgage brokers.",
      },
    ],
  },
  {
    key: "seller",
    label: "Seller",
    steps: [
      {
        number: 1,
        icon: Camera,
        title: "List your property",
        description:
          "Create a professional listing with photos, floor plans, and EPC data. Our tools help you set the right asking price.",
      },
      {
        number: 2,
        icon: Users,
        title: "Receive interest",
        description:
          "Get matched with qualified buyers. Review viewing requests and manage enquiries from your seller dashboard.",
      },
      {
        number: 3,
        icon: Handshake,
        title: "Accept an offer",
        description:
          "Compare offers side-by-side, verify buyer positions, and accept with confidence using our transparent process.",
      },
      {
        number: 4,
        icon: CheckCircle2,
        title: "Complete the sale",
        description:
          "Track the transaction from offer to completion. Coordinate with all parties through a single timeline view.",
      },
    ],
  },
  {
    key: "landlord",
    label: "Landlord",
    steps: [
      {
        number: 1,
        icon: Building2,
        title: "List your rental",
        description:
          "Advertise your property to thousands of verified tenants. Set your terms, rent, and availability dates.",
      },
      {
        number: 2,
        icon: Filter,
        title: "Screen tenants",
        description:
          "Review applications with built-in referencing, credit checks, and employment verification all in one place.",
      },
      {
        number: 3,
        icon: FileText,
        title: "Manage tenancies",
        description:
          "Digital tenancy agreements, automated rent collection, and maintenance request tracking from your dashboard.",
      },
      {
        number: 4,
        icon: BarChart3,
        title: "Grow your portfolio",
        description:
          "Track yield, expenses, and compliance across all your properties with portfolio analytics and reporting tools.",
      },
    ],
  },
  {
    key: "agent",
    label: "Agent",
    steps: [
      {
        number: 1,
        icon: Store,
        title: "Set up your agency",
        description:
          "Create your verified agency profile, add team members, and configure your service areas and specialisations.",
      },
      {
        number: 2,
        icon: Megaphone,
        title: "List and market",
        description:
          "Publish listings with professional tools, manage enquiries, and use AI-powered matching to connect with buyers.",
      },
      {
        number: 3,
        icon: LayoutGrid,
        title: "Manage your pipeline",
        description:
          "Track viewings, offers, and transactions across your entire portfolio with CRM tools built for property.",
      },
    ],
  },
  {
    key: "tradesperson",
    label: "Tradesperson",
    steps: [
      {
        number: 1,
        icon: Wrench,
        title: "Create your profile",
        description:
          "Showcase your skills, qualifications, and past work. Get verified to build trust with potential clients.",
      },
      {
        number: 2,
        icon: Inbox,
        title: "Receive job leads",
        description:
          "Get matched with homeowners and landlords who need your services. Respond to quote requests directly.",
      },
      {
        number: 3,
        icon: Star,
        title: "Build your reputation",
        description:
          "Collect verified reviews, grow your client base, and manage your bookings all from one dashboard.",
      },
    ],
  },
] as const;

export default function HowItWorksPage() {
  const [activeRole, setActiveRole] = useState<string>("buyer");
  const activeData = roles.find((r) => r.key === activeRole) ?? roles[0];

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Hero Header */}
      <section className="bg-brand-primary text-white py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm font-semibold">
            <Sparkles className="size-4" />
            <span>Simple. Transparent. Intelligent.</span>
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight mb-6">
            How It Works
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Britestate simplifies every step of the property journey. Choose
            your role to see how it works for you.
          </p>
        </div>
      </section>

      {/* Role Switcher */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-2 flex flex-wrap justify-center gap-1">
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => setActiveRole(role.key)}
              className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all min-h-[44px] ${
                activeRole === role.key
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
              aria-pressed={activeRole === role.key}
            >
              {role.label}
            </button>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-6">
          {activeData.steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-sm flex gap-5 sm:gap-8 group hover:shadow-md transition-shadow duration-300"
              >
                {/* Step connector line */}
                {index < activeData.steps.length - 1 && (
                  <div
                    className="absolute left-[2.75rem] sm:left-[3.5rem] top-full h-6 w-px bg-brand-primary/20 z-10"
                    aria-hidden="true"
                  />
                )}

                {/* Icon + number */}
                <div className="relative shrink-0">
                  <div className="size-14 sm:size-16 rounded-2xl bg-brand-primary-lighter flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                    <Icon className="size-6 sm:size-7" />
                  </div>
                  <span className="absolute -top-2 -right-2 size-6 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <h3 className="font-heading text-lg sm:text-xl font-semibold text-neutral-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-brand-primary-lighter py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { value: "25,000+", label: "Properties Listed" },
              { value: "50,000+", label: "Happy Users" },
              { value: "5,000+", label: "Verified Pros" },
              { value: "4.9/5", label: "User Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-heading text-3xl font-bold text-brand-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-neutral-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-neutral-600 text-lg mb-8">
            Free for homebuyers and renters. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-xl bg-brand-primary text-white font-semibold text-base hover:bg-brand-primary-light transition-colors shadow-md w-full sm:w-auto min-w-[180px]"
            >
              <Sparkles className="size-5" />
              Get Started Free
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-xl border-2 border-brand-primary text-brand-primary font-semibold text-base hover:bg-brand-primary/5 transition-colors w-full sm:w-auto min-w-[180px]"
            >
              Browse Properties
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
