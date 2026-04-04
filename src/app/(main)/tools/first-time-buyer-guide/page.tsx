"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Calculator,
  Home,
  PiggyBank,
  Info,
  GraduationCap,
  Landmark,
  Users,
  Key,
  Wallet,
  BadgeCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const gbp = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

// ---------------------------------------------------------------------------
// Guide sections
// ---------------------------------------------------------------------------

type GuideSection = {
  icon: React.ElementType;
  title: string;
  description: string;
  details: string[];
  color: string;
};

const GUIDE_SECTIONS: GuideSection[] = [
  {
    icon: BadgeCheck,
    title: "Eligibility",
    description:
      "To qualify as a first-time buyer in the UK, you must never have owned a residential property anywhere in the world. This includes inherited or gifted properties.",
    details: [
      "You must not have previously owned a freehold or leasehold interest in a dwelling",
      "This applies to properties in the UK and abroad",
      "Both buyers in a joint purchase must qualify as first-time buyers",
      "You benefit from SDLT relief on properties up to \u00a3500,000 (England & NI)",
    ],
    color: "bg-brand-primary/10 text-brand-primary",
  },
  {
    icon: PiggyBank,
    title: "Help to Buy ISA",
    description:
      "Although closed to new applicants since November 2019, existing holders can continue saving until November 2029. The government adds 25% to your savings (up to \u00a33,000 bonus).",
    details: [
      "Maximum savings of \u00a312,000 (\u00a3200/month after initial \u00a31,000)",
      "25% government bonus capped at \u00a33,000 on \u00a312,000",
      "Bonus is paid on completion, not exchange",
      "Property must be \u00a3250,000 or less (or \u00a3450,000 in London)",
    ],
    color: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent",
  },
  {
    icon: Landmark,
    title: "Lifetime ISA (LISA)",
    description:
      "Save up to \u00a34,000 per year and receive a 25% government bonus (up to \u00a31,000/year) towards your first home or retirement. Available to anyone aged 18-39.",
    details: [
      "Save up to \u00a34,000 per year with a 25% government bonus",
      "Maximum annual bonus of \u00a31,000",
      "Property must cost \u00a3450,000 or less",
      "You must have had the LISA open for at least 12 months before using it",
      "25% penalty for withdrawals not used for first home or retirement",
    ],
    color:
      "bg-brand-primary-lighter text-brand-primary-light dark:bg-brand-primary/20 dark:text-brand-primary-light",
  },
  {
    icon: Users,
    title: "Shared Ownership",
    description:
      "Buy a share of a home (25% to 75%) and pay rent on the remaining share. You can buy more shares over time through a process called \u2018staircasing\u2019.",
    details: [
      "Buy a share between 25% and 75% of the property value",
      "Pay reduced rent on the share you don't own",
      "Staircase up to full ownership over time",
      "Household income must be \u00a380,000 or less (or \u00a390,000 in London)",
      "Available on new-build and some resale properties",
    ],
    color:
      "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent",
  },
  {
    icon: Key,
    title: "Right to Buy",
    description:
      "Council tenants in England may be able to buy their home at a discount of up to \u00a3102,400 (or \u00a3136,400 in London) depending on how long they have been a tenant.",
    details: [
      "Available to secure council tenants of at least 3 years",
      "Discount based on length of tenancy and property type",
      "Maximum discount of \u00a3102,400 (\u00a3136,400 in London) as of 2025/26",
      "Houses: 35% discount after 3 years, +1% per year up to 70%",
      "Flats: 50% discount after 3 years, +2% per year up to 70%",
    ],
    color:
      "bg-warning-light text-warning dark:bg-warning/20 dark:text-warning",
  },
];

// ---------------------------------------------------------------------------
// Affordability checker
// ---------------------------------------------------------------------------

function AffordabilityChecker() {
  const [income, setIncome] = useState(35000);
  const [savings, setSavings] = useState(25000);

  const handleNumberInput =
    (setter: (v: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value);
      if (!isNaN(parsed) && parsed >= 0) setter(parsed);
      else if (e.target.value === "" || e.target.value === "-") setter(0);
    };

  const maxBorrowingLow = income * 4;
  const maxBorrowingHigh = income * 4.75;
  const maxPriceLow = maxBorrowingLow + savings;
  const maxPriceHigh = maxBorrowingHigh + savings;
  const depositPercent =
    maxPriceHigh > 0 ? ((savings / maxPriceHigh) * 100).toFixed(1) : "0.0";

  return (
    <Card className="border-brand-primary/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brand-primary/10 p-2">
            <Wallet className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <CardTitle className="text-base">
              Affordability Checker
            </CardTitle>
            <CardDescription>
              See how much you could afford as a first-time buyer.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="income">Annual Income (before tax)</Label>
            <Input
              id="income"
              type="number"
              min={0}
              step={1000}
              value={income}
              onChange={handleNumberInput(setIncome)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="savings">Total Savings / Deposit</Label>
            <Input
              id="savings"
              type="number"
              min={0}
              step={1000}
              value={savings}
              onChange={handleNumberInput(setSavings)}
            />
          </div>
        </div>

        {/* Results */}
        <div className="rounded-xl border border-[--color-outline-variant] bg-[--color-surface-container-low] p-5 dark:border-neutral-700 dark:bg-neutral-800/50">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your Estimated Affordable Range
          </p>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-brand-primary">
              {gbp(maxPriceLow)}
            </span>
            <span className="text-[--color-on-surface-variant]">&ndash;</span>
            <span className="text-2xl font-bold tabular-nums text-brand-primary">
              {gbp(maxPriceHigh)}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Borrowing (4&times; income)
              </p>
              <p className="font-semibold tabular-nums">{gbp(maxBorrowingLow)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Borrowing (4.75&times;)
              </p>
              <p className="font-semibold tabular-nums">
                {gbp(maxBorrowingHigh)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deposit %</p>
              <p className="font-semibold tabular-nums">{depositPercent}%</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Based on typical lender multiples of 4&ndash;4.75&times; income. Your
          actual borrowing capacity depends on outgoings, credit history, and
          lender criteria.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FirstTimeBuyerGuidePage() {
  return (
    <>
      {/* Breadcrumbs */}
      <div className="border-b border-[--color-outline-variant] bg-surface-container-lowest dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-[--color-on-surface-variant]">
            <Link
              href="/tools"
              className="transition-colors hover:text-brand-primary"
            >
              Tools
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-on-surface dark:text-white">
              First-Time Buyer Guide
            </span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <header className="border-b border-[--color-outline-variant] bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3 py-1 text-xs font-semibold text-brand-primary">
            <GraduationCap className="h-3.5 w-3.5" />
            Complete Guide for 2025/26
          </div>
          <h1 className="mb-4 font-heading text-4xl font-bold text-on-surface dark:text-white">
            First-Time Buyer Guide
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant]">
            Everything you need to know about buying your first home in the UK.
            From government schemes and savings options to an affordability
            checker — all in one place.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main content */}
          <div className="space-y-8 lg:col-span-8">
            {/* Affordability Checker */}
            <AffordabilityChecker />

            {/* Guide sections */}
            <div className="space-y-6">
              <h2 className="font-heading text-2xl font-bold text-on-surface dark:text-white">
                Government Schemes &amp; Eligibility
              </h2>

              {GUIDE_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <Card key={section.title}>
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${section.color}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-on-surface dark:text-white">
                            {section.title}
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant]">
                            {section.description}
                          </p>
                        </div>
                      </div>

                      <ul className="ml-14 space-y-2">
                        {section.details.map((detail) => (
                          <li
                            key={detail}
                            className="flex items-start gap-2 text-sm text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant]"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* FAQ */}
            <section className="space-y-4">
              <h3 className="font-heading text-xl font-bold text-on-surface dark:text-white">
                Frequently Asked Questions
              </h3>
              {[
                {
                  q: "How much deposit do I need as a first-time buyer?",
                  a: "Most lenders require a minimum 5% deposit, though 10-15% will unlock significantly better interest rates. For a \u00a3250,000 property, that's \u00a312,500 to \u00a337,500. Government schemes like the Lifetime ISA can help you save faster with a 25% bonus on contributions.",
                },
                {
                  q: "Can I use a Lifetime ISA and Help to Buy ISA together?",
                  a: "You can hold both, but you can only use the government bonus from one scheme per property purchase. You can still use the savings from both accounts towards your deposit.",
                },
                {
                  q: "What credit score do I need to get a mortgage?",
                  a: "There is no single magic number. Each lender has different criteria. Generally, a higher credit score gives you access to better rates. Before applying, check your credit report (free via Experian, Equifax, or TransUnion), pay off outstanding debts, and make sure you're on the electoral roll.",
                },
                {
                  q: "How long does the buying process take?",
                  a: "From having an offer accepted to completion, the process typically takes 8-12 weeks. However, it can take longer if there is a chain. First-time buyers often have an advantage as they are chain-free.",
                },
              ].map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-lg border border-[--color-outline-variant] bg-surface-container-lowest dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-on-surface dark:text-white">
                    {faq.q}
                  </summary>
                  <p className="px-5 pb-4 text-sm leading-relaxed text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant]">
                    {faq.a}
                  </p>
                </details>
              ))}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Broker CTA */}
            <div className="rounded-xl bg-brand-primary p-6 text-white shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-white/20 p-2">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Ready to Buy?</h3>
              </div>
              <p className="mb-6 text-sm text-brand-primary-lighter">
                Speak to an FCA-regulated mortgage broker who specialises in
                first-time buyers. Get expert advice on the best deals and
                schemes for you.
              </p>
              <Link
                href="/marketplace?category=mortgage-broker"
                className="block w-full rounded-lg bg-white py-3 text-center font-bold text-brand-primary transition-colors hover:bg-[--color-surface-container-low]"
              >
                Find a Broker
              </Link>
              <p className="mt-4 text-center text-[10px] text-brand-primary-lighter/60">
                Free, no-obligation advice
              </p>
            </div>

            {/* Related tools */}
            <Card>
              <CardContent className="space-y-3 p-5">
                <h3 className="font-bold text-on-surface dark:text-white">
                  Related Tools
                </h3>
                <Link
                  href="/tools/mortgage-calculator"
                  className="flex items-center gap-3 rounded-lg border border-[--color-outline-variant] p-3 transition-colors hover:bg-[--color-surface-container-low] dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <Calculator className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">Mortgage Calculator</p>
                    <p className="text-xs text-[--color-on-surface-variant]">
                      Estimate monthly repayments
                    </p>
                  </div>
                </Link>
                <Link
                  href="/tools/stamp-duty-calculator"
                  className="flex items-center gap-3 rounded-lg border border-[--color-outline-variant] p-3 transition-colors hover:bg-[--color-surface-container-low] dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <Home className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      Stamp Duty Calculator
                    </p>
                    <p className="text-xs text-[--color-on-surface-variant]">
                      Check your FTB SDLT relief
                    </p>
                  </div>
                </Link>
                <Link
                  href="/tools/moving-cost-estimator"
                  className="flex items-center gap-3 rounded-lg border border-[--color-outline-variant] p-3 transition-colors hover:bg-[--color-surface-container-low] dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <PiggyBank className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      Moving Cost Estimator
                    </p>
                    <p className="text-xs text-[--color-on-surface-variant]">
                      Budget for all buying costs
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="rounded-xl border border-dashed border-[--color-outline-variant] bg-[--color-surface-container-low]/50 p-5 dark:border-neutral-700 dark:bg-neutral-900/30">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[--color-on-surface-variant]" />
                <p className="text-[11px] italic leading-relaxed text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant]">
                  Disclaimer: This guide is for informational purposes only and
                  does not constitute financial advice. Government schemes,
                  thresholds, and rates are subject to change. Always check
                  gov.uk for the latest information and seek professional advice.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
