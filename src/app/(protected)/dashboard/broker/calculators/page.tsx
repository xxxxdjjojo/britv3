"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MortgageCalculator } from "@/components/calculators/MortgageCalculator";
import { SdltCalculator } from "@/components/calculators/SdltCalculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

function AffordabilityCalculator() {
  const [annualIncome, setAnnualIncome] = useState(55000);
  const [partnerIncome, setPartnerIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(1200);
  const [deposit, setDeposit] = useState(40000);

  const totalIncome = annualIncome + partnerIncome;
  const multiplier4 = totalIncome * 4;
  const multiplier45 = totalIncome * 4.5;
  const multiplier5 = totalIncome * 5;

  const maxPropertyAt4 = multiplier4 + deposit;
  const maxPropertyAt45 = multiplier45 + deposit;
  const maxPropertyAt5 = multiplier5 + deposit;

  const monthlyIncomeNet = (totalIncome * 0.7) / 12; // rough take-home
  const affordableMonthly = Math.max(0, monthlyIncomeNet - monthlyExpenses);
  const stressTestRate = 7; // stress test at 7%
  const monthlyRateStress = stressTestRate / 100 / 12;
  const n = 25 * 12;
  const maxLoanFromAffordability =
    monthlyRateStress > 0
      ? (affordableMonthly * (1 - Math.pow(1 + monthlyRateStress, -n))) / monthlyRateStress
      : affordableMonthly * n;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Inputs */}
      <Card className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 border-0">
        <CardContent className="p-6 space-y-5">
          <h3 className="font-heading text-base font-semibold text-foreground">Income &amp; Expenses</h3>

          <div className="space-y-2">
            <Label htmlFor="annual-income" className="font-body text-xs font-medium text-neutral-500">
              Annual Income (Gross)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm text-neutral-400">
                &pound;
              </span>
              <Input
                id="annual-income"
                type="number"
                min={0}
                step={1000}
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Number(e.target.value))}
                className="pl-8 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card font-body text-sm text-foreground focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner-income" className="font-body text-xs font-medium text-neutral-500">
              Partner Annual Income (optional)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm text-neutral-400">
                &pound;
              </span>
              <Input
                id="partner-income"
                type="number"
                min={0}
                step={1000}
                value={partnerIncome}
                onChange={(e) => setPartnerIncome(Number(e.target.value))}
                className="pl-8 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card font-body text-sm text-foreground focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly-expenses" className="font-body text-xs font-medium text-neutral-500">
              Monthly Commitments
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm text-neutral-400">
                &pound;
              </span>
              <Input
                id="monthly-expenses"
                type="number"
                min={0}
                step={50}
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                className="pl-8 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-card font-body text-sm text-foreground focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2"
              />
            </div>
            <p className="font-body text-xs text-neutral-500">
              Include credit cards, loans, childcare, and other regular commitments.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="affordability-deposit" className="font-body text-xs font-medium text-neutral-500">
                Available Deposit
              </Label>
              <span className="font-body text-sm font-medium text-neutral-500">
                {formatCurrency(deposit)}
              </span>
            </div>
            <Slider
              min={0}
              max={200000}
              step={5000}
              value={[deposit]}
              onValueChange={(val) =>
                setDeposit(Array.isArray(val) ? val[0] : val)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <Card className="rounded-xl bg-card shadow-sm ring-1 ring-brand-primary/20 border-0">
          <CardContent className="p-6">
            <h3 className="mb-4 font-heading text-base font-semibold text-foreground">Borrowing Estimates</h3>
            <p className="mb-4 font-body text-xs text-neutral-500">
              Based on standard lender income multiples. Actual affordability may vary by lender.
            </p>

            <div className="space-y-3">
              {[
                { label: "Conservative (4x)", loan: multiplier4, property: maxPropertyAt4 },
                { label: "Standard (4.5x)", loan: multiplier45, property: maxPropertyAt45 },
                { label: "Maximum (5x)", loan: multiplier5, property: maxPropertyAt5 },
              ].map((tier) => (
                <div key={tier.label} className="flex items-center justify-between rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 p-3">
                  <div>
                    <p className="font-body text-xs font-medium text-neutral-500">{tier.label}</p>
                    <p className="font-body text-sm text-foreground">Loan: {formatCurrency(tier.loan)}</p>
                  </div>
                  <p className="font-heading text-lg font-bold text-brand-primary">{formatCurrency(tier.property)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 border-0">
          <CardContent className="p-6">
            <h3 className="mb-2 font-heading text-base font-semibold text-foreground">Stress Test</h3>
            <p className="mb-3 font-body text-xs text-neutral-500">
              At a {stressTestRate}% stress test rate over 25 years, based on affordable monthly payment of {formatCurrency(affordableMonthly)}.
            </p>
            <div className="rounded-lg bg-muted/40 border border-neutral-200/60 dark:border-neutral-700/60 p-4 text-center">
              <p className="font-body text-xs font-medium text-neutral-500 mb-1">Max Loan (Stress Tested)</p>
              <p className="font-heading text-2xl font-black text-foreground">{formatCurrency(maxLoanFromAffordability)}</p>
              <p className="font-body text-xs text-neutral-500 mt-1">
                Max property: {formatCurrency(maxLoanFromAffordability + deposit)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CalculatorsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Page Header */}
      <div>
        <span className="block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-brand-secondary-dark mb-1">
          Tools
        </span>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">Calculator Tools</h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Use these calculators to help clients understand their mortgage options and costs.
        </p>
      </div>

      <Tabs defaultValue="affordability" className="space-y-6">
        <TabsList>
          <TabsTrigger value="affordability">Affordability</TabsTrigger>
          <TabsTrigger value="repayment">Repayment</TabsTrigger>
          <TabsTrigger value="stamp-duty">Stamp Duty</TabsTrigger>
        </TabsList>

        <TabsContent value="affordability">
          <AffordabilityCalculator />
        </TabsContent>

        <TabsContent value="repayment">
          <MortgageCalculator />
        </TabsContent>

        <TabsContent value="stamp-duty">
          <SdltCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
