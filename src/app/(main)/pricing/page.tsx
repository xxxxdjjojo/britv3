"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Tier = {
  name: string;
  audience: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  features: { label: string; included: boolean }[];
  cta: string;
  highlighted?: boolean;
};

const tiers: Tier[] = [
  {
    name: "Free",
    audience: "Homebuyers & Renters",
    monthlyPrice: null,
    annualPrice: null,
    features: [
      { label: "Property search & saved searches", included: true },
      { label: "AI-powered recommendations", included: true },
      { label: "Viewing bookings", included: true },
      { label: "Transaction tracking", included: true },
      { label: "Marketplace access (browse)", included: true },
      { label: "Offer management", included: false },
      { label: "Portfolio analytics", included: false },
      { label: "Team management", included: false },
      { label: "CRM tools", included: false },
      { label: "Priority support", included: false },
    ],
    cta: "Sign up free",
  },
  {
    name: "Professional",
    audience: "Agents & Landlords",
    monthlyPrice: 29,
    annualPrice: 23,
    features: [
      { label: "Property search & saved searches", included: true },
      { label: "AI-powered recommendations", included: true },
      { label: "Viewing bookings", included: true },
      { label: "Transaction tracking", included: true },
      { label: "Marketplace access (browse)", included: true },
      { label: "Offer management", included: true },
      { label: "Portfolio analytics", included: true },
      { label: "Team management", included: false },
      { label: "CRM tools", included: false },
      { label: "Priority support", included: true },
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Business",
    audience: "Agencies & Enterprises",
    monthlyPrice: 99,
    annualPrice: 79,
    features: [
      { label: "Property search & saved searches", included: true },
      { label: "AI-powered recommendations", included: true },
      { label: "Viewing bookings", included: true },
      { label: "Transaction tracking", included: true },
      { label: "Marketplace access (browse)", included: true },
      { label: "Offer management", included: true },
      { label: "Portfolio analytics", included: true },
      { label: "Team management", included: true },
      { label: "CRM tools", included: true },
      { label: "Priority support", included: true },
    ],
    cta: "Contact sales",
  },
];

function CheckIcon() {
  return (
    <svg className="size-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg className="size-5 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          Free for homebuyers and renters. Professional tools for agents,
          landlords, and agencies.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="mt-10 flex items-center justify-center gap-3">
        <span
          className={`text-sm font-medium ${!annual ? "text-neutral-900" : "text-neutral-500"}`}
        >
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual(!annual)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            annual ? "bg-neutral-900" : "bg-neutral-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
              annual ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${annual ? "text-neutral-900" : "text-neutral-500"}`}
        >
          Annual
          <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            Save 20%
          </span>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {tiers.map((tier) => {
          const price = annual ? tier.annualPrice : tier.monthlyPrice;

          return (
            <div
              key={tier.name}
              className={`flex flex-col rounded-xl border p-6 ${
                tier.highlighted
                  ? "border-neutral-900 ring-1 ring-neutral-900"
                  : "border-neutral-200"
              }`}
            >
              {tier.highlighted && (
                <span className="mb-4 inline-flex w-fit rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}

              <h3 className="font-heading text-xl font-bold text-neutral-900">
                {tier.name}
              </h3>
              <p className="mt-1 text-sm text-neutral-500">{tier.audience}</p>

              <div className="mt-4">
                {price === null ? (
                  <p className="text-3xl font-bold text-neutral-900">Free</p>
                ) : (
                  <p className="text-3xl font-bold text-neutral-900">
                    &pound;{price}
                    <span className="text-base font-normal text-neutral-500">
                      /mo
                    </span>
                  </p>
                )}
                {annual && price !== null && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Billed annually (&pound;{price * 12}/year)
                  </p>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature.label} className="flex items-center gap-2">
                    {feature.included ? <CheckIcon /> : <CrossIcon />}
                    <span
                      className={`text-sm ${
                        feature.included
                          ? "text-neutral-700"
                          : "text-neutral-400"
                      }`}
                    >
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={tier.highlighted ? "default" : "outline"}
                className="mt-8 w-full"
              >
                <Link href="/register">{tier.cta}</Link>
              </Button>
            </div>
          );
        })}
      </div>

      {/* FAQ link */}
      <p className="mt-12 text-center text-sm text-neutral-500">
        Have questions?{" "}
        <Link
          href="/contact"
          className="text-brand-primary underline-offset-4 hover:underline"
        >
          Contact our sales team
        </Link>
      </p>
    </div>
  );
}
