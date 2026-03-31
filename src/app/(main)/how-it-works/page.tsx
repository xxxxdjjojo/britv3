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
  HandshakeIcon,
  CheckCircle,
  Building,
  Filter,
  BarChart,
  Store,
  Megaphone,
  Layers,
  Wrench,
  Inbox,
  Star,
  ArrowRight,
  ChevronRight,
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
  steps: Step[];
};

const roles: Role[] = [
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
        icon: HandshakeIcon,
        title: "Accept an offer",
        description:
          "Compare offers side-by-side, verify buyer positions, and accept with confidence using our transparent process.",
      },
      {
        number: 4,
        icon: CheckCircle,
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
        icon: Building,
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
        icon: BarChart,
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
        icon: Layers,
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
];

const STATS = [
  { value: "25,000+", label: "Verified Listings" },
  { value: "5,000+", label: "Verified Pros" },
  { value: "50,000+", label: "Happy Users" },
  { value: "4.9/5", label: "Average Rating" },
];

export default function HowItWorksPage() {
  const [activeRole, setActiveRole] = useState<string>("buyer");
  const activeData = roles.find((r) => r.key === activeRole) ?? roles[0];

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-primary text-white py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold backdrop-blur-sm">
            <Search className="size-4" />
            <span>Simple. Transparent. Intelligent.</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            How Britestate Works
          </h1>
          <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            From first search to moving day — Britestate guides you every step
            of the way. Choose your role to see how it works for you.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-brand-primary-lighter border-b border-brand-primary/10">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="font-heading text-2xl font-bold text-brand-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-neutral-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Switcher + Steps */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              Your journey, your way
            </h2>
            <p className="text-neutral-600 text-lg max-w-xl mx-auto">
              Select your role to see the tailored experience Britestate provides.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-14">
            {roles.map((role) => (
              <button
                key={role.key}
                onClick={() => setActiveRole(role.key)}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                  activeRole === role.key
                    ? "bg-brand-primary text-white shadow-md"
                    : "bg-neutral-100 text-neutral-600 hover:bg-brand-primary-lighter hover:text-brand-primary"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {activeData.steps.map((step, i) => (
              <div
                key={step.number}
                className="relative flex flex-col gap-4 p-6 rounded-2xl bg-neutral-50 hover:bg-brand-primary-lighter transition-colors group"
              >
                {/* Connector arrow on desktop */}
                {i < activeData.steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className="size-5 text-neutral-400" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all shrink-0">
                    <step.icon className="size-5" />
                  </div>
                  <span className="size-7 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {step.number}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-neutral-900 mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-neutral-50 py-20 lg:py-28">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              Everything in one platform
            </h2>
            <p className="text-neutral-600 text-lg max-w-xl mx-auto">
              No more switching between apps and services. Britestate handles
              the entire property journey end-to-end.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "AI-Powered Search",
                description:
                  "Describe your ideal home in plain English. Our AI understands schools, commute times, and lifestyle preferences to surface perfect matches.",
              },
              {
                icon: Users,
                title: "Verified Professionals",
                description:
                  "Every agent, solicitor, and tradesperson passes our rigorous 3-client + 3-peer verification process before joining the platform.",
              },
              {
                icon: Key,
                title: "End-to-End Transactions",
                description:
                  "From offer to keys in one place. Digital contracts, secure deposits, and real-time progress tracking keep everyone in the loop.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-4 p-8 rounded-2xl bg-white shadow-sm border border-neutral-100 hover:shadow-md transition-shadow"
              >
                <div className="size-12 rounded-xl bg-brand-primary-lighter text-brand-primary flex items-center justify-center">
                  <feature.icon className="size-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-primary text-white py-20">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Free for homebuyers and renters. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-brand-primary text-sm font-semibold hover:bg-brand-primary-lighter transition-colors shadow-md"
            >
              Create a free account
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Browse properties
            </Link>
          </div>
          <p className="mt-6 text-white/60 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-white underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
