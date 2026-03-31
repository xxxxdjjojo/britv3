"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  calculateMonthlyPayment,
  calculateTotalRepayable,
} from "@/lib/calculators/mortgage";
import { useMortgageParams } from "@/hooks/useMortgageParams";

function getUrlParam(key: string, defaultValue: number): number {
  if (typeof window === "undefined") return defaultValue;
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key);
  return val !== null && !isNaN(Number(val)) ? Number(val) : defaultValue;
}

function getUrlBool(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key);
  return val !== null ? val === "1" || val === "true" : defaultValue;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatCurrencyNoDecimals = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

/** Estimate stamp duty (England rates, simplified) */
function estimateStampDuty(price: number): number {
  if (price <= 250000) return 0;
  if (price <= 925000) return (price - 250000) * 0.05;
  if (price <= 1500000) return 675000 * 0.05 + (price - 925000) * 0.1;
  return 675000 * 0.05 + 575000 * 0.1 + (price - 1500000) * 0.12;
}

/** Generate simplified repayment schedule for bar chart at key years */
function buildBarData(
  loanAmount: number,
  interestRate: number,
  termYears: number,
  interestOnly: boolean,
) {
  const monthly = interestOnly
    ? loanAmount * (interestRate / 100 / 12)
    : calculateMonthlyPayment(loanAmount, interestRate, termYears);

  const monthlyRate = interestRate / 100 / 12;
  const totalMonths = termYears * 12;

  // We'll sample 12 evenly-spaced years
  const sampleCount = Math.min(12, termYears);
  const step = termYears / sampleCount;

  const bars: Array<{ year: number; principal: number; interest: number }> = [];

  for (let i = 0; i < sampleCount; i++) {
    const year = Math.round(step * (i + 0.5));
    const monthIndex = Math.min(year * 12 - 1, totalMonths - 1);

    let remainingBalance = loanAmount;
    if (!interestOnly && monthlyRate > 0) {
      // Balance after `monthIndex` months
      const compFactor = Math.pow(1 + monthlyRate, monthIndex + 1);
      remainingBalance = loanAmount * compFactor - monthly * ((compFactor - 1) / monthlyRate);
      remainingBalance = Math.max(0, remainingBalance);
    } else if (interestOnly) {
      remainingBalance = loanAmount;
    }

    // Monthly breakdown at this point
    const interestPart = remainingBalance * monthlyRate;
    const principalPart = interestOnly ? 0 : Math.max(0, monthly - interestPart);

    bars.push({ year, principal: principalPart, interest: interestPart });
  }

  return { bars, maxPayment: monthly };
}

type MortgageCalculatorProps = Readonly<{
  initialPrice?: number;
}>;

export function MortgageCalculator({ initialPrice }: MortgageCalculatorProps = {}) {
  const { saveParams } = useMortgageParams();

  // ── Input state ──────────────────────────────────────────────────────────
  const [propertyPrice, setPropertyPrice] = useState(() => initialPrice ?? getUrlParam("price", 1250000));
  const [deposit, setDeposit] = useState(() => getUrlParam("deposit", 250000));
  const [interestRate, setInterestRate] = useState(() => getUrlParam("rate", 4.25));
  const [termYears, setTermYears] = useState(() => getUrlParam("term", 25));
  const [interestOnly, setInterestOnly] = useState(() => getUrlBool("io", false));

  // ── Pending state (applied on "Update Analysis") ─────────────────────────
  const [pendingPrice, setPendingPrice] = useState(propertyPrice);
  const [pendingDeposit, setPendingDeposit] = useState(deposit);
  const [pendingRate, setPendingRate] = useState(interestRate);
  const [pendingTerm, setPendingTerm] = useState(termYears);
  const [pendingInterestOnly, setPendingInterestOnly] = useState(interestOnly);

  // Sync URL
  useEffect(() => {
    if (initialPrice != null) return;
    const params = new URLSearchParams();
    if (propertyPrice !== 1250000) params.set("price", String(propertyPrice));
    if (deposit !== 250000) params.set("deposit", String(deposit));
    if (interestRate !== 4.25) params.set("rate", String(interestRate));
    if (termYears !== 25) params.set("term", String(termYears));
    if (interestOnly) params.set("io", "1");
    const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [propertyPrice, deposit, interestRate, termYears, interestOnly, initialPrice]);

  const depositPercent = useMemo(() => {
    if (propertyPrice <= 0) return 0;
    return Math.round((deposit / propertyPrice) * 1000) / 10;
  }, [deposit, propertyPrice]);

  const loanAmount = useMemo(
    () => Math.max(0, propertyPrice - deposit),
    [propertyPrice, deposit],
  );

  const results = useMemo(() => {
    const monthlyPayment = interestOnly
      ? Math.round(loanAmount * (interestRate / 100 / 12) * 100) / 100
      : calculateMonthlyPayment(loanAmount, interestRate, termYears);

    let totalRepayable: number;
    let totalInterest: number;
    if (interestOnly) {
      totalInterest = monthlyPayment * termYears * 12;
      totalRepayable = totalInterest + loanAmount;
    } else {
      const result = calculateTotalRepayable(loanAmount, interestRate, termYears);
      totalRepayable = result.totalRepayable;
      totalInterest = result.totalInterest;
    }

    const ltv = propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0;
    const stampDuty = estimateStampDuty(propertyPrice);

    return { monthlyPayment, totalRepayable, totalInterest, ltv, stampDuty };
  }, [loanAmount, interestRate, termYears, propertyPrice, interestOnly]);

  // ── Bar chart data ────────────────────────────────────────────────────────
  const { bars, maxPayment } = useMemo(
    () => buildBarData(loanAmount, interestRate, termYears, interestOnly),
    [loanAmount, interestRate, termYears, interestOnly],
  );

  const applyAnalysis = () => {
    setPropertyPrice(pendingPrice);
    setDeposit(pendingDeposit);
    setInterestRate(pendingRate);
    setTermYears(pendingTerm);
    setInterestOnly(pendingInterestOnly);
    saveParams({ deposit: pendingDeposit, interestRate: pendingRate, termYears: pendingTerm });
  };

  // ── Derived label years for chart ─────────────────────────────────────────
  const midYear = Math.round(termYears / 2);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-9">
      {/* ── Left: Financial Inputs ── */}
      <Card className="lg:col-span-4 rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
        <CardContent className="p-8">
          <h2 className="mb-6 text-base font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Financial Inputs
          </h2>

          <div className="space-y-5">
            {/* Property Price */}
            <div className="space-y-1.5">
              <Label
                htmlFor="mc-price"
                className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
              >
                Property Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                  £
                </span>
                <Input
                  id="mc-price"
                  type="number"
                  min={0}
                  step={1000}
                  value={pendingPrice}
                  onChange={(e) => setPendingPrice(Number(e.target.value))}
                  className="pl-7 h-11 rounded-xl border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-900 focus:border-brand-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
            </div>

            {/* Deposit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="mc-deposit"
                  className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
                >
                  Deposit
                </Label>
                <span className="text-[10px] font-semibold text-neutral-400">
                  {pendingPrice > 0
                    ? Math.round((pendingDeposit / pendingPrice) * 1000) / 10
                    : 0}
                  %
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                  £
                </span>
                <Input
                  id="mc-deposit"
                  type="number"
                  min={0}
                  step={1000}
                  value={pendingDeposit}
                  onChange={(e) => setPendingDeposit(Number(e.target.value))}
                  className="pl-7 h-11 rounded-xl border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-900 focus:border-brand-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
            </div>

            {/* Interest Rate + Loan Term (side by side) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="mc-rate"
                  className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
                >
                  Interest Rate
                </Label>
                <div className="relative">
                  <Input
                    id="mc-rate"
                    type="number"
                    min={0}
                    max={20}
                    step={0.05}
                    value={pendingRate}
                    onChange={(e) => setPendingRate(Number(e.target.value))}
                    className="pr-7 h-11 rounded-xl border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-900 focus:border-brand-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="mc-term"
                  className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
                >
                  Loan Term
                </Label>
                <div className="relative">
                  <Input
                    id="mc-term"
                    type="number"
                    min={1}
                    max={40}
                    step={1}
                    value={pendingTerm}
                    onChange={(e) => setPendingTerm(Number(e.target.value))}
                    className="pr-10 h-11 rounded-xl border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-900 focus:border-brand-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-neutral-400">
                    Yrs
                  </span>
                </div>
              </div>
            </div>

            {/* Repayment / Interest Only toggle */}
            <div className="flex overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setPendingInterestOnly(false)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  !pendingInterestOnly
                    ? "bg-brand-primary text-white"
                    : "bg-white text-neutral-500 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400"
                }`}
              >
                Repayment
              </button>
              <button
                type="button"
                onClick={() => setPendingInterestOnly(true)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  pendingInterestOnly
                    ? "bg-brand-primary text-white"
                    : "bg-white text-neutral-500 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400"
                }`}
              >
                Interest Only
              </button>
            </div>

            {/* Update Analysis */}
            <Button
              onClick={applyAnalysis}
              className="w-full h-11 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-primary-light"
            >
              Update Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Right: Results ── */}
      <div className="space-y-4 lg:col-span-5">
        {/* Main result card */}
        <Card className="rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
          <CardContent className="p-8">
            {/* Header row */}
            <div className="mb-1 flex items-start justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Estimated Monthly Repayment
              </p>
              <span className="rounded-md border border-brand-secondary/40 bg-brand-secondary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
                LTV Ratio {results.ltv.toFixed(0)}%
              </span>
            </div>

            {/* Big number */}
            <p className="mb-6 font-heading text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {formatCurrency(results.monthlyPayment)}
            </p>

            {/* Bar chart */}
            <div className="mb-2">
              <div className="flex items-end gap-1 h-24">
                {bars.map((bar, i) => {
                  const total = bar.principal + bar.interest;
                  const principalPct = maxPayment > 0 ? (bar.principal / maxPayment) * 100 : 0;
                  const interestPct = maxPayment > 0 ? (bar.interest / maxPayment) * 100 : 0;
                  const isLast = i === bars.length - 1;
                  return (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center gap-0 justify-end h-full"
                      title={`Year ${bar.year}: ${formatCurrencyNoDecimals(total)}/mo`}
                    >
                      <div className="flex w-full flex-col justify-end gap-0" style={{ height: "100%" }}>
                        {/* Interest portion (top, lighter) */}
                        <div
                          className={`w-full rounded-t-sm ${isLast ? "bg-brand-secondary" : "bg-brand-primary/30"}`}
                          style={{ height: `${interestPct}%` }}
                        />
                        {/* Principal portion (bottom, solid) */}
                        <div
                          className={`w-full ${isLast ? "bg-brand-secondary/70" : "bg-brand-primary"}`}
                          style={{ height: `${principalPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* X-axis labels */}
              <div className="mt-2 flex items-center justify-between px-0">
                <span className="text-[9px] font-semibold uppercase text-neutral-400">
                  Year 0
                </span>
                <span className="text-[9px] font-semibold uppercase text-neutral-400">
                  Year {midYear}
                </span>
                <span className="text-[9px] font-semibold uppercase text-neutral-400">
                  Year {termYears}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Three stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
            <CardContent className="p-4">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                Total Repayable
              </p>
              <p className="font-heading text-base font-bold text-neutral-900 dark:text-white">
                {formatCurrencyNoDecimals(results.totalRepayable)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
            <CardContent className="p-4">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                Total Interest
              </p>
              <p className="font-heading text-base font-bold text-neutral-900 dark:text-white">
                {formatCurrencyNoDecimals(results.totalInterest)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-brand-secondary/30 bg-brand-secondary/5 shadow-sm dark:border-neutral-800">
            <CardContent className="p-4">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-brand-secondary">
                Stamp Duty (Est)
              </p>
              <p className="font-heading text-base font-bold text-brand-secondary">
                {formatCurrencyNoDecimals(results.stampDuty)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA card */}
        <Card className="rounded-2xl bg-brand-primary shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="mb-0.5 text-sm font-bold text-white">
                Ready to apply?
              </p>
              <p className="text-xs text-white/70">
                Compare 1,000s of rates instantly.
              </p>
              <Link
                href="/marketplace?category=mortgage-broker"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/90 underline underline-offset-2 hover:text-white"
              >
                Check Rates →
              </Link>
            </div>
            {/* Advisor card */}
            <div className="flex items-center gap-3 border-l border-white/20 pl-5">
              <div className="h-10 w-10 rounded-full bg-white/20 overflow-hidden flex items-center justify-center">
                <span className="text-xs font-bold text-white">JV</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white">Julianne Vane</p>
                <p className="text-[9px] text-white/60">Senior Portfolio Advisor</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/80">
                  Speak to an Expert
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
