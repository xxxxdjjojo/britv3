"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { FileEdit, Save } from "lucide-react";
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(value);

type MortgageCalculatorProps = Readonly<{
  initialPrice?: number;
}>;

export function MortgageCalculator({ initialPrice }: MortgageCalculatorProps = {}) {
  const { saveParams, hasParams } = useMortgageParams();

  const [propertyPrice, setPropertyPrice] = useState(() => initialPrice ?? getUrlParam("price", 300000));
  const [deposit, setDeposit] = useState(() => getUrlParam("deposit", 30000));
  const [interestRate, setInterestRate] = useState(() => getUrlParam("rate", 4.5));
  const [termYears, setTermYears] = useState(() => getUrlParam("term", 25));
  const [interestOnly, setInterestOnly] = useState(() => getUrlBool("io", false));

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (propertyPrice !== 300000) params.set("price", String(propertyPrice));
    if (deposit !== 30000) params.set("deposit", String(deposit));
    if (interestRate !== 4.5) params.set("rate", String(interestRate));
    if (termYears !== 25) params.set("term", String(termYears));
    if (interestOnly) params.set("io", "1");
    const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [propertyPrice, deposit, interestRate, termYears, interestOnly]);

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

    return { monthlyPayment, totalRepayable, totalInterest, ltv };
  }, [loanAmount, interestRate, termYears, propertyPrice, interestOnly]);

  const handleSaveParams = () => {
    saveParams({ deposit, interestRate, termYears });
  };

  // Donut chart calculations
  const principalRatio =
    results.totalRepayable > 0 ? loanAmount / results.totalRepayable : 0;
  const circumference = 2 * Math.PI * 70; // ~440
  const dashOffset = circumference * (1 - principalRatio);

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-9">
      {/* Left Column: Input Form */}
      <Card className="lg:col-span-4">
        <CardContent className="p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <FileEdit className="h-5 w-5 text-brand-primary" />
            Your Details
          </h2>

          <div className="space-y-6">
            {/* Property Price */}
            <div className="space-y-2">
              <Label htmlFor="property-price" className="text-sm font-semibold">
                Property Price
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                  &pound;
                </span>
                <Input
                  id="property-price"
                  type="number"
                  min={0}
                  step={1000}
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Deposit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="deposit" className="text-sm font-semibold">
                  Deposit
                </Label>
                <span className="text-sm font-medium text-neutral-500">
                  {depositPercent}% of property price
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                  &pound;
                </span>
                <Input
                  id="deposit"
                  type="number"
                  min={0}
                  step={1000}
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="pl-8"
                />
              </div>
              <Slider
                min={0}
                max={propertyPrice}
                step={1000}
                value={[deposit]}
                onValueChange={(val) =>
                  setDeposit(Array.isArray(val) ? val[0] : val)
                }
              />
            </div>

            {/* Interest Only Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Interest Only</Label>
              <Switch checked={interestOnly} onCheckedChange={setInterestOnly} />
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <Label htmlFor="interest-rate" className="text-sm font-semibold">
                Interest Rate <span className="font-normal text-neutral-400">(illustrative)</span>
              </Label>
              <div className="relative">
                <Input
                  id="interest-rate"
                  type="number"
                  min={0}
                  max={20}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="pr-8"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                  %
                </span>
              </div>
            </div>

            {/* Mortgage Term */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="term" className="text-sm font-semibold">
                  Mortgage Term
                </Label>
                <span className="font-bold text-brand-primary">
                  {termYears} Years
                </span>
              </div>
              <Slider
                min={5}
                max={40}
                step={1}
                value={[termYears]}
                onValueChange={(val) =>
                  setTermYears(Array.isArray(val) ? val[0] : val)
                }
              />
              <div className="flex justify-between text-[10px] font-medium text-neutral-400">
                <span>5Y</span>
                <span>20Y</span>
                <span>40Y</span>
              </div>
            </div>

            {/* Save Parameters */}
            <Button
              onClick={handleSaveParams}
              variant="outline"
              className="mt-4 w-full gap-2"
            >
              <Save className="h-4 w-4" />
              {hasParams ? "Update Saved Parameters" : "Save These Parameters"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Results Dashboard */}
      <div className="space-y-6 lg:col-span-5">
        <Card className="relative overflow-hidden shadow-xl">
          <div className="absolute -mr-16 -mt-16 right-0 top-0 h-32 w-32 rounded-full bg-brand-primary/5" />
          <CardContent className="p-8">
            {/* Monthly Payment */}
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-neutral-400">
              Estimated Monthly Payment
            </h2>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-black text-neutral-900 dark:text-white">
                {formatCurrency(results.monthlyPayment)}
              </span>
              <span className="font-medium text-neutral-500">/ month</span>
            </div>

            {/* Donut Chart + Breakdown */}
            <div className="flex flex-col items-center gap-8 border-t border-neutral-100 pt-8 md:flex-row dark:border-neutral-800">
              {/* Donut Chart */}
              <div className="relative h-40 w-40 flex-shrink-0">
                <svg
                  className="h-full w-full -rotate-90"
                  viewBox="0 0 160 160"
                >
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
                    Total Cost
                  </span>
                  <span className="text-sm font-bold">
                    {formatCompact(results.totalRepayable)}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-brand-primary" />
                    <span className="text-sm font-medium">Principal</span>
                  </div>
                  <span className="text-sm font-bold">
                    {formatCurrency(loanAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    <span className="text-sm font-medium text-neutral-500">
                      Interest
                    </span>
                  </div>
                  <span className="text-sm font-bold">
                    {formatCurrency(results.totalInterest)}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-8 dark:border-neutral-800">
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-400">
                  Total Interest Paid
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(results.totalInterest)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-400">
                  Total Repayable
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(results.totalRepayable)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-400">
                  Loan-to-Value (LTV)
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {results.ltv.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-400">
                  Loan Amount
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(loanAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
