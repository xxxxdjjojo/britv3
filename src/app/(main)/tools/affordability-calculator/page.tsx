"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  User,
  UserPlus,
  Banknote,
  ShieldCheck,
  Headset,
  Calculator,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const formatGBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatGBPFull = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseNum(value: string): number {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

export default function AffordabilityCalculatorPage() {
  // Applicant 1
  const [app1Salary, setApp1Salary] = useState("");
  const [app1Bonus, setApp1Bonus] = useState("");
  const [app1Other, setApp1Other] = useState("");

  // Applicant 2
  const [hasApplicant2, setHasApplicant2] = useState(false);
  const [app2Salary, setApp2Salary] = useState("");
  const [app2Bonus, setApp2Bonus] = useState("");
  const [app2Other, setApp2Other] = useState("");

  // Outgoings & Deposit
  const [monthlyDebt, setMonthlyDebt] = useState("");
  const [monthlyLiving, setMonthlyLiving] = useState("");
  const [deposit, setDeposit] = useState("");

  // Mortgage assumptions
  const interestRate = 0.055; // 5.5% representative rate
  const termYears = 25;

  const results = useMemo(() => {
    const incomeMultiplier = hasApplicant2 ? 4.0 : 4.5;

    const totalIncome =
      parseNum(app1Salary) +
      parseNum(app1Bonus) +
      parseNum(app1Other) +
      (hasApplicant2
        ? parseNum(app2Salary) + parseNum(app2Bonus) + parseNum(app2Other)
        : 0);

    const depositAmount = parseNum(deposit);
    const maxBorrowing = totalIncome * incomeMultiplier;
    const maxPropertyPrice = maxBorrowing + depositAmount;

    // Monthly payment calculation
    const monthlyRate = interestRate / 12;
    const termMonths = termYears * 12;
    let monthlyPayment = 0;
    if (maxBorrowing > 0) {
      monthlyPayment =
        (maxBorrowing *
          (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);
    }

    return {
      incomeMultiplier,
      totalIncome,
      maxBorrowing,
      maxPropertyPrice,
      monthlyPayment,
      depositAmount,
    };
  }, [
    app1Salary,
    app1Bonus,
    app1Other,
    hasApplicant2,
    app2Salary,
    app2Bonus,
    app2Other,
    deposit,
  ]);

  return (
    <>
      {/* Hero Section */}
      <header className="border-b border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6">
          <nav className="mb-4 flex text-xs font-medium uppercase tracking-wider text-neutral-500">
            <Link
              href="/tools"
              className="hover:text-brand-primary"
            >
              Tools
            </Link>
            <span className="mx-2">/</span>
            <span className="text-neutral-900 dark:text-neutral-300">
              Affordability Calculator
            </span>
          </nav>
          <h1 className="mb-4 font-heading text-4xl font-extrabold text-neutral-900 dark:text-white">
            Mortgage Affordability
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
            Estimate how much you can borrow based on your income and expenses
            to find your ideal home budget.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Form */}
          <div className="space-y-10 lg:col-span-7">
            {/* Applicant 1 Section */}
            <Card className="border-neutral-100 p-8 shadow-sm dark:border-neutral-800">
              <CardContent className="p-0">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold">Applicant 1</h2>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Annual Salary (Pre-tax)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        &pound;
                      </span>
                      <Input
                        type="number"
                        placeholder="50,000"
                        className="h-11 pl-8"
                        value={app1Salary}
                        onChange={(e) => setApp1Salary(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Annual Bonus / Commission
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        &pound;
                      </span>
                      <Input
                        type="number"
                        placeholder="5,000"
                        className="h-11 pl-8"
                        value={app1Bonus}
                        onChange={(e) => setApp1Bonus(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Other Regular Income
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        &pound;
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        className="h-11 pl-8"
                        value={app1Other}
                        onChange={(e) => setApp1Other(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applicant 2 Section */}
            <Card className="border-neutral-100 p-8 shadow-sm dark:border-neutral-800">
              <CardContent className="p-0">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        hasApplicant2
                          ? "bg-brand-primary/10 text-brand-primary"
                          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                      )}
                    >
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold">Applicant 2</h2>
                  </div>
                  <Switch
                    checked={hasApplicant2}
                    onCheckedChange={setHasApplicant2}
                  />
                </div>
                {hasApplicant2 && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <Label className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Annual Salary (Pre-tax)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                          &pound;
                        </span>
                        <Input
                          type="number"
                          placeholder="35,000"
                          className="h-11 pl-8"
                          value={app2Salary}
                          onChange={(e) => setApp2Salary(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Annual Bonus / Commission
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                          &pound;
                        </span>
                        <Input
                          type="number"
                          placeholder="5,000"
                          className="h-11 pl-8"
                          value={app2Bonus}
                          onChange={(e) => setApp2Bonus(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Other Regular Income
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                          &pound;
                        </span>
                        <Input
                          type="number"
                          placeholder="0"
                          className="h-11 pl-8"
                          value={app2Other}
                          onChange={(e) => setApp2Other(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Expenses & Deposit */}
            <Card className="border-neutral-100 p-8 shadow-sm dark:border-neutral-800">
              <CardContent className="p-0">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold">
                    Outgoings &amp; Deposit
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <Label className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Monthly Debt Repayments
                    </Label>
                    <p className="mb-2 text-xs text-neutral-500">
                      Loans, credit cards, car finance
                    </p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        &pound;
                      </span>
                      <Input
                        type="number"
                        placeholder="250"
                        className="h-11 pl-8"
                        value={monthlyDebt}
                        onChange={(e) => setMonthlyDebt(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Monthly Living Costs
                    </Label>
                    <p className="mb-2 text-xs text-neutral-500">
                      Childcare, insurance, essential costs
                    </p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        &pound;
                      </span>
                      <Input
                        type="number"
                        placeholder="1,200"
                        className="h-11 pl-8"
                        value={monthlyLiving}
                        onChange={(e) => setMonthlyLiving(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800 md:col-span-2">
                    <Label className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Total Deposit Available
                    </Label>
                    <div className="relative max-w-sm">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        &pound;
                      </span>
                      <Input
                        type="number"
                        placeholder="45,000"
                        className="h-11 border-brand-primary pl-8 ring-2 ring-brand-primary/20"
                        value={deposit}
                        onChange={(e) => setDeposit(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Results & Sidebar */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-6">
              {/* Results Card */}
              <div className="relative overflow-hidden rounded-xl bg-neutral-900 p-8 text-white shadow-xl">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-primary/20 blur-3xl" />
                <div className="relative z-10">
                  <p className="mb-2 text-sm font-medium uppercase tracking-widest text-neutral-400">
                    You could borrow up to
                  </p>
                  <h3 className="mb-6 text-5xl font-extrabold">
                    {formatGBP.format(results.maxBorrowing)}
                  </h3>
                  <div className="mb-6 h-px w-full bg-white/10" />
                  <div className="mb-8 flex items-end justify-between">
                    <div>
                      <p className="mb-1 text-sm text-neutral-400">
                        Estimated Budget
                      </p>
                      <h4 className="text-2xl font-bold">
                        {formatGBP.format(results.maxPropertyPrice)}
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="mb-1 text-sm text-neutral-400">
                        Based on deposit
                      </p>
                      <h4 className="text-lg font-semibold text-brand-primary">
                        {formatGBP.format(results.depositAmount)}
                      </h4>
                    </div>
                  </div>
                  {results.maxBorrowing > 0 && (
                    <div className="mb-6">
                      <p className="mb-1 text-sm text-neutral-400">
                        Est. Monthly Payment
                      </p>
                      <h4 className="text-xl font-bold">
                        {formatGBPFull.format(results.monthlyPayment)}/mo
                      </h4>
                      <p className="mt-1 text-xs text-neutral-500">
                        at {(interestRate * 100).toFixed(1)}% over {termYears}{" "}
                        years
                      </p>
                    </div>
                  )}
                  <Link
                    href={`/search?maxPrice=${Math.round(results.maxPropertyPrice)}`}
                    className="block w-full rounded-lg bg-brand-primary py-4 text-center font-bold text-white shadow-lg transition-all hover:bg-brand-primary-light"
                  >
                    Properties in your budget
                  </Link>
                  <p className="mt-4 text-center text-[10px] font-medium uppercase text-neutral-500">
                    Results are estimates based on{" "}
                    {results.incomeMultiplier}x income
                  </p>
                </div>
              </div>

              {/* Broker CTA */}
              <Card className="border-neutral-100 p-8 shadow-sm dark:border-neutral-800">
                <CardContent className="p-0">
                  <h4 className="mb-3 flex items-center gap-2 text-xl font-bold">
                    <Headset className="h-5 w-5 text-brand-primary" />
                    Speak to a Broker
                  </h4>
                  <p className="mb-6 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Our mortgage partners can help you secure the best rates and
                    provide a formal &lsquo;Agreement in Principle&rsquo;.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-brand-primary py-3 font-bold text-brand-primary transition-all hover:bg-brand-primary hover:text-white"
                  >
                    Book Free Consultation
                  </Button>
                </CardContent>
              </Card>

              {/* Trust Badge */}
              <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-white shadow-sm dark:bg-neutral-800">
                    <ShieldCheck className="h-6 w-6 text-neutral-400" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold">Regulated Advice</h5>
                    <p className="text-xs text-neutral-500">
                      FCA Registered Partners
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* How We Calculate Section */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <Card className="border-neutral-100 p-8 lg:p-12 dark:border-neutral-800">
          <CardContent className="p-0">
            <h2 className="mb-8 text-2xl font-bold">
              How we calculate your results
            </h2>
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
              <div className="space-y-4">
                <div className="text-3xl font-bold text-brand-primary">01</div>
                <h3 className="text-lg font-bold">Income Multiplier</h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Most lenders offer between 4 and 4.5 times your combined gross
                  annual income as a base borrowing limit.
                </p>
              </div>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-brand-primary">02</div>
                <h3 className="text-lg font-bold">
                  Affordability Stress-test
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  We deduct your monthly commitments and a portion of living
                  costs to ensure you can afford repayments if rates rise.
                </p>
              </div>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-brand-primary">03</div>
                <h3 className="text-lg font-bold">Loan-to-Value (LTV)</h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  The final budget combines what you can borrow with your
                  deposit, assuming a minimum 5-10% down payment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Related Tools */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h3 className="mb-6 text-lg font-bold">Related Tools</h3>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/tools/mortgage-calculator"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition-colors hover:border-brand-primary hover:text-brand-primary dark:border-neutral-700 dark:bg-neutral-900"
          >
            <Calculator className="h-4 w-4" />
            Mortgage Calculator
          </Link>
          <Link
            href="/tools/stamp-duty-calculator"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition-colors hover:border-brand-primary hover:text-brand-primary dark:border-neutral-700 dark:bg-neutral-900"
          >
            <FileText className="h-4 w-4" />
            SDLT Calculator
          </Link>
        </div>
      </section>
    </>
  );
}
