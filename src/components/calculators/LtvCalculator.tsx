"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ExternalLink, LayoutGrid } from "lucide-react";
import Link from "next/link";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

type LtvTier = {
  maxLtv: number;
  label: string;
  description: string;
  rateIndicator: string;
};

const LTV_TIERS: LtvTier[] = [
  { maxLtv: 60, label: "Elite Tier", description: "≤ 60% LTV — Best available rates", rateIndicator: "Lowest" },
  { maxLtv: 70, label: "Premier Tier", description: "61–70% LTV — Excellent rates", rateIndicator: "Very Low" },
  { maxLtv: 75, label: "Standard Tier", description: "71–75% LTV — Good rates", rateIndicator: "Low" },
  { maxLtv: 80, label: "Mid Tier", description: "76–80% LTV — Slightly higher rates", rateIndicator: "Moderate" },
  { maxLtv: 85, label: "High Tier", description: "81–85% LTV — Higher rates, fewer lenders", rateIndicator: "Higher" },
  { maxLtv: 90, label: "Upper Tier", description: "86–90% LTV — Limited products", rateIndicator: "High" },
  { maxLtv: 95, label: "Max Tier", description: "91–95% LTV — Mortgage Guarantee Scheme", rateIndicator: "Very High" },
  { maxLtv: 100, label: "Over Tier", description: "> 95% LTV — Very few products", rateIndicator: "Premium" },
];

function getTierForLtv(ltv: number): LtvTier {
  return LTV_TIERS.find((t) => ltv <= t.maxLtv) ?? LTV_TIERS[LTV_TIERS.length - 1];
}

const FAQS = [
  {
    q: "What is LTV and why does it matter?",
    a: "Loan-to-Value (LTV) is the ratio of your mortgage loan to the property value. Lenders use it to determine risk — a lower LTV typically means better interest rates because you have more equity in the property.",
  },
  {
    q: "What is a 'good' LTV for a mortgage?",
    a: "Generally, 60% LTV is considered excellent and unlocks the best mortgage rates. 75–80% is typical for many buyers, while anything above 90% will attract higher rates and fewer lender options.",
  },
  {
    q: "Can LTV change after the loan?",
    a: "Yes. As property values rise or fall, and as you repay your mortgage, your LTV changes. Remortgaging when your LTV has improved can unlock significantly better rates.",
  },
  {
    q: "Does additional borrowing affect LTV?",
    a: "Absolutely. Taking additional borrowing (e.g. for home improvements) increases your total mortgage balance, raising your LTV. It's important to factor this into your rate tier planning.",
  },
];

type LtvCalculatorProps = Readonly<{
  initialPrice?: number;
}>;

export function LtvCalculator({ initialPrice }: LtvCalculatorProps = {}) {
  const [propertyValue, setPropertyValue] = useState(initialPrice ?? 300000);
  const [outstandingMortgage, setOutstandingMortgage] = useState(180000);
  const [additionalBorrowing, setAdditionalBorrowing] = useState(0);

  const results = useMemo(() => {
    const totalBorrowing = outstandingMortgage + additionalBorrowing;
    const ltv = propertyValue > 0 ? (totalBorrowing / propertyValue) * 100 : 0;
    const equity = Math.max(0, propertyValue - totalBorrowing);
    const tier = getTierForLtv(ltv);
    return { totalBorrowing, ltv, equity, tier };
  }, [propertyValue, outstandingMortgage, additionalBorrowing]);

  return (
    <div className="space-y-8">
      {/* Main grid: inputs left, result card right */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-9">
        {/* Left Column: Inputs */}
        <Card className="lg:col-span-4 rounded-2xl border border-neutral-100 shadow-sm dark:border-neutral-800">
          <CardContent className="p-8">
            <div className="mb-6 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-brand-primary" strokeWidth={1.5} />
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
                Your Details
              </h2>
            </div>

            <div className="space-y-6">
              {/* Property Value */}
              <div className="space-y-2">
                <Label htmlFor="ltv-property-value" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Property Value
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                    &pound;
                  </span>
                  <Input
                    id="ltv-property-value"
                    type="number"
                    min={0}
                    step={1000}
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(Number(e.target.value))}
                    className="pl-8 rounded-xl border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              {/* Outstanding Mortgage */}
              <div className="space-y-2">
                <Label htmlFor="ltv-outstanding" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Outstanding Mortgage
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                    &pound;
                  </span>
                  <Input
                    id="ltv-outstanding"
                    type="number"
                    min={0}
                    step={1000}
                    value={outstandingMortgage}
                    onChange={(e) => setOutstandingMortgage(Number(e.target.value))}
                    className="pl-8 rounded-xl border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              {/* Additional Borrowing */}
              <div className="space-y-2">
                <Label htmlFor="ltv-additional" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Additional Borrowing
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                    &pound;
                  </span>
                  <Input
                    id="ltv-additional"
                    type="number"
                    min={0}
                    step={1000}
                    value={additionalBorrowing}
                    onChange={(e) => setAdditionalBorrowing(Number(e.target.value))}
                    className="pl-8 rounded-xl border-neutral-200 dark:border-neutral-700"
                  />
                </div>
                <p className="text-xs text-neutral-400">
                  Optional — for remortgage or further advance
                </p>
              </div>
            </div>

            {/* Summary row */}
            <div className="mt-8 rounded-xl border border-neutral-100 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/50">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Total borrowing</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {formatCurrency(results.totalBorrowing)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Equity in property</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {formatCurrency(results.equity)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Result Card */}
        <div className="space-y-5 lg:col-span-5">
          {/* Dark green hero result card */}
          <div className="relative overflow-hidden rounded-2xl bg-brand-primary p-8 text-white shadow-xl">
            {/* Decorative circle */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />

            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/60">
              Loan-to-Value Ratio
            </p>

            {/* Giant LTV number */}
            <div className="mb-6">
              <span className="font-heading text-7xl font-black leading-none tracking-tight text-white">
                {results.ltv.toFixed(0)}%
              </span>
            </div>

            {/* Tier badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
              <span className="text-sm font-bold text-white">
                {results.tier.label} Classification
              </span>
            </div>

            {/* Stats row */}
            <div className="mb-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  Total Borrowing
                </p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(results.totalBorrowing)}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  Property Equity
                </p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(results.equity)}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  Rate Category
                </p>
                <p className="text-lg font-bold text-white">
                  {results.tier.rateIndicator}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  Exact LTV
                </p>
                <p className="text-lg font-bold text-white">
                  {formatPercent(results.ltv)}
                </p>
              </div>
            </div>

            {/* Secure a lower rate link */}
            <Link
              href="/tools/mortgage-calculator"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-secondary transition-opacity hover:opacity-80"
            >
              Secure a Lower Rate
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Rate tier info */}
          <Card className="rounded-2xl border border-neutral-100 shadow-sm dark:border-neutral-800">
            <CardContent className="p-6">
              <h3 className="mb-1 text-sm font-bold text-neutral-900 dark:text-white">
                {results.tier.description}
              </h3>
              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Your current LTV places you in the <strong>{results.tier.label}</strong> bracket.
                {results.ltv <= 60
                  ? " You qualify for the most competitive mortgage rates available."
                  : results.ltv <= 75
                    ? " You have access to excellent rates — consider overpaying to reach ≤60%."
                    : results.ltv <= 80
                      ? " Good rates available. Reducing your LTV to 75% could unlock better deals."
                      : " Fewer lender options at this LTV. Growing your equity will improve your rate tier."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="mt-2 border-t border-neutral-100 pt-8 dark:border-neutral-800">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-5 font-heading text-xl font-bold text-neutral-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {FAQS.slice(0, 2).map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {faq.q}
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="px-5 pb-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-5 font-heading text-xl font-bold text-neutral-900 dark:text-white md:opacity-0">
              &nbsp;
            </h2>
            <div className="space-y-2">
              {FAQS.slice(2).map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {faq.q}
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="px-5 pb-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Get Quote CTA */}
        <div className="mt-8 flex items-center justify-between rounded-2xl bg-brand-primary/5 px-6 py-5 dark:bg-brand-primary/10">
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">
              Secure a Lower Rate
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Speak with an FCA-authorised broker — free, no obligation.
            </p>
          </div>
          <Link
            href="/marketplace?category=mortgage-brokers"
            className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Get Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
