"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { FileEdit, PiggyBank } from "lucide-react";
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
  return `${years}y ${remainder}m`;
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

  // Donut: interest saved proportion
  const savedRatio =
    baseResult.totalInterest > 0
      ? Math.min(1, interestSaved / baseResult.totalInterest)
      : 0;
  const circumference = 2 * Math.PI * 70;
  const dashOffset = circumference * (1 - savedRatio);

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
    let currentYear = 0;
    const points: Array<{ year: number; baseBalance: number; overBalance: number }> = [];

    for (let m = 0; m < maxMonths; m++) {
      const thisYear = Math.floor(m / 12);
      if (thisYear > currentYear) {
        currentYear = thisYear;
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

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-9">
      {/* Left Column: Inputs */}
      <Card className="lg:col-span-4">
        <CardContent className="p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <FileEdit className="h-5 w-5 text-brand-primary" strokeWidth={1.25} />
            Mortgage Details
          </h2>

          <div className="space-y-6">
            {/* Loan Amount */}
            <div className="space-y-2">
              <Label htmlFor="op-loan" className="text-sm font-semibold">
                Outstanding Mortgage Balance
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                  &pound;
                </span>
                <Input
                  id="op-loan"
                  type="number"
                  min={0}
                  step={1000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Annual Rate */}
            <div className="space-y-2">
              <Label htmlFor="op-rate" className="text-sm font-semibold">
                Interest Rate{" "}
                <span className="font-normal text-neutral-400">(illustrative)</span>
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
                  className="pr-8"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                  %
                </span>
              </div>
            </div>

            {/* Term */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Remaining Term</Label>
                <span className="font-bold text-brand-primary">{termYears} Years</span>
              </div>
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
                <span>1Y</span>
                <span>20Y</span>
                <span>40Y</span>
              </div>
            </div>

            {/* Monthly Overpayment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Monthly Overpayment</Label>
                <span className="font-bold text-brand-primary">
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

            {/* Annual Cap */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  ERC-Free Annual Cap
                </Label>
                <span className="font-bold text-brand-primary">{annualCapPct}%</span>
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
              <p className="text-xs text-neutral-400">
                Most UK lenders allow up to 10% of original balance per year without Early Repayment Charge (ERC).
              </p>
            </div>

            {/* Base Payment Info */}
            <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-brand-primary" strokeWidth={1.25} />
                <p className="text-sm font-bold">Standard Monthly Payment</p>
              </div>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">
                {formatCurrency(basePayment)}/mo
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Total with overpayment:{" "}
                <span className="font-semibold">
                  {formatCurrency(basePayment + monthlyOverpayment)}/mo
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Results */}
      <div className="space-y-6 lg:col-span-5">
        <Card className="relative overflow-hidden shadow-xl">
          <div className="absolute -mr-16 -mt-16 right-0 top-0 h-32 w-32 rounded-full bg-brand-primary/5" />
          <CardContent className="p-8">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-neutral-400">
              Interest Saved
            </h2>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-black text-neutral-900 dark:text-white">
                {formatCurrency(interestSaved)}
              </span>
              <span className="font-medium text-neutral-500">saved</span>
            </div>

            {/* Donut */}
            <div className="flex flex-col items-center gap-8 border-t border-neutral-100 pt-8 md:flex-row dark:border-neutral-800">
              <div className="relative h-40 w-40 flex-shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="20"
                    className="text-neutral-100 dark:text-neutral-800"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="20"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="text-brand-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase text-neutral-400">
                    Saving
                  </span>
                  <span className="text-sm font-bold">
                    {(savedRatio * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="w-full flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-brand-primary" />
                    <span className="text-sm font-medium">Saved Interest</span>
                  </div>
                  <span className="text-sm font-bold">
                    {formatCurrency(interestSaved)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    <span className="text-sm font-medium text-neutral-500">
                      Remaining Interest
                    </span>
                  </div>
                  <span className="text-sm font-bold">
                    {formatCurrency(overpayResult.totalInterest)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-8 dark:border-neutral-800">
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-400">
                  Original Term
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatMonths(baseResult.months)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-400">
                  New Term (with overpay)
                </p>
                <p className="text-xl font-bold text-brand-primary">
                  {formatMonths(overpayResult.months)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-400">
                  Time Saved
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatMonths(monthsSaved)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-400">
                  Total Interest (no overpay)
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(baseResult.totalInterest)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Comparison Chart */}
        {milestones.length > 1 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-bold">Outstanding Balance Over Time</h3>
              <div className="space-y-3">
                {milestones.map((m) => (
                  <div key={m.year} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>Year {m.year}</span>
                      <div className="flex gap-4">
                        <span className="text-neutral-400">
                          Base: {formatCurrency(m.baseBalance)}
                        </span>
                        <span className="font-semibold text-brand-primary">
                          +Overpay: {formatCurrency(m.overBalance)}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-4 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
                      {/* Base bar */}
                      <div
                        className="absolute h-4 rounded-full bg-neutral-300 dark:bg-neutral-600"
                        style={{ width: `${(m.baseBalance / maxBalance) * 100}%` }}
                      />
                      {/* Overpayment bar */}
                      <div
                        className="absolute h-4 rounded-full bg-brand-primary/70"
                        style={{ width: `${(m.overBalance / maxBalance) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-6 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                  <span>Without overpayment</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-6 rounded-full bg-brand-primary/70" />
                  <span>With overpayment</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-neutral-400 px-1">
          Illustrative only. Based on standard repayment amortisation. Does not account
          for fixed rate deal end dates, ERC costs, or changes in interest rate.
          Always confirm overpayment limits with your lender.
        </p>
      </div>
    </div>
  );
}
