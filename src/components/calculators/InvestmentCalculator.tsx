"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Info } from "lucide-react";
import Link from "next/link";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number, decimals = 2) =>
  `${value.toFixed(decimals)}%`;

type InvestmentCalculatorProps = Readonly<{
  initialPrice?: number;
}>;

/**
 * UK Property Investment Calculator
 *
 * Calculates gross yield, net yield (after costs), annual ROI, and
 * projected capital growth for a buy-to-let or investment property.
 */
export function InvestmentCalculator({ initialPrice }: InvestmentCalculatorProps = {}) {
  const [propertyPrice, setPropertyPrice] = useState(initialPrice ?? 250000);
  const [deposit, setDeposit] = useState(62500);
  const [monthlyRent, setMonthlyRent] = useState(1200);
  const [annualCosts, setAnnualCosts] = useState(2400); // insurance, maintenance, letting agent fees
  const [mortgageRate, setMortgageRate] = useState(4.5);
  const [mortgageTerm, setMortgageTerm] = useState(25);
  const [capitalGrowthRate, setCapitalGrowthRate] = useState(3.0);
  const [projectionYears, setProjectionYears] = useState(10);

  // mortgageTerm is used for context display only; keep it in state for future extension
  void mortgageTerm;

  const loanAmount = useMemo(() => Math.max(0, propertyPrice - deposit), [propertyPrice, deposit]);
  const ltv = useMemo(() => (propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0), [loanAmount, propertyPrice]);

  const results = useMemo(() => {
    const annualRent = monthlyRent * 12;

    // Gross yield
    const grossYield = propertyPrice > 0 ? (annualRent / propertyPrice) * 100 : 0;

    // Monthly mortgage payment (interest-only common for BTL)
    const monthlyInterest = loanAmount > 0 && mortgageRate > 0
      ? loanAmount * (mortgageRate / 100 / 12)
      : 0;
    const annualMortgageCost = monthlyInterest * 12;

    // Net annual income after mortgage + costs
    const netAnnualIncome = annualRent - annualMortgageCost - annualCosts;

    // Net yield on property value
    const netYield = propertyPrice > 0 ? (netAnnualIncome / propertyPrice) * 100 : 0;

    // Cash-on-cash ROI (on deposit invested)
    const cashOnCashROI = deposit > 0 ? (netAnnualIncome / deposit) * 100 : 0;

    // Return on equity
    const returnOnEquity = deposit > 0 ? ((annualRent / propertyPrice) * 100) * (propertyPrice / deposit) : 0;

    // Projected capital gain
    const projectedValue = propertyPrice * Math.pow(1 + capitalGrowthRate / 100, projectionYears);
    const capitalGain = projectedValue - propertyPrice;

    // Total return over projection period (income + capital)
    const totalIncomeProjected = netAnnualIncome * projectionYears;
    const totalReturn = totalIncomeProjected + capitalGain;
    const totalROI = deposit > 0 ? (totalReturn / deposit) * 100 : 0;

    // Net ROI projection (capital + cumulative net income)
    const netRoiProjection = netAnnualIncome * projectionYears + capitalGain;

    return {
      annualRent,
      grossYield,
      netAnnualIncome,
      netYield,
      cashOnCashROI,
      returnOnEquity,
      monthlyInterest,
      projectedValue,
      capitalGain,
      totalReturn,
      totalROI,
      netRoiProjection,
    };
  }, [
    propertyPrice,
    deposit,
    monthlyRent,
    annualCosts,
    loanAmount,
    mortgageRate,
    capitalGrowthRate,
    projectionYears,
  ]);

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">
          Property Investment Calculator
        </h2>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Analyse buy-to-let returns with surgical precision. Model rental income, interest rates, and long-term
          capital growth with our Theodora Flair buy-and-let property projections.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* ── Left Column: Inputs ── */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
          <div className="mb-5 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
              ✓
            </span>
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Buy current Details
            </p>
          </div>

          <div className="space-y-5">
            {/* Property Price */}
            <div className="space-y-1.5">
              <Label htmlFor="inv-price" className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Property Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">£</span>
                <Input
                  id="inv-price"
                  type="number"
                  min={0}
                  step={1000}
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                  className="h-11 rounded-lg border-neutral-200 bg-neutral-50 pl-7 pr-3 text-sm font-medium focus-visible:border-brand-primary focus-visible:ring-brand-primary/30 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
            </div>

            {/* Deposit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="inv-deposit" className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Deposit / Cash Invested
                </Label>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  LTV {ltv.toFixed(1)}%
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">£</span>
                <Input
                  id="inv-deposit"
                  type="number"
                  min={0}
                  step={1000}
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="h-11 rounded-lg border-neutral-200 bg-neutral-50 pl-7 pr-3 text-sm font-medium focus-visible:border-brand-primary focus-visible:ring-brand-primary/30 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
              <Slider
                min={0}
                max={propertyPrice}
                step={1000}
                value={[deposit]}
                onValueChange={(val) => setDeposit(Array.isArray(val) ? val[0] : val)}
                className="mt-1"
              />
            </div>

            {/* Monthly Rent */}
            <div className="space-y-1.5">
              <Label htmlFor="inv-rent" className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Rental Income / Month
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">£</span>
                <Input
                  id="inv-rent"
                  type="number"
                  min={0}
                  step={50}
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  className="h-11 rounded-lg border-neutral-200 bg-neutral-50 pl-7 pr-3 text-sm font-medium focus-visible:border-brand-primary focus-visible:ring-brand-primary/30 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-1.5">
              <Label htmlFor="inv-rate" className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Interest Rate{" "}
                <span className="normal-case font-normal text-neutral-400">(interest-only)</span>
              </Label>
              <div className="relative">
                <Input
                  id="inv-rate"
                  type="number"
                  min={0}
                  max={20}
                  step={0.1}
                  value={mortgageRate}
                  onChange={(e) => setMortgageRate(Number(e.target.value))}
                  className="h-11 rounded-lg border-neutral-200 bg-neutral-50 pl-3 pr-8 text-sm font-medium focus-visible:border-brand-primary focus-visible:ring-brand-primary/30 dark:border-neutral-700 dark:bg-neutral-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">%</span>
              </div>
            </div>

            {/* Annual Costs */}
            <div className="space-y-1.5">
              <Label htmlFor="inv-costs" className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Annual Costs{" "}
                <span className="normal-case font-normal text-neutral-400">(insurance, maintenance)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">£</span>
                <Input
                  id="inv-costs"
                  type="number"
                  min={0}
                  step={100}
                  value={annualCosts}
                  onChange={(e) => setAnnualCosts(Number(e.target.value))}
                  className="h-11 rounded-lg border-neutral-200 bg-neutral-50 pl-7 pr-3 text-sm font-medium focus-visible:border-brand-primary focus-visible:ring-brand-primary/30 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
            </div>

            {/* Capital Growth + Projection sliders */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Capital Growth p.a.
                </Label>
                <span className="font-bold text-brand-primary">{capitalGrowthRate.toFixed(1)}%</span>
              </div>
              <Slider
                min={0}
                max={10}
                step={0.1}
                value={[capitalGrowthRate]}
                onValueChange={(val) => setCapitalGrowthRate(Array.isArray(val) ? val[0] : val)}
              />
              <div className="flex justify-between text-[10px] font-medium text-neutral-400">
                <span>0%</span>
                <span>5%</span>
                <span>10%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Projection Period
                </Label>
                <span className="font-bold text-brand-primary">{projectionYears} Years</span>
              </div>
              <Slider
                min={1}
                max={30}
                step={1}
                value={[projectionYears]}
                onValueChange={(val) => setProjectionYears(Array.isArray(val) ? val[0] : val)}
              />
              <div className="flex justify-between text-[10px] font-medium text-neutral-400">
                <span>1Y</span>
                <span>15Y</span>
                <span>30Y</span>
              </div>
            </div>
          </div>

          {/* Mortgage Term hidden field */}
          <input type="hidden" value={mortgageTerm} onChange={(e) => setMortgageTerm(Number(e.target.value))} />
        </div>

        {/* ── Right Column: Results ── */}
        <div className="space-y-4">
          {/* Top 2 dark stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-brand-primary p-5 text-white">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
                Annual Cash Flow
              </p>
              <p className="text-3xl font-black tracking-tight">{formatCurrency(results.netAnnualIncome)}</p>
              <p className="mt-1.5 text-[11px] text-white/70">Net income after all costs</p>
            </div>

            <div className="rounded-2xl bg-brand-primary p-5 text-white">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
                Net Yield
              </p>
              <p className="text-3xl font-black tracking-tight">{formatPercent(results.netYield)}</p>
              <p className="mt-1.5 text-[11px] text-white/70">{formatPercent(results.grossYield)} gross yield</p>
            </div>
          </div>

          {/* Bottom 2 stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
              <CardContent className="p-5">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  Return on Equity
                </p>
                <p className="text-2xl font-black text-neutral-900 dark:text-white">
                  {formatPercent(results.returnOnEquity)}
                </p>
                <p className="mt-1 text-[11px] text-neutral-400">Annualised on deposit</p>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
              <CardContent className="p-5">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  Total ROI
                </p>
                <p className="text-2xl font-black text-neutral-900 dark:text-white">
                  {formatPercent(results.totalROI, 1)}
                </p>
                <p className="mt-1 text-[11px] text-neutral-400">{projectionYears}Y income + capital</p>
              </CardContent>
            </Card>
          </div>

          {/* Non-negotiable Projections */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-brand-primary" strokeWidth={1.5} />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Non-negotiable Projections</h3>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-neutral-500">Gross Rental Yield</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{formatPercent(results.grossYield)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-neutral-500">Cash-on-Cash ROI</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{formatPercent(results.cashOnCashROI)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-neutral-500">Monthly Mortgage (IO)</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(results.monthlyInterest)}/mo</span>
              </li>
              <li className="flex justify-between">
                <span className="text-neutral-500">Projected Value ({projectionYears}Y)</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(results.projectedValue)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-neutral-500">Capital Gain ({projectionYears}Y)</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(results.capitalGain)}</span>
              </li>
              <li className="flex justify-between border-t border-neutral-100 pt-3 text-base dark:border-neutral-800">
                <span className="font-bold text-neutral-900 dark:text-white">Net ROI Projection</span>
                <span className={`font-black ${results.netRoiProjection >= 0 ? "text-brand-primary" : "text-error"}`}>
                  {formatCurrency(results.netRoiProjection)}
                </span>
              </li>
            </ul>
          </div>

          {/* BTL LTV Thresholds */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-3 flex items-center gap-2">
              <Info className="size-4 text-brand-primary" strokeWidth={1.5} />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">BTL LTV Thresholds</h3>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { ltv: "60%", label: "Best rates available" },
                { ltv: "65%", label: "Competitive rates" },
                { ltv: "75%", label: "Standard BTL maximum" },
                { ltv: "80%", label: "Limited products, higher rates" },
              ].map((tier) => (
                <div key={tier.ltv} className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">{tier.ltv}</span>
                  <span className="text-neutral-500">{tier.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ready to secure financing? CTA */}
          <div className="rounded-2xl bg-brand-primary p-6 text-white">
            <h4 className="mb-1.5 font-heading text-base font-bold">
              Ready to secure financing?
            </h4>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              Compare buy-to-let mortgage rates from leading UK lenders and get
              an agreement in principle today.
            </p>
            <Link href="/tools/mortgage-calculator">
              <Button className="w-full gap-2 bg-brand-secondary font-semibold text-white hover:bg-brand-secondary/90">
                Get My Quote <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>

          <p className="text-xs text-neutral-400">
            Illustrative only. Tax, void periods, and transaction costs not included.
            Investment returns are not guaranteed. Always seek independent financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
