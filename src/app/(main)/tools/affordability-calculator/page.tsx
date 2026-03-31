"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  User,
  UserPlus,
  Banknote,
  ShieldCheck,
  Headset,
  Calculator,
  FileText,
  BadgeCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

function getUrlStr(key: string, defaultValue: string): string {
  if (typeof window === "undefined") return defaultValue;
  const params = new URLSearchParams(window.location.search);
  return params.get(key) ?? defaultValue;
}

// Placeholder property card data for decorative "Properties in bracket" section
const PLACEHOLDER_PROPERTIES = [
  {
    label: "The Monarch",
    location: "Kensington, London",
    gradient: "from-neutral-700 to-neutral-900",
    accent: "from-brand-primary/40 to-brand-primary/10",
  },
  {
    label: "Stone Pavilion",
    location: "Fulham, London",
    gradient: "from-stone-600 to-stone-900",
    accent: "from-brand-primary-light/40 to-brand-primary/10",
  },
  {
    label: "Chisleden Court",
    location: "Chelsea, London",
    gradient: "from-zinc-600 to-zinc-900",
    accent: "from-neutral-500/30 to-neutral-800/60",
  },
];

export default function AffordabilityCalculatorPage() {
  // Applicant 1
  const [app1Salary, setApp1Salary] = useState(() => getUrlStr("salary", ""));
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
  const [deposit, setDeposit] = useState(() => getUrlStr("deposit", ""));

  // Sync key state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (app1Salary) params.set("salary", app1Salary);
    if (deposit) params.set("deposit", deposit);
    const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [app1Salary, deposit]);

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
    const debtAmount = parseNum(monthlyDebt);
    const livingAmount = parseNum(monthlyLiving);

    // Base borrowing from income multiplier
    const baseBorrowing = totalIncome * incomeMultiplier;

    // Debt repayments reduce borrowing capacity
    const debtReduction = debtAmount * 12 * incomeMultiplier;

    // Living costs apply a softer 50% weighting
    const livingReduction = livingAmount * 12 * incomeMultiplier * 0.5;

    const commitmentReduction = debtReduction + livingReduction;
    const maxBorrowing = Math.max(0, baseBorrowing - commitmentReduction);
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

    // Stress test at 7%
    const stressRate = 0.07;
    const stressMonthlyRate = stressRate / 12;
    let stressMonthlyPayment = 0;
    if (maxBorrowing > 0) {
      stressMonthlyPayment =
        (maxBorrowing *
          (stressMonthlyRate * Math.pow(1 + stressMonthlyRate, termMonths))) /
        (Math.pow(1 + stressMonthlyRate, termMonths) - 1);
    }

    // Affordability percentage: monthly payment as % of monthly gross income
    const monthlyIncome = totalIncome / 12;
    const affordabilityPct =
      monthlyIncome > 0 ? (monthlyPayment / monthlyIncome) * 100 : 0;

    // LTV
    const ltv =
      maxPropertyPrice > 0 ? (maxBorrowing / maxPropertyPrice) * 100 : 0;

    return {
      incomeMultiplier,
      totalIncome,
      baseBorrowing,
      commitmentReduction,
      maxBorrowing,
      maxPropertyPrice,
      monthlyPayment,
      stressMonthlyPayment,
      depositAmount,
      affordabilityPct,
      ltv,
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
    monthlyDebt,
    monthlyLiving,
  ]);

  const hasResults = results.maxPropertyPrice > 0;

  return (
    <>
      {/* Hero / Header */}
      <header className="bg-white border-b border-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 py-14">
        <div className="mx-auto max-w-7xl px-6">
          <nav className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
            <Link href="/tools" className="hover:text-brand-primary transition-colors">
              Tools
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-600 dark:text-neutral-300">Affordability Calculator</span>
          </nav>
          <h1 className="font-heading text-5xl font-bold leading-tight text-neutral-900 dark:text-white">
            Define Your Purchasing{" "}
            <em className="not-italic text-brand-primary italic font-heading">Power.</em>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
            Estimate your property purchasing potential. Our model accounts for
            income, outgoings, and deposit — giving you a realistic view of
            your next acquisition.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* ── Left Column: Form ── */}
          <div className="space-y-8 lg:col-span-7">
            {/* Financial Disclosure heading */}
            <div className="pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                Financial Disclosure
              </p>
            </div>

            {/* Applicant 1 */}
            <div className="rounded-xl border border-neutral-100 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary-lighter text-brand-primary dark:bg-brand-primary/20">
                  <User className="h-4 w-4" />
                </div>
                <h2 className="font-heading text-lg font-semibold text-neutral-900 dark:text-white">
                  Applicant 1
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Annual Salary (Pre-tax)
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                      £
                    </span>
                    <Input
                      type="number"
                      placeholder="50,000"
                      className="h-11 pl-7 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-sm"
                      value={app1Salary}
                      onChange={(e) => setApp1Salary(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Annual Bonus / Commission
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                      £
                    </span>
                    <Input
                      type="number"
                      placeholder="5,000"
                      className="h-11 pl-7 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-sm"
                      value={app1Bonus}
                      onChange={(e) => setApp1Bonus(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Other Regular Income
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                      £
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="h-11 pl-7 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-sm"
                      value={app1Other}
                      onChange={(e) => setApp1Other(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Applicant 2 */}
            <div className="rounded-xl border border-neutral-100 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                      hasApplicant2
                        ? "bg-brand-primary-lighter text-brand-primary dark:bg-brand-primary/20"
                        : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                    )}
                  >
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <h2 className="font-heading text-lg font-semibold text-neutral-900 dark:text-white">
                    Applicant 2
                  </h2>
                </div>
                <Switch
                  checked={hasApplicant2}
                  onCheckedChange={setHasApplicant2}
                />
              </div>
              {hasApplicant2 && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Annual Salary (Pre-tax)
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                        £
                      </span>
                      <Input
                        type="number"
                        placeholder="35,000"
                        className="h-11 pl-7 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-sm"
                        value={app2Salary}
                        onChange={(e) => setApp2Salary(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Annual Bonus / Commission
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                        £
                      </span>
                      <Input
                        type="number"
                        placeholder="5,000"
                        className="h-11 pl-7 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-sm"
                        value={app2Bonus}
                        onChange={(e) => setApp2Bonus(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Other Regular Income
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                        £
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        className="h-11 pl-7 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-sm"
                        value={app2Other}
                        onChange={(e) => setApp2Other(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Outgoings & Deposit */}
            <div className="rounded-xl border border-neutral-100 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary-lighter text-brand-primary dark:bg-brand-primary/20">
                  <Banknote className="h-4 w-4" />
                </div>
                <h2 className="font-heading text-lg font-semibold text-neutral-900 dark:text-white">
                  Outgoings &amp; Deposit
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Monthly Debt Repayments
                  </Label>
                  <p className="mb-2 text-[11px] text-neutral-400">
                    Loans, credit cards, car finance
                  </p>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                      £
                    </span>
                    <Input
                      type="number"
                      placeholder="250"
                      className="h-11 pl-7 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-sm"
                      value={monthlyDebt}
                      onChange={(e) => setMonthlyDebt(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Monthly Living Costs
                  </Label>
                  <p className="mb-2 text-[11px] text-neutral-400">
                    Childcare, insurance, essential costs
                  </p>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                      £
                    </span>
                    <Input
                      type="number"
                      placeholder="1,200"
                      className="h-11 pl-7 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-sm"
                      value={monthlyLiving}
                      onChange={(e) => setMonthlyLiving(e.target.value)}
                    />
                  </div>
                </div>
                <div className="border-t border-neutral-100 pt-5 dark:border-neutral-800 md:col-span-2">
                  <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Total Deposit Available
                  </Label>
                  <div className="relative max-w-xs">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                      £
                    </span>
                    <Input
                      type="number"
                      placeholder="45,000"
                      className="h-11 pl-7 border-brand-primary/40 bg-brand-primary-lighter/30 text-sm ring-1 ring-brand-primary/20 dark:bg-brand-primary/10"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button (mobile — visible below lg) */}
            <div className="block lg:hidden">
              <Link
                href={`/search?maxPrice=${Math.round(results.maxPropertyPrice)}`}
                className="block w-full rounded-xl bg-brand-primary py-4 text-center text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-primary-light"
              >
                Find Properties in Your Budget
              </Link>
            </div>
          </div>

          {/* ── Right Column: Results ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-5">
              {/* Main Results Card — dark green */}
              <div className="relative overflow-hidden rounded-2xl bg-brand-primary p-8 text-white shadow-xl">
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/5 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />

                <div className="relative z-10">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-white/50">
                    Estimated Purchase Budget
                  </p>
                  <h3 className="mb-1 font-heading text-5xl font-bold text-white">
                    {formatGBP.format(results.maxPropertyPrice)}
                  </h3>
                  <p className="mb-6 text-sm text-white/60">
                    Deposit:{" "}
                    <span className="font-semibold text-white/80">
                      {formatGBP.format(results.depositAmount)}
                    </span>
                    {" "}+ Borrowing:{" "}
                    <span className="font-semibold text-white/80">
                      {formatGBP.format(results.maxBorrowing)}
                    </span>
                  </p>

                  {/* Mortgage Pre-Approval badge */}
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                    <BadgeCheck className="h-3.5 w-3.5 text-brand-secondary" />
                    Mortgage Pre-Approval
                  </div>

                  <div className="mb-6 h-px w-full bg-white/10" />

                  {/* Stats row */}
                  <div className="mb-6 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white/10 p-3">
                      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-white/50">
                        Affordability
                      </p>
                      <p className="text-base font-bold text-white">
                        {results.affordabilityPct > 0
                          ? `${results.affordabilityPct.toFixed(0)}%`
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/10 p-3">
                      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-white/50">
                        LTV
                      </p>
                      <p className="text-base font-bold text-white">
                        {results.ltv > 0 ? `${results.ltv.toFixed(0)}%` : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/10 p-3">
                      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-white/50">
                        Monthly
                      </p>
                      <p className="text-base font-bold text-white">
                        {results.monthlyPayment > 0
                          ? formatGBP.format(results.monthlyPayment)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {results.maxBorrowing > 0 && (
                    <div className="mb-5 rounded-xl bg-white/10 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-white/60">
                          Stress test at 7%
                        </p>
                        <p className="text-sm font-bold text-white">
                          {formatGBPFull.format(results.stressMonthlyPayment)}/mo
                        </p>
                      </div>
                      <p className="mt-1 text-[10px] text-white/40">
                        Lenders test affordability at higher rates to ensure
                        you can still pay if rates rise.
                      </p>
                    </div>
                  )}

                  <Link
                    href={`/search?maxPrice=${Math.round(results.maxPropertyPrice)}`}
                    className="block w-full rounded-xl border border-white/20 bg-white py-3.5 text-center text-sm font-bold text-brand-primary shadow-sm transition-all hover:bg-neutral-50"
                  >
                    Properties within your predicted bracket
                  </Link>

                  <p className="mt-4 text-center text-[10px] text-white/40">
                    Results based on {results.incomeMultiplier}x income multiplier
                    {results.commitmentReduction > 0
                      ? `, reduced for commitments (−${formatGBP.format(results.commitmentReduction)})`
                      : ""}
                  </p>
                </div>
              </div>

              {/* Broker CTA */}
              <div className="rounded-xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h4 className="mb-2 flex items-center gap-2 font-heading text-base font-semibold text-neutral-900 dark:text-white">
                  <Headset className="h-4 w-4 text-brand-primary" />
                  Speak to a Broker
                </h4>
                <p className="mb-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Our mortgage partners can secure the best rates and provide a
                  formal &lsquo;Agreement in Principle&rsquo;.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white text-sm font-semibold"
                  asChild
                >
                  <Link href="/marketplace?category=mortgage-broker">
                    Book Free Consultation
                  </Link>
                </Button>
              </div>

              {/* Trust badge */}
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-700 dark:bg-neutral-800/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-900">
                  <ShieldCheck className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Regulated Advice
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    FCA Registered Partners
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Properties within your predicted bracket ── */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Browse
            </p>
            <h2 className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">
              Properties within your predicted bracket
            </h2>
          </div>
          {hasResults && (
            <Link
              href={`/search?maxPrice=${Math.round(results.maxPropertyPrice)}`}
              className="hidden text-sm font-medium text-brand-primary hover:underline sm:inline-flex items-center gap-1"
            >
              View all
              <TrendingUp className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PLACEHOLDER_PROPERTIES.map((prop) => (
            <Link
              key={prop.label}
              href={hasResults ? `/search?maxPrice=${Math.round(results.maxPropertyPrice)}` : "/search"}
              className="group block overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Decorative placeholder image */}
              <div
                className={cn(
                  "relative h-48 w-full bg-gradient-to-br",
                  prop.gradient
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t opacity-60",
                    prop.accent
                  )}
                />
                <div className="absolute inset-0 flex items-end p-4">
                  <div className="w-full">
                    <div className="mb-1 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      For Sale
                    </div>
                    <p className="font-heading text-sm font-bold text-white">
                      {hasResults ? formatGBP.format(results.maxPropertyPrice * (0.85 + Math.random() * 0.15)) : "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white px-4 py-3 dark:bg-neutral-900">
                <p className="text-sm font-semibold text-neutral-900 group-hover:text-brand-primary dark:text-white">
                  {prop.label}
                </p>
                <p className="text-xs text-neutral-500">{prop.location}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How we calculate ── */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-2xl border border-neutral-100 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900 lg:p-12">
          <h2 className="mb-8 font-heading text-2xl font-bold text-neutral-900 dark:text-white">
            The Invisible Estate Guarantee your results
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {[
              {
                num: "01",
                title: "Income Multiplier",
                body: "Most lenders offer 4–4.5× your combined gross annual income as a base borrowing limit, varying by lender and risk profile.",
              },
              {
                num: "02",
                title: "Affordability Stress-test",
                body: "We deduct monthly commitments and a portion of living costs to ensure you can afford repayments even if rates rise to 7%.",
              },
              {
                num: "03",
                title: "Loan-to-Value (LTV)",
                body: "The final budget combines what you can borrow with your deposit. A lower LTV typically unlocks better mortgage rates.",
              },
            ].map((item) => (
              <div key={item.num} className="space-y-3">
                <div className="font-heading text-3xl font-bold text-brand-primary opacity-60">
                  {item.num}
                </div>
                <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Related Tools ── */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          Related Tools
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/tools/mortgage-calculator${results.maxPropertyPrice > 0 ? `?price=${Math.round(results.maxPropertyPrice)}` : ""}`}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-brand-primary hover:text-brand-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <Calculator className="h-4 w-4" />
            Mortgage Calculator
          </Link>
          <Link
            href={`/tools/stamp-duty-calculator${results.maxPropertyPrice > 0 ? `?price=${Math.round(results.maxPropertyPrice)}` : ""}`}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-brand-primary hover:text-brand-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <FileText className="h-4 w-4" />
            SDLT Calculator
          </Link>
        </div>
      </section>
    </>
  );
}
