"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Calculator,
  PiggyBank,
  ArrowRightLeft,
  Info,
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
import { Slider } from "@/components/ui/slider";
import { calculateMonthlyPayment, calculateTotalRepayable } from "@/lib/calculators/mortgage";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const gbp = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

const gbpExact = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    value,
  );

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LTV_TIERS = [
  { label: "< 60% LTV", description: "Best rates available", color: "text-green-600", max: 60 },
  { label: "60–75% LTV", description: "Good rates", color: "text-emerald-600", max: 75 },
  { label: "75–85% LTV", description: "Standard rates", color: "text-amber-600", max: 85 },
  { label: "85–90%+ LTV", description: "Limited options, higher rates", color: "text-red-600", max: Infinity },
];

function getUrlParam(key: string, defaultValue: number): number {
  if (typeof window === "undefined") return defaultValue;
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key);
  return val !== null && !isNaN(Number(val)) ? Number(val) : defaultValue;
}

export default function RemortgageCalculatorPage() {
  const [propertyValue, setPropertyValue] = useState(() => getUrlParam("value", 350000));
  const [currentBalance, setCurrentBalance] = useState(() => getUrlParam("balance", 220000));
  const [currentRate, setCurrentRate] = useState(() => getUrlParam("currentRate", 5.5));
  const [currentTermRemaining, setCurrentTermRemaining] = useState(20);
  const [newRate, setNewRate] = useState(() => getUrlParam("newRate", 4.2));
  const [newTerm, setNewTerm] = useState(25);
  const [erc, setErc] = useState(0);

  // Sync key state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (propertyValue !== 350000) params.set("value", String(propertyValue));
    if (currentBalance !== 220000) params.set("balance", String(currentBalance));
    if (currentRate !== 5.5) params.set("currentRate", String(currentRate));
    if (newRate !== 4.2) params.set("newRate", String(newRate));
    const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [propertyValue, currentBalance, currentRate, newRate]);

  const handleNumberInput =
    (setter: (v: number) => void, min = 0) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value);
      if (!isNaN(parsed) && parsed >= min) setter(parsed);
      else if (e.target.value === "" || e.target.value === "-") setter(0);
    };

  // Current deal
  const currentMonthly = calculateMonthlyPayment(
    currentBalance,
    currentRate,
    currentTermRemaining,
  );
  const { totalRepayable: currentTotal, totalInterest: currentInterest } =
    calculateTotalRepayable(currentBalance, currentRate, currentTermRemaining);

  // New deal
  const newMonthly = calculateMonthlyPayment(currentBalance, newRate, newTerm);
  const { totalRepayable: newTotal, totalInterest: newInterest } =
    calculateTotalRepayable(currentBalance, newRate, newTerm);

  // Savings
  const monthlySaving = currentMonthly - newMonthly;
  const totalInterestSaved = currentInterest - newInterest;
  const equityPercent =
    propertyValue > 0
      ? (((propertyValue - currentBalance) / propertyValue) * 100).toFixed(1)
      : "0.0";

  // ERC break-even
  const breakEvenMonths = monthlySaving > 0 ? Math.ceil(erc / monthlySaving) : null;

  // LTV
  const ltv = propertyValue > 0 ? (currentBalance / propertyValue) * 100 : 0;
  const currentTierIndex = LTV_TIERS.findIndex((t) => ltv < t.max);

  return (
    <>
      {/* Breadcrumbs */}
      <div className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <Link
              href="/tools"
              className="transition-colors hover:text-brand-primary"
            >
              Tools
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-neutral-900 dark:text-white">
              Remortgage Calculator
            </span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <header className="border-b border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 font-heading text-4xl font-bold text-neutral-900 dark:text-white">
            Remortgage Calculator
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
            Find out how much you could save by switching your mortgage deal.
            Compare your current repayments against a new rate and term.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main content */}
          <div className="space-y-8 lg:col-span-8">
            {/* Inputs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Mortgage Details</CardTitle>
                <CardDescription>
                  Enter your current mortgage details and the new deal you are
                  considering.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="property-value">
                      Current Property Value
                    </Label>
                    <Input
                      id="property-value"
                      type="number"
                      min={0}
                      step={5000}
                      value={propertyValue}
                      onChange={handleNumberInput(setPropertyValue)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current-balance">
                      Outstanding Mortgage Balance
                    </Label>
                    <Input
                      id="current-balance"
                      type="number"
                      min={0}
                      step={1000}
                      value={currentBalance}
                      onChange={handleNumberInput(setCurrentBalance)}
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label>
                      Current Rate:{" "}
                      <span className="font-semibold">
                        {currentRate.toFixed(1)}%
                      </span>
                    </Label>
                    <Slider
                      min={0.1}
                      max={15}
                      step={0.1}
                      value={[currentRate]}
                      onValueChange={(vals) =>
                        setCurrentRate(
                          (vals as number[])[0] ?? currentRate,
                        )
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.1%</span>
                      <span>15%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current-term-remaining">
                      Remaining Term (years)
                    </Label>
                    <Input
                      id="current-term-remaining"
                      type="number"
                      min={1}
                      max={40}
                      step={1}
                      value={currentTermRemaining}
                      onChange={handleNumberInput(
                        setCurrentTermRemaining,
                        1,
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="erc">
                    Early Repayment Charge (ERC)
                  </Label>
                  <Input
                    id="erc"
                    type="number"
                    min={0}
                    step={100}
                    value={erc}
                    onChange={handleNumberInput(setErc)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter £0 if you have no ERC or are outside your deal period.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <p className="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">
                    New Deal
                  </p>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label>
                        New Rate:{" "}
                        <span className="font-semibold">
                          {newRate.toFixed(1)}%
                        </span>
                      </Label>
                      <Slider
                        min={0.1}
                        max={15}
                        step={0.1}
                        value={[newRate]}
                        onValueChange={(vals) =>
                          setNewRate((vals as number[])[0] ?? newRate)
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0.1%</span>
                        <span>15%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-term">New Term (years)</Label>
                      <Input
                        id="new-term"
                        type="number"
                        min={1}
                        max={40}
                        step={1}
                        value={newTerm}
                        onChange={handleNumberInput(setNewTerm, 1)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparison cards */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Current deal */}
              <Card className="border-neutral-300 dark:border-neutral-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-neutral-500">
                    Current Deal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">
                      Monthly Payment
                    </span>
                    <span className="text-xl font-bold tabular-nums">
                      {gbpExact(currentMonthly)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Interest
                    </span>
                    <span className="tabular-nums">{gbp(currentInterest)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Repayable
                    </span>
                    <span className="tabular-nums">{gbp(currentTotal)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Rate</span>
                    <span className="tabular-nums">
                      {currentRate.toFixed(2)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* New deal */}
              <Card className="border-brand-primary/40 dark:border-brand-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-brand-primary">
                    New Deal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">
                      Monthly Payment
                    </span>
                    <span className="text-xl font-bold tabular-nums text-brand-primary">
                      {gbpExact(newMonthly)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Interest
                    </span>
                    <span className="tabular-nums">{gbp(newInterest)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Repayable
                    </span>
                    <span className="tabular-nums">{gbp(newTotal)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Rate</span>
                    <span className="tabular-nums">{newRate.toFixed(2)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Savings summary */}
            <Card
              className={
                monthlySaving > 0
                  ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950"
                  : monthlySaving < 0
                    ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950"
                    : undefined
              }
            >
              <CardContent className="p-6">
                <div className="grid gap-6 sm:grid-cols-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Monthly Saving
                    </p>
                    <p
                      className={`text-2xl font-bold tabular-nums ${
                        monthlySaving > 0
                          ? "text-green-700 dark:text-green-400"
                          : monthlySaving < 0
                            ? "text-red-700 dark:text-red-400"
                            : ""
                      }`}
                    >
                      {monthlySaving >= 0 ? "+" : ""}
                      {gbpExact(monthlySaving)}/mo
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Interest Saved
                    </p>
                    <p
                      className={`text-2xl font-bold tabular-nums ${
                        totalInterestSaved > 0
                          ? "text-green-700 dark:text-green-400"
                          : totalInterestSaved < 0
                            ? "text-red-700 dark:text-red-400"
                            : ""
                      }`}
                    >
                      {totalInterestSaved >= 0 ? "+" : ""}
                      {gbp(totalInterestSaved)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Your Equity
                    </p>
                    <p className="text-2xl font-bold tabular-nums">
                      {equityPercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ERC / Break-even</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {gbp(erc)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {breakEvenMonths !== null
                        ? `Savings exceed ERC after ${breakEvenMonths} month${breakEvenMonths === 1 ? "" : "s"}`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LTV Rate Tiers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your LTV &amp; Rate Tiers</CardTitle>
                <CardDescription>
                  Your current loan-to-value is{" "}
                  <strong>{ltv.toFixed(1)}%</strong>. Lenders price deals based
                  on LTV bands — lower LTV typically means better rates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {LTV_TIERS.map((tier, i) => {
                    const isActive = i === currentTierIndex;
                    return (
                      <li
                        key={tier.label}
                        className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm ${
                          isActive
                            ? "bg-neutral-100 ring-1 ring-neutral-300 dark:bg-neutral-800 dark:ring-neutral-600"
                            : ""
                        }`}
                      >
                        <span className={`font-semibold ${tier.color}`}>
                          {tier.label}
                        </span>
                        <span className="text-muted-foreground">
                          {tier.description}
                          {isActive && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary">
                              You are here
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            {/* FAQ */}
            <section className="space-y-4">
              <h3 className="font-heading text-xl font-bold text-neutral-900 dark:text-white">
                Frequently Asked Questions
              </h3>
              {[
                {
                  q: "When should I remortgage?",
                  a: "Most homeowners remortgage when their initial fixed or tracker deal ends and they move onto the lender's standard variable rate (SVR), which is usually significantly higher. It's a good idea to start looking 3-6 months before your deal expires.",
                },
                {
                  q: "Are there fees for remortgaging?",
                  a: "Yes, typical costs include an early repayment charge (if still in a deal), arrangement fees (£0-£2,000), valuation fees, and legal fees. Many lenders offer free valuations and legal work for remortgage customers.",
                },
                {
                  q: "Will remortgaging affect my credit score?",
                  a: "Applying for a remortgage involves a hard credit check, which may temporarily lower your score by a few points. However, maintaining regular repayments on your new deal will positively impact your score over time.",
                },
              ].map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-neutral-900 dark:text-white">
                    {faq.q}
                  </summary>
                  <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
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
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Ready to Switch?</h3>
              </div>
              <p className="mb-6 text-sm text-blue-100">
                Get a free, no-obligation remortgage quote from an FCA-regulated
                broker on our marketplace.
              </p>
              <Link
                href="/marketplace?category=mortgage-broker"
                className="block w-full rounded-lg bg-white py-3 text-center font-bold text-brand-primary transition-colors hover:bg-neutral-50"
              >
                Find a Broker
              </Link>
              <p className="mt-4 text-center text-[10px] text-blue-200">
                Free, no-obligation quote
              </p>
            </div>

            {/* Related tools */}
            <Card>
              <CardContent className="space-y-3 p-5">
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  Related Tools
                </h3>
                <Link
                  href="/tools/mortgage-calculator"
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <PiggyBank className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">Mortgage Calculator</p>
                    <p className="text-xs text-neutral-500">
                      Estimate monthly repayments
                    </p>
                  </div>
                </Link>
                <Link
                  href="/tools/mortgage-comparison"
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <Calculator className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      Mortgage Comparison
                    </p>
                    <p className="text-xs text-neutral-500">
                      Compare lender rates side by side
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 p-5 dark:border-neutral-700 dark:bg-neutral-900/30">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <p className="text-[11px] italic leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Disclaimer: This calculator is for illustrative purposes only
                  and does not account for early repayment charges, arrangement
                  fees, or other costs. Always seek professional advice before
                  remortgaging.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
