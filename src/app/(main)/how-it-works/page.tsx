"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const roles = [
  {
    key: "buyer",
    label: "Buyer",
    steps: [
      {
        number: 1,
        icon: "magnifying-glass",
        title: "Search properties",
        description:
          "Browse thousands of verified listings with AI-powered recommendations tailored to your preferences, budget, and lifestyle.",
      },
      {
        number: 2,
        icon: "calendar",
        title: "Book viewings",
        description:
          "Schedule viewings directly through the platform. Get instant confirmations and manage your viewing calendar in one place.",
      },
      {
        number: 3,
        icon: "document",
        title: "Make an offer",
        description:
          "Submit offers digitally, track their status in real time, and negotiate directly with sellers or their agents.",
      },
      {
        number: 4,
        icon: "key",
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
        icon: "camera",
        title: "List your property",
        description:
          "Create a professional listing with photos, floor plans, and EPC data. Our tools help you set the right asking price.",
      },
      {
        number: 2,
        icon: "users",
        title: "Receive interest",
        description:
          "Get matched with qualified buyers. Review viewing requests and manage enquiries from your seller dashboard.",
      },
      {
        number: 3,
        icon: "handshake",
        title: "Accept an offer",
        description:
          "Compare offers side-by-side, verify buyer positions, and accept with confidence using our transparent process.",
      },
      {
        number: 4,
        icon: "checkmark",
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
        icon: "building",
        title: "List your rental",
        description:
          "Advertise your property to thousands of verified tenants. Set your terms, rent, and availability dates.",
      },
      {
        number: 2,
        icon: "filter",
        title: "Screen tenants",
        description:
          "Review applications with built-in referencing, credit checks, and employment verification all in one place.",
      },
      {
        number: 3,
        icon: "document",
        title: "Manage tenancies",
        description:
          "Digital tenancy agreements, automated rent collection, and maintenance request tracking from your dashboard.",
      },
      {
        number: 4,
        icon: "chart",
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
        icon: "storefront",
        title: "Set up your agency",
        description:
          "Create your verified agency profile, add team members, and configure your service areas and specialisations.",
      },
      {
        number: 2,
        icon: "megaphone",
        title: "List and market",
        description:
          "Publish listings with professional tools, manage enquiries, and use AI-powered matching to connect with buyers.",
      },
      {
        number: 3,
        icon: "pipeline",
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
        icon: "tools",
        title: "Create your profile",
        description:
          "Showcase your skills, qualifications, and past work. Get verified to build trust with potential clients.",
      },
      {
        number: 2,
        icon: "inbox",
        title: "Receive job leads",
        description:
          "Get matched with homeowners and landlords who need your services. Respond to quote requests directly.",
      },
      {
        number: 3,
        icon: "star",
        title: "Build your reputation",
        description:
          "Collect verified reviews, grow your client base, and manage your bookings all from one dashboard.",
      },
    ],
  },
] as const;

const iconMap: Record<string, React.ReactNode> = {
  "magnifying-glass": (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  ),
  calendar: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  ),
  document: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  key: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  ),
  camera: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
    </svg>
  ),
  users: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  handshake: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3.15a1.575 1.575 0 0 0 3.15 0v-3.15Zm0 0h6.375m-6.375 0a1.575 1.575 0 0 1 1.575 1.575v3.15a1.575 1.575 0 0 1-1.575 1.575m6.375-6.3a1.575 1.575 0 0 1 1.575 1.575v3.15a1.575 1.575 0 0 1-1.575 1.575m-6.375 0h6.375" />
    </svg>
  ),
  checkmark: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  building: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
    </svg>
  ),
  filter: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
    </svg>
  ),
  chart: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  storefront: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
    </svg>
  ),
  megaphone: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.544.544 0 0 1-.65-.065.483.483 0 0 1-.112-.196l-.476-1.8a27.44 27.44 0 0 1-.693-4.613m1.866 0a30.879 30.879 0 0 0 2.42-4.284 30.964 30.964 0 0 0-2.42-4.284m0 8.568a28.139 28.139 0 0 0 7.78-3.598.605.605 0 0 0 0-1.37 28.14 28.14 0 0 0-7.78-3.6" />
    </svg>
  ),
  pipeline: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
  ),
  tools: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.194-.14 1.743" />
    </svg>
  ),
  inbox: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-17.5 0a1.5 1.5 0 0 0-1.5 1.5v2.25a1.5 1.5 0 0 0 1.5 1.5h19.5a1.5 1.5 0 0 0 1.5-1.5V15a1.5 1.5 0 0 0-1.5-1.5m-17.5 0V7.875c0-1.036.84-1.875 1.875-1.875h15.75c1.035 0 1.875.84 1.875 1.875v5.625" />
    </svg>
  ),
  star: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  ),
};

export default function HowItWorksPage() {
  const [activeRole, setActiveRole] = useState<string>("buyer");
  const activeData = roles.find((r) => r.key === activeRole) ?? roles[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          How It Works
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          TrueDeed simplifies every step of the property journey. Choose your
          role to see how it works for you.
        </p>
      </div>

      {/* Role Switcher */}
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {roles.map((role) => (
          <button
            key={role.key}
            onClick={() => setActiveRole(role.key)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              activeRole === role.key
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="mt-12 space-y-8">
        {activeData.steps.map((step) => (
          <div
            key={step.number}
            className="flex gap-5 rounded-xl border border-neutral-200 p-6"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
              {iconMap[step.icon]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                  {step.number}
                </span>
                <h3 className="font-heading text-lg font-semibold text-neutral-900">
                  {step.title}
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Button asChild size="lg">
          <Link href="/register">Get Started</Link>
        </Button>
        <p className="mt-3 text-sm text-neutral-500">
          Free for homebuyers and renters. No credit card required.
        </p>
      </div>
    </div>
  );
}
