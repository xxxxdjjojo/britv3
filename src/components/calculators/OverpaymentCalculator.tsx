"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { TrendingDown, Clock, Calendar, Percent, ChevronRight } from "lucide-react";
import { calculateMonthlyPayment } from "@/lib/calculators/mortgage";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatMonths = (months: number): string => {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (years === 0) return `${remainder}m`;
  if (remainder === 0) return `${years}y`;
  return `${years}y${remainder}m`;
};

/**
 * Amortises a loan with optional regular monthly overpayments.
 * Returns total interest paid and number of months to pay off.
 * Respects an optional ERC-free annual cap (default 10% of original balance per year).
 */
function amortiseWithOverpayment(
  principal: number,
  annualRate: number,
  termYears: number,
  monthlyOverpayment: number,
  annualCapPct: number,
): { totalInterest: number; months: number } {
  if (principal <= 0 || termYears <= 0) {
    return { totalInterest: 0, months: 0 };
  }

  const monthlyRate = annualRate / 100 / 12;
  const maxMonths = termYears * 12;
  const basePayment = calculateMonthlyPayment(principal, annualRate, termYears);

  let balance = principal;
  let totalInterest = 0;
  let month = 0;
  let yearOverpaid = 0;
  let currentYear = 0;
  const annualCap = (annualCapPct / 100) * principal;

  while (balance > 0 && month < maxMonths * 2) {
    // New year: reset annual overpayment tracker
    const thisYear = Math.floor(month / 12);
    if (thisYear > currentYear) {
      currentYear = thisYear;
      yearOverpaid = 0;
    }

    const interestThisMonth = balance * monthlyRate;
    totalInterest += interestThisMonth;

    let payment = basePayment;

    // Apply overpayment up to annual cap
    const headroom = annualCap - yearOverpaid;
    const actualOverpayment = Math.min(monthlyOverpayment, Math.max(0, headroom));
    payment += actualOverpayment;
    yearOverpaid += actualOverpayment;

    balance = balance - payment + interestThisMonth;

    if (balance <= 0) {
      month++;
      break;
    }

    month++;
  }

  return { totalInterest: Math.round(totalInterest), months: month };
}

type OverpaymentCalculatorProps = Readonly<{
  initialLoan?: number;
}>;

export function OverpaymentCalculator({ initialLoan }: OverpaymentCalculatorProps = {}) {
  const [loanAmount, setLoanAmount] = useState(initialLoan ?? 240000);
  const [annualRate, setAnnualRate] = useState(4.5);
  const [termYears, setTermYears] = useState(25);
  const [monthlyOverpayment, setMonthlyOverpayment] = useState(200);
  const [annualCapPct, setAnnualCapPct] = useState(10);

  const basePayment = useMemo(
    () => calculateMonthlyPayment(loanAmount, annualRate, termYears),
    [loanAmount, annualRate, termYears],
  );

  const baseResult = useMemo(
    () => amortiseWithOverpayment(loanAmount, annualRate, termYears, 0, annualCapPct),
    [loanAmount, annualRate, termYears, annualCapPct],
  );

  const overpayResult = useMemo(
    () =>
      amortiseWithOverpayment(
        loanAmount,
        annualRate,
        termYears,
        monthlyOverpayment,
        annualCapPct,
      ),
    [loanAmount, annualRate, termYears, monthlyOverpayment, annualCapPct],
  );

  const interestSaved = baseResult.totalInterest - overpayResult.totalInterest;
  const monthsSaved = baseResult.months - overpayResult.months;

  // Mortgage-free year
  const currentYear = new Date().getFullYear();
  const mortgageFreeYear = currentYear + Math.ceil(overpayResult.months / 12);

  // Build a simple year-by-year balance comparison (every 5 years)
  const milestones: Array<{ year: number; baseBalance: number; overBalance: number }> = useMemo(() => {
    if (loanAmount <= 0 || annualRate <= 0 || termYears <= 0) return [];

    const monthlyRate = annualRate / 100 / 12;
    const basePaymentAmt = calculateMonthlyPayment(loanAmount, annualRate, termYears);
    const maxMonths = termYears * 12;
    const annualCap = (annualCapPct / 100) * loanAmount;

    let baseBal = loanAmount;
    let overBal = loanAmount;
    let yearOverpaid = 0;
    let currentYearIdx = 0;
    const points: Array<{ year: number; baseBalance: number; overBalance: number }> = [
      { year: 0, baseBalance: loanAmount, overBalance: loanAmount },
    ];

    for (let m = 0; m < maxMonths; m++) {
      const thisYear = Math.floor(m / 12);
      if (thisYear > currentYearIdx) {
        currentYearIdx = thisYear;
        yearOverpaid = 0;
        if (thisYear % 5 === 0) {
          points.push({
            year: thisYear,
            baseBalance: Math.max(0, baseBal),
            overBalance: Math.max(0, overBal),
          });
        }
      }

      if (baseBal > 0) {
        const bi = baseBal * monthlyRate;
        baseBal = baseBal + bi - basePaymentAmt;
      }

      if (overBal > 0) {
        const oi = overBal * monthlyRate;
        const headroom = annualCap - yearOverpaid;
        const actualOP = Math.min(monthlyOverpayment, Math.max(0, headroom));
        yearOverpaid += actualOP;
        overBal = overBal + oi - basePaymentAmt - actualOP;
      }
    }

    points.push({
      year: termYears,
      baseBalance: 0,
      overBalance: Math.max(0, overBal),
    });

    return points;
  }, [loanAmount, annualRate, termYears, monthlyOverpayment, annualCapPct]);

  const maxBalance = loanAmount;

  // SVG line chart dimensions
  const chartW = 400;
  const chartH = 120;
  const padL = 0;
  const padT = 8;
  const padB = 20;
  const plotH = chartH - padT - padB;

  const toX = (year: number) => {
    if (milestones.length < 2) return padL;
    const maxY = milestones[milestones.length - 1]?.year ?? termYears;
    return padL + (year / maxY) * chartW;
  };
  const toY = (bal: number) => padT + plotH - (bal / maxBalance) * plotH;

  const basePath = milestones
    .map((m, i) => `${i === 0 ? "M" : "L"} ${toX(m.year).toFixed(1)} ${toY(m.baseBalance).toFixed(1)}`)
    .join(" ");

  const overPath = milestones
    .map((m, i) => `${i === 0 ? "M" : "L"} ${toX(m.year).toFixed(1)} ${toY(m.overBalance).toFixed(1)}`)
    .join(" ");

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      {/* Left Column: Inputs */}
      <div className="space-y-6">
        {/* Current Mortgage Details */}
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardContent className="p-6">
            <h2 className="font-heading mb-5 text-base font-bold text-neutral-900 dark:text-white">
              Current Mortgage Details
            </h2>

            <div className="space-y-5">
              {/* Loan Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="op-loan" className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Outstanding Balance
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                    £
                  </span>
                  <Input
                    id="op-loan"
                    type="number"
                    min={0}
                    step={1000}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="pl-7 h-10 text-sm border-neutral-200 dark:border-neutral-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Rate + Term in a 2-col grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="op-rate" className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Interest Rate
                  </Label>
                  <div className="relative">
                    <Input
                      id="op-rate"
                      type="number"
                      min={0}
                      max={20}
                      step={0.1}
                      value={annualRate}
                      onChange={(e) => setAnnualRate(Number(e.target.value))}
                      className="pr-7 h-10 text-sm border-neutral-200 dark:border-neutral-700 rounded-lg"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Remaining Term
                  </Label>
                  <div
                    className="flex h-10 items-center justify-between rounded-lg border border-neutral-200 px-3 dark:border-neutral-700"
                  >
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {termYears} years
                    </span>
                  </div>
                </div>
              </div>

              {/* Term Slider */}
              <div className="space-y-2">
                <Slider
                  min={1}
                  max={40}
                  step={1}
                  value={[termYears]}
                  onValueChange={(val) =>
                    setTermYears(Array.isArray(val) ? val[0] : val)
                  }
                />
                <div className="flex justify-between text-[10px] font-medium text-neutral-400">
                  <span>1 year</span>
                  <span>20 years</span>
                  <span>40 years</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overpayment Strategy */}
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardContent className="p-6">
            <h2 className="font-heading mb-5 text-base font-bold text-neutral-900 dark:text-white">
              Overpayment Strategy
            </h2>

            <div className="space-y-5">
              {/* Monthly Overpayment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Monthly Overpayment
                  </Label>
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--color-brand-primary)" }}
                  >
                    {formatCurrency(monthlyOverpayment)}/mo
                  </span>
                </div>
                <Slider
                  min={0}
                  max={2000}
                  step={50}
                  value={[monthlyOverpayment]}
                  onValueChange={(val) =>
                    setMonthlyOverpayment(Array.isArray(val) ? val[0] : val)
                  }
                />
                <div className="flex justify-between text-[10px] font-medium text-neutral-400">
                  <span>£0</span>
                  <span>£1,000</span>
                  <span>£2,000</span>
                </div>
              </div>

              {/* Lump sum input alternative */}
              <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  ERC-Free Annual Cap
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Most UK lenders allow up to 10% per year without Early Repayment Charges
                    </span>
                    <span
                      className="ml-4 flex-shrink-0 text-sm font-bold"
                      style={{ color: "var(--color-brand-primary)" }}
                    >
                      {annualCapPct}%
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={20}
                    step={1}
                    value={[annualCapPct]}
                    onValueChange={(val) =>
                      setAnnualCapPct(Array.isArray(val) ? val[0] : val)
                    }
                  />
                </div>
              </div>

              {/* Base payment summary */}
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-primary) 6%, transparent)" }}
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Monthly Repayment Summary
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <p
                      className="text-2xl font-black tabular-nums"
                      style={{ color: "var(--color-brand-primary)" }}
                    >
                      {formatCurrency(basePayment + monthlyOverpayment)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Base {formatCurrency(basePayment)} + {formatCurrency(monthlyOverpayment)} overpayment
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Results */}
      <div className="space-y-6">
        {/* Dark green hero card */}
        <div
          className="rounded-2xl p-6 text-white"
          style={{ backgroundColor: "var(--color-brand-primary)" }}
        >
          {/* Top: two hero stats */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-widest opacity-70">
                Interest Saved
              </div>
              <div className="font-heading text-4xl font-black leading-none">
                {formatCurrency(interestSaved)}
              </div>
              {baseResult.totalInterest > 0 && (
                <div className="mt-1 text-xs opacity-70">
                  of {formatCurrency(baseResult.totalInterest)} total
                </div>
              )}
            </div>
            {/* Time saved badge */}
            <div className="flex-shrink-0 rounded-xl bg-white/15 px-4 py-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                Time Saved
              </div>
              <div className="font-heading text-2xl font-black leading-tight">
                {formatMonths(monthsSaved)}
              </div>
            </div>
          </div>

          {/* Balance Projection SVG line chart */}
          {milestones.length > 1 && (
            <div className="mb-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-60">
                Mortgage Balance Projection
              </div>
              <div className="relative overflow-hidden rounded-xl bg-white/10 px-3 pb-2 pt-3">
                <svg
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className="w-full"
                  style={{ height: "100px" }}
                  preserveAspectRatio="none"
                >
                  {/* Base line */}
                  <path
                    d={basePath}
                    fill="none"
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                  />
                  {/* Overpayment line */}
                  <path
                    d={overPath}
                    fill="none"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="2.5"
                  />
                </svg>
                {/* Legend */}
                <div className="flex items-center gap-4 text-[10px] font-medium opacity-80">
                  <div className="flex items-center gap-1.5">
                    <span className="block h-px w-4 border-t-2 border-dashed border-white/50" />
                    <span>Standard</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="block h-px w-4 bg-white" />
                    <span>Overpayment</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4-stat row */}
          <div className="grid grid-cols-2 gap-3 border-t border-white/20 pt-4 sm:grid-cols-4">
            {[
              { icon: TrendingDown, label: "Monthly Repayment", value: formatCurrency(basePayment) },
              { icon: Percent, label: "Total Interest", value: formatCurrency(overpayResult.totalInterest) },
              { icon: Clock, label: "Interest Rate", value: `${annualRate}%` },
              { icon: Calendar, label: "Mortgage Free", value: `${mortgageFreeYear}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <Icon className="mx-auto mb-1 h-3 w-3 opacity-60" strokeWidth={1.5} />
                <div className="font-heading text-sm font-black">{value}</div>
                <div className="text-[9px] font-medium uppercase tracking-wide opacity-60">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Could you get a better rate? CTA */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
                Better Rate?
              </p>
              <p className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Could you be getting a lower rate? Our brokers check the whole market.
              </p>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-bold transition-opacity hover:opacity-70"
                style={{ color: "var(--color-brand-primary)" }}
              >
                Compare Today&apos;s Best Rates
                <ChevronRight className="h-3 w-3" />
              </button>
            </CardContent>
          </Card>

          <div
            className="flex flex-col justify-between rounded-xl p-5 text-white"
            style={{ backgroundColor: "var(--color-brand-primary)" }}
          >
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide opacity-70">
                Need a custom plan?
              </p>
              <p className="text-sm font-medium opacity-90">
                Get expert advice tailored to your mortgage.
              </p>
            </div>
            <button
              type="button"
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/25"
            >
              Schedule Call
            </button>
          </div>
        </div>

        <p className="px-1 text-[11px] leading-relaxed text-neutral-400">
          Illustrative only. Based on standard repayment amortisation. Does not account
          for fixed rate deal end dates, ERC costs, or changes in interest rate.
          Always confirm overpayment limits with your lender.
        </p>
      </div>
    </div>
  );
}
