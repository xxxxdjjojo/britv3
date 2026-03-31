"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { LayoutGrid, TrendingUp, Download } from "lucide-react";
import Link from "next/link";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

type EquityClassification = {
  label: string;
  description: string;
};

function classifyEquity(pct: number): EquityClassification {
  if (pct >= 50) return { label: "High Equity", description: "Excellent equity position — strong remortgage options available." };
  if (pct >= 25) return { label: "Good Equity", description: "Solid equity position — you have meaningful ownership in your home." };
  if (pct >= 10) return { label: "Building Equity", description: "Growing equity — continue overpaying to improve your position." };
  return { label: "Low Equity", description: "Low equity position — focus on reducing your mortgage balance." };
}

type ProjectionYear = {
  year: number;
  projectedValue: number;
  projectedEquity: number;
  equityPct: number;
};

function buildProjections(
  propertyValue: number,
  mortgageBalance: number,
  growthPct: number,
  years: number,
): ProjectionYear[] {
  const points: ProjectionYear[] = [];
  const step = Math.max(1, Math.floor(years / 5));
  for (let yr = step; yr <= years; yr += step) {
    const projectedValue = propertyValue * Math.pow(1 + growthPct / 100, yr);
    const projectedEquity = Math.max(0, projectedValue - mortgageBalance);
    const equityPct = projectedValue > 0 ? (projectedEquity / projectedValue) * 100 : 0;
    points.push({ year: yr, projectedValue, projectedEquity, equityPct });
  }
  // Ensure the final year is always included
  const lastPushed = points[points.length - 1];
  if (!lastPushed || lastPushed.year !== years) {
    const projectedValue = propertyValue * Math.pow(1 + growthPct / 100, years);
    const projectedEquity = Math.max(0, projectedValue - mortgageBalance);
    const equityPct = projectedValue > 0 ? (projectedEquity / projectedValue) * 100 : 0;
    points.push({ year: years, projectedValue, projectedEquity, equityPct });
  }
  return points;
}

const FAQS = [
  {
    q: "What is home equity exactly?",
    a: "Home equity is the difference between the current market value of your property and the amount you still owe on your mortgage. As you pay down your loan or as property prices rise, your equity increases.",
  },
  {
    q: "Why does LTV matter?",
    a: "Your Loan-to-Value ratio directly affects the mortgage rates you can access. Lower LTV means higher equity and better rate tiers — potentially saving thousands over your mortgage term.",
  },
  {
    q: "How can I grow my equity?",
    a: "You can grow equity through mortgage overpayments, home improvements that add value, and property price appreciation over time. Even small monthly overpayments compound significantly over the years.",
  },
  {
    q: "Are these projections guaranteed?",
    a: "No. Projections are based on your specified annual growth rate applied consistently. Actual property values fluctuate with market conditions. This calculator is for illustrative planning purposes only.",
  },
];

type EquityCalculatorProps = Readonly<{
  initialPropertyValue?: number;
}>;

export function EquityCalculator({ initialPropertyValue }: EquityCalculatorProps = {}) {
  const [propertyValue, setPropertyValue] = useState(initialPropertyValue ?? 750000);
  const [mortgageBalance, setMortgageBalance] = useState(320000);
  const [annualGrowth, setAnnualGrowth] = useState(3.5);
  const [projectionYears, setProjectionYears] = useState(10);

  const results = useMemo(() => {
    const equity = Math.max(0, propertyValue - mortgageBalance);
    const equityPct = propertyValue > 0 ? (equity / propertyValue) * 100 : 0;
    const classification = classifyEquity(equityPct);
    const projections = buildProjections(propertyValue, mortgageBalance, annualGrowth, projectionYears);

    const fiveYrPoint = projections.find((p) => p.year === 5) ?? projections[Math.floor(projections.length / 2)];
    const finalPoint = projections[projections.length - 1];

    return { equity, equityPct, classification, projections, fiveYrPoint, finalPoint };
  }, [propertyValue, mortgageBalance, annualGrowth, projectionYears]);

  // Bar chart helpers
  const maxEquity = Math.max(...results.projections.map((p) => p.projectedEquity), results.equity);

  return (
    <div className="space-y-8">
      {/* Main grid */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-9">
        {/* Left: Inputs */}
        <Card className="lg:col-span-4 rounded-2xl border border-neutral-100 shadow-sm dark:border-neutral-800">
          <CardContent className="p-8">
            <div className="mb-6 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-brand-primary" strokeWidth={1.5} />
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
                Property Details
              </h2>
            </div>

            <div className="space-y-6">
              {/* Property Current Value */}
              <div className="space-y-2">
                <Label htmlFor="eq-property-value" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Property Current Value
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                    &pound;
                  </span>
                  <Input
                    id="eq-property-value"
                    type="number"
                    min={0}
                    step={5000}
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(Number(e.target.value))}
                    className="pl-8 rounded-xl border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              {/* Remaining Mortgage Balance */}
              <div className="space-y-2">
                <Label htmlFor="eq-mortgage-balance" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Remaining Mortgage Balance
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                    &pound;
                  </span>
                  <Input
                    id="eq-mortgage-balance"
                    type="number"
                    min={0}
                    step={5000}
                    value={mortgageBalance}
                    onChange={(e) => setMortgageBalance(Number(e.target.value))}
                    className="pl-8 rounded-xl border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              {/* Annual Growth Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="eq-growth" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Annual Growth Assumption
                  </Label>
                  <span className="text-sm font-bold text-brand-primary">{annualGrowth.toFixed(1)}%</span>
                </div>
                <Input
                  id="eq-growth"
                  type="number"
                  min={-5}
                  max={20}
                  step={0.5}
                  value={annualGrowth}
                  onChange={(e) => setAnnualGrowth(Number(e.target.value))}
                  className="rounded-xl border-neutral-200 dark:border-neutral-700"
                />
              </div>

              {/* Projection Period Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Projection Period
                  </Label>
                  <span className="text-sm font-bold text-brand-primary">{projectionYears} years</span>
                </div>
                <Slider
                  min={1}
                  max={30}
                  step={1}
                  value={[projectionYears]}
                  onValueChange={(val) => setProjectionYears(Array.isArray(val) ? (val[0] ?? projectionYears) : val)}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] font-medium text-neutral-400">
                  <span>1 yr</span>
                  <span>15 yrs</span>
                  <span>30 yrs</span>
                </div>
              </div>
            </div>

            {/* Recalculate button (visual — calculations are live) */}
            <button
              type="button"
              className="mt-8 w-full rounded-xl bg-brand-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Recalculate Equity
            </button>
          </CardContent>
        </Card>

        {/* Right: Results */}
        <div className="space-y-5 lg:col-span-5">
          {/* Dark green hero result card */}
          <div className="relative overflow-hidden rounded-2xl bg-brand-primary p-8 text-white shadow-xl">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />

            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/60">
              Total Estimated Equity
            </p>

            <div className="mb-2">
              <span className="font-heading text-6xl font-black leading-none tracking-tight text-white">
                {formatCurrency(results.equity)}
              </span>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl font-bold text-white/80">
                {formatPercent(results.equityPct)}
              </span>
              <span className="text-sm text-white/60">equity ratio</span>
              <span className="ml-auto inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                {results.classification.label}
              </span>
            </div>

            {/* 5yr / final year stat cards */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  5-Year Equity
                </p>
                <p className="text-lg font-bold text-white">
                  {results.fiveYrPoint ? formatCurrency(results.fiveYrPoint.projectedEquity) : "—"}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  Mortgage Potential ({projectionYears}yr)
                </p>
                <p className="text-lg font-bold text-white">
                  {results.finalPoint ? formatCurrency(results.finalPoint.projectedEquity) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Projected Equity Growth bar chart */}
          <Card className="rounded-2xl border border-neutral-100 shadow-sm dark:border-neutral-800">
            <CardContent className="p-6">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Projected Equity Growth
                </h3>
                <span className="text-[10px] font-medium text-neutral-400">
                  Based on {annualGrowth.toFixed(1)}% annual appreciation
                </span>
              </div>

              {/* Bar chart */}
              <div className="mt-5 flex items-end gap-2 h-32">
                {/* Current equity bar */}
                <div className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-neutral-200 dark:bg-neutral-700 transition-all duration-500"
                    style={{ height: `${Math.max(4, (results.equity / maxEquity) * 128)}px` }}
                  />
                  <span className="text-[9px] font-medium text-neutral-400">Now</span>
                </div>
                {results.projections.map((p) => (
                  <div key={p.year} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-lg bg-brand-primary transition-all duration-500"
                      style={{
                        height: `${Math.max(4, (p.projectedEquity / maxEquity) * 128)}px`,
                        opacity: 0.4 + (0.6 * (p.year / projectionYears)),
                      }}
                    />
                    <span className="text-[9px] font-medium text-neutral-400">{p.year}yr</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Equity Release Strategy card */}
          <div className="rounded-2xl border border-brand-secondary/30 bg-brand-secondary/5 p-6 dark:border-brand-secondary/20 dark:bg-brand-secondary/5">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-secondary" strokeWidth={1.5} />
              <p className="text-xs font-bold uppercase tracking-widest text-brand-secondary">
                Equity Release Strategy
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              You have <strong>{formatCurrency(results.equity)}</strong> in potential equity. The right
              remortgage strategy could unlock preferential rates for your next milestone.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-secondary transition-opacity hover:opacity-80"
            >
              <Download className="h-3.5 w-3.5" />
              Download Equity Guide
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="mt-2 border-t border-neutral-100 pt-8 dark:border-neutral-800">
        <h2 className="mb-6 font-heading text-xl font-bold text-neutral-900 dark:text-white">
          Understanding Home Equity
        </h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {faq.q}
                <svg
                  className="h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-5 pb-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                {faq.a}
              </p>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 flex items-center justify-between rounded-2xl bg-brand-primary/5 px-6 py-5 dark:bg-brand-primary/10">
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">
              Maximise Your Equity Position
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Speak with a remortgage specialist — free, no obligation.
            </p>
          </div>
          <Link
            href="/marketplace?category=mortgage-brokers"
            className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Get Advice
          </Link>
        </div>
      </section>
    </div>
  );
}
