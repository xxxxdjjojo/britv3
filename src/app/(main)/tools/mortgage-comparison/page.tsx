"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateMonthlyPayment } from "@/lib/calculators/mortgage";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const gbpNoDecimals = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

const gbpExact = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

// ---------------------------------------------------------------------------
// Illustrative mortgage products (featured + full list)
// ---------------------------------------------------------------------------

type FeaturedProduct = {
  id: string;
  name: string;
  tagline: string;
  rate: number;
  aprc: number;
  type: string;
  ltv: string;
  term: number;
  highlighted: boolean;
};

const FEATURED_PRODUCTS: FeaturedProduct[] = [
  {
    id: "heritage",
    name: "The Heritage Fixed",
    tagline: "Security & Stability",
    rate: 4.15,
    aprc: 6.9,
    type: "2-Year Fixed",
    ltv: "60%",
    term: 25,
    highlighted: false,
  },
  {
    id: "tracker",
    name: "The Modern Tracker",
    tagline: "Flexibility & Value",
    rate: 3.74,
    aprc: 6.4,
    type: "Tracker",
    ltv: "75%",
    term: 30,
    highlighted: true,
  },
  {
    id: "artisan",
    name: "The Artisan Tier",
    tagline: "Premium Flexibility",
    rate: 4.89,
    aprc: 7.4,
    type: "5-Year Fixed",
    ltv: "85%",
    term: 25,
    highlighted: false,
  },
];

type ComparisonProduct = {
  lender: string;
  product: string;
  ltv: string;
  rate: number;
  aprc: number;
  type: string;
  dailyPayment: boolean;
};

const COMPARISON_PRODUCTS: ComparisonProduct[] = [
  { lender: "Barclays", product: "2-Year Fixed", ltv: "60%", rate: 4.15, aprc: 6.9, type: "Fixed", dailyPayment: false },
  { lender: "Barclays", product: "5-Year Fixed", ltv: "60%", rate: 4.05, aprc: 6.5, type: "Fixed", dailyPayment: false },
  { lender: "HSBC", product: "2-Year Fixed", ltv: "75%", rate: 4.45, aprc: 7.1, type: "Fixed", dailyPayment: true },
  { lender: "HSBC", product: "5-Year Fixed", ltv: "75%", rate: 4.35, aprc: 6.8, type: "Fixed", dailyPayment: true },
  { lender: "NatWest", product: "2-Year Fixed", ltv: "85%", rate: 4.89, aprc: 7.4, type: "Fixed", dailyPayment: false },
  { lender: "NatWest", product: "5-Year Fixed", ltv: "85%", rate: 4.79, aprc: 7.1, type: "Fixed", dailyPayment: false },
  { lender: "Halifax", product: "2-Year Fixed", ltv: "90%", rate: 5.24, aprc: 7.8, type: "Fixed", dailyPayment: true },
  { lender: "Halifax", product: "5-Year Fixed", ltv: "90%", rate: 5.19, aprc: 7.5, type: "Fixed", dailyPayment: true },
  { lender: "Santander", product: "Tracker", ltv: "75%", rate: 4.74, aprc: 6.9, type: "Tracker", dailyPayment: false },
  { lender: "Nationwide", product: "2-Year Fixed", ltv: "60%", rate: 4.19, aprc: 6.9, type: "Fixed", dailyPayment: true },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MortgageComparisonPage() {
  const [propertyPrice, setPropertyPrice] = useState(350000);
  const [deposit, setDeposit] = useState(50000);
  const [term, setTerm] = useState(25);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const loanAmount = Math.max(0, propertyPrice - deposit);

  const handleNumberInput =
    (setter: (v: number) => void, min = 0) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value);
      if (!isNaN(parsed) && parsed >= min) setter(parsed);
      else if (e.target.value === "") setter(0);
    };

  const comparisonWithPayments = COMPARISON_PRODUCTS.map((p) => ({
    ...p,
    monthlyPayment: calculateMonthlyPayment(loanAmount, p.rate, term),
  })).sort((a, b) => a.monthlyPayment - b.monthlyPayment);

  const cheapestPayment = comparisonWithPayments[0]?.monthlyPayment ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-400">
        <Link href="/tools" className="hover:text-brand-primary transition-colors">
          Tools
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-brand-primary">Mortgage Comparison</span>
      </nav>

      {/* Page heading */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
            Mortgage Comparison
          </h1>
          <p className="max-w-xl text-sm text-neutral-500 dark:text-neutral-400">
            Understand the tools you need to select the right mortgage product for your journey.
          </p>
        </div>
        <Link
          href="/marketplace?category=mortgage-broker"
          className="hidden shrink-0 items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-light transition-colors md:flex"
        >
          New Application
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="mb-8 rounded-xl border border-brand-secondary/30 bg-brand-secondary/5 px-4 py-3">
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          <span className="font-semibold text-brand-secondary">Important:</span>{" "}
          These rates are indicative only and not financial advice. Rates change daily — always get a
          personalised quote from an FCA-regulated broker.
        </p>
      </div>

      {/* ── Inputs bar ─────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap items-end gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex-1 min-w-[140px] space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Property Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">£</span>
            <input
              type="number"
              min={0}
              step={5000}
              value={propertyPrice}
              onChange={handleNumberInput(setPropertyPrice)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-7 pr-3 py-2.5 text-sm font-medium text-neutral-900 outline-none focus:border-brand-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[140px] space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Deposit
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">£</span>
            <input
              type="number"
              min={0}
              step={5000}
              value={deposit}
              onChange={handleNumberInput(setDeposit)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-7 pr-3 py-2.5 text-sm font-medium text-neutral-900 outline-none focus:border-brand-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>
        </div>
        <div className="min-w-[120px] space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Term (years)
          </label>
          <input
            type="number"
            min={1}
            max={40}
            step={1}
            value={term}
            onChange={handleNumberInput(setTerm, 1)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-medium text-neutral-900 outline-none focus:border-brand-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
        <div className="text-xs text-neutral-400">
          Loan:{" "}
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
            {gbpNoDecimals(loanAmount)}
          </span>{" "}
          · LTV:{" "}
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
            {propertyPrice > 0
              ? ((loanAmount / propertyPrice) * 100).toFixed(0)
              : 0}
            %
          </span>
        </div>
      </div>

      {/* ── Featured Product Cards ─────────────────────────────────────────── */}
      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURED_PRODUCTS.map((product) => {
          const monthly = calculateMonthlyPayment(loanAmount, product.rate, product.term);
          const isSelected = selectedProduct === product.id;

          if (product.highlighted) {
            return (
              <Card
                key={product.id}
                className="relative overflow-hidden rounded-2xl border-0 bg-brand-primary shadow-xl"
              >
                <CardContent className="p-6">
                  {/* Best Value badge */}
                  <div className="mb-4 flex items-center justify-between">
                    <Badge className="bg-brand-secondary text-white border-0 text-[10px] font-bold uppercase tracking-wider">
                      Best Value
                    </Badge>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                      {product.type}
                    </span>
                  </div>

                  <h3 className="mb-0.5 font-heading text-lg font-bold text-white">
                    {product.name}
                  </h3>
                  <p className="mb-5 text-xs text-white/60">{product.tagline}</p>

                  {/* Big price */}
                  <div className="mb-5">
                    <span className="font-heading text-4xl font-bold text-white">
                      {gbpNoDecimals(monthly)}
                    </span>
                    <span className="ml-1 text-sm text-white/60">/mo</span>
                  </div>

                  <div className="mb-5 space-y-2 border-t border-white/20 pt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Initial Rate</span>
                      <span className="font-semibold text-white">{product.rate}% Fixed</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">APRC</span>
                      <span className="font-semibold text-white">{product.aprc}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Max LTV</span>
                      <span className="font-semibold text-white">{product.ltv}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Term</span>
                      <span className="font-semibold text-white">{product.term} Years</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProduct(isSelected ? null : product.id)}
                    className="w-full rounded-xl bg-white py-2.5 text-sm font-bold text-brand-primary transition-colors hover:bg-neutral-50"
                  >
                    {isSelected ? "Selected ✓" : "Select Product"}
                  </button>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card
              key={product.id}
              className={`rounded-2xl border shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 ${
                isSelected ? "border-brand-primary ring-1 ring-brand-primary" : "border-neutral-200"
              }`}
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="border-neutral-200 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:border-neutral-700"
                  >
                    {product.type}
                  </Badge>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}
                </div>

                <h3 className="mb-0.5 font-heading text-lg font-bold text-neutral-900 dark:text-white">
                  {product.name}
                </h3>
                <p className="mb-5 text-xs text-neutral-400">{product.tagline}</p>

                {/* Big price */}
                <div className="mb-5">
                  <span className="font-heading text-4xl font-bold text-neutral-900 dark:text-white">
                    {gbpNoDecimals(monthly)}
                  </span>
                  <span className="ml-1 text-sm text-neutral-400">/mo</span>
                </div>

                <div className="mb-5 space-y-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Initial Rate</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {product.rate}% {product.type.includes("Fixed") ? "Fixed" : "Tracker"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">APRC</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{product.aprc}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Max LTV</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{product.ltv}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Term</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{product.term} Years</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProduct(isSelected ? null : product.id)}
                  className="w-full rounded-xl border border-brand-primary py-2.5 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-primary hover:text-white"
                >
                  {isSelected ? "Selected ✓" : "Select Product"}
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Detailed Comparison Matrix ─────────────────────────────────────── */}
      <div className="mb-10">
        <h2 className="mb-5 font-heading text-xl font-bold text-neutral-900 dark:text-white">
          Detailed Comparison Matrix
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Lender
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Product
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Medium Risk
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  LTV
                </th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Initial Rate
                </th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Monthly
                </th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  APRC
                </th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Daily Payment
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonWithPayments.map((p, i) => {
                const isCheapest = p.monthlyPayment === cheapestPayment;
                return (
                  <tr
                    key={`${p.lender}-${p.product}`}
                    className={`border-b border-neutral-100 transition-colors last:border-0 dark:border-neutral-800 ${
                      isCheapest
                        ? "bg-brand-primary-lighter/50 dark:bg-brand-primary/10"
                        : i % 2 === 0
                        ? "bg-white dark:bg-neutral-950"
                        : "bg-neutral-50/50 dark:bg-neutral-900/50"
                    }`}
                  >
                    <td className="px-5 py-3.5 font-semibold text-neutral-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {p.lender}
                        {isCheapest && (
                          <span className="rounded-md bg-brand-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand-primary">
                            Lowest
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                      {p.product}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md border border-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:border-neutral-700">
                        {p.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                      {p.ltv}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-neutral-900 dark:text-white">
                      {p.rate.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-bold text-neutral-900 dark:text-white">
                      {gbpExact(p.monthlyPayment)}/mo
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-neutral-400">
                      {p.aprc.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {p.dailyPayment ? (
                        <span className="text-brand-primary">✓</span>
                      ) : (
                        <span className="text-neutral-300 dark:text-neutral-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-xs text-neutral-400">
          Monthly payments calculated using standard amortisation. APRC figures are illustrative.
          Not regulated financial advice. Always consult an FCA-authorised mortgage broker.
        </p>
      </div>

      {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
      <div className="mb-10 rounded-2xl bg-brand-primary p-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex-1">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/60">
              Expert Guidance
            </p>
            <h3 className="mb-1 font-heading text-2xl font-bold text-white">
              Unsure which path to choose?
            </h3>
            <p className="max-w-md text-sm text-white/70">
              Our specialist advisors are available for a confidential consultation to review
              your goals and financing objectives.
            </p>
          </div>

          {/* Advisor photo area */}
          <div className="hidden md:flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-lg font-bold text-white">JV</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/marketplace?category=mortgage-broker"
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-primary transition-colors hover:bg-neutral-50"
            >
              Schedule a Call
            </Link>
            <button
              type="button"
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              Download Guide
            </button>
          </div>
        </div>
      </div>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="mb-4 font-heading text-xl font-bold text-neutral-900 dark:text-white">
          Frequently Asked Questions
        </h3>
        {[
          {
            q: "What does LTV mean?",
            a: "Loan-to-Value (LTV) is the ratio of your mortgage to the property value. A lower LTV (e.g. 60%) typically means better interest rates because you are borrowing less relative to the property price.",
          },
          {
            q: "What is the difference between rate and APRC?",
            a: "The initial rate is what you pay during the introductory period (e.g. 2 or 5 years). APRC (Annual Percentage Rate of Charge) reflects the total cost over the full mortgage term, including fees and the lender's revert rate.",
          },
          {
            q: "Should I choose a 2-year or 5-year fixed rate?",
            a: "A 2-year fix gives you flexibility to remortgage sooner but carries more uncertainty. A 5-year fix offers longer payment stability. The best choice depends on your plans and risk tolerance.",
          },
        ].map((faq) => (
          <details
            key={faq.q}
            className="group rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
          >
            <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-neutral-900 dark:text-white">
              {faq.q}
            </summary>
            <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              {faq.a}
            </p>
          </details>
        ))}
      </section>
    </div>
  );
}
