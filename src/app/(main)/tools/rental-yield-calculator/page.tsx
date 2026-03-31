"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Info,
  CheckCircle,
  Calendar,
  Share2,
  Download,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Banknote,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateSdlt } from "@/lib/calculators/sdlt";

const LONDON_AVERAGE_YIELD = 4.1;
const PURCHASE_COSTS_ESTIMATE = 3000;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseNumericInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return Number(cleaned) || 0;
}

function formatInputValue(value: number): string {
  if (value === 0) return "";
  return new Intl.NumberFormat("en-GB").format(value);
}

function getUrlParam(key: string, defaultValue: number): number {
  if (typeof window === "undefined") return defaultValue;
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key);
  return val !== null && !isNaN(Number(val)) ? Number(val) : defaultValue;
}

export default function RentalYieldCalculatorPage() {
  const [purchasePrice, setPurchasePrice] = useState(() => getUrlParam("price", 300000));
  const [monthlyRent, setMonthlyRent] = useState(() => getUrlParam("rent", 1560));
  const [maintenance, setMaintenance] = useState(1200);
  const [managementFeePercent, setManagementFeePercent] = useState(10);
  const [insurance, setInsurance] = useState(650);
  const [voidWeeks, setVoidWeeks] = useState(4);
  const [depositPercent, setDepositPercent] = useState(25);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Sync key state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (purchasePrice !== 300000) params.set("price", String(purchasePrice));
    if (monthlyRent !== 1560) params.set("rent", String(monthlyRent));
    const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [purchasePrice, monthlyRent]);

  const results = useMemo(() => {
    if (purchasePrice <= 0) {
      return {
        grossYield: 0,
        netYield: 0,
        annualProfit: 0,
        annualRent: 0,
        effectiveAnnualRent: 0,
        managementFees: 0,
        annualCosts: 0,
        voidLoss: 0,
        cashOnCash: 0,
        stampDuty: 0,
        deposit: 0,
        totalCashInvested: 0,
      };
    }

    const annualRent = monthlyRent * 12;
    const effectiveAnnualRent = annualRent * ((52 - voidWeeks) / 52);
    const voidLoss = annualRent - effectiveAnnualRent;
    const managementFees = (effectiveAnnualRent * managementFeePercent) / 100;
    const annualCosts = maintenance + insurance + managementFees;
    const grossYield = (effectiveAnnualRent / purchasePrice) * 100;
    const netYield = ((effectiveAnnualRent - annualCosts) / purchasePrice) * 100;
    const annualProfit = effectiveAnnualRent - annualCosts;

    // Cash-on-cash return
    const stampDuty = calculateSdlt(purchasePrice, "additional").totalTax;
    const deposit = (purchasePrice * depositPercent) / 100;
    const totalCashInvested = deposit + stampDuty + PURCHASE_COSTS_ESTIMATE;
    const cashOnCash = totalCashInvested > 0 ? (annualProfit / totalCashInvested) * 100 : 0;

    return {
      grossYield,
      netYield,
      annualProfit,
      annualRent,
      effectiveAnnualRent,
      managementFees,
      annualCosts,
      voidLoss,
      cashOnCash,
      stampDuty,
      deposit,
      totalCashInvested,
    };
  }, [purchasePrice, monthlyRent, maintenance, managementFeePercent, insurance, voidWeeks, depositPercent]);

  const yieldDifference = results.grossYield - LONDON_AVERAGE_YIELD;

  // Bar chart data: Equity & ROI Timeline (5 year snapshots)
  const timelineData = useMemo(() => {
    if (purchasePrice <= 0) return [];
    return [1, 2, 3, 4, 5].map((year) => {
      const equity = (purchasePrice * depositPercent) / 100 + results.annualProfit * year;
      const roi = results.totalCashInvested > 0
        ? ((results.annualProfit * year) / results.totalCashInvested) * 100
        : 0;
      return { year, equity: Math.max(0, equity), roi: Math.max(0, roi) };
    });
  }, [purchasePrice, depositPercent, results]);

  const maxEquity = Math.max(...timelineData.map((d) => d.equity), 1);

  const faqs = [
    {
      question: "What is the difference between gross and net yield?",
      answer:
        "Gross yield is calculated by dividing the annual rental income by the property purchase price, without accounting for any costs. Net yield subtracts annual operating costs (maintenance, insurance, management fees, void periods) from the rental income before dividing by the purchase price. Net yield gives a more accurate picture of your actual return on investment.",
    },
    {
      question: "What is a good rental yield in the UK?",
      answer:
        "A good rental yield in the UK typically ranges from 5% to 8% gross. However, this varies significantly by location. London properties often yield 3-5%, while properties in northern cities like Liverpool, Manchester, and Sheffield can yield 6-10%. The best yield depends on your investment strategy and risk tolerance.",
    },
    {
      question: "How are management fees typically calculated?",
      answer:
        "Letting agent management fees are usually charged as a percentage of the monthly rent, typically between 8% and 15%. This fee covers rent collection, tenant communication, and day-to-day property management. Some agents charge additional fees for tenant finding, inventory checks, and renewals.",
    },
    {
      question: "Should I include mortgage payments in the calculation?",
      answer:
        "This calculator focuses on rental yield as a measure of property investment performance, which traditionally excludes mortgage costs. Mortgage payments are a financing cost, not an operating cost. However, for a complete picture of your cash flow, you should also use our Mortgage Calculator to understand your monthly outgoings.",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <header className="border-b border-neutral-200 bg-white py-10 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 flex text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            <Link href="/tools" className="hover:text-brand-primary transition-colors">
              Tools
            </Link>
            <span className="mx-2 text-neutral-300">/</span>
            <span className="text-neutral-500">Rental Yield Calculator</span>
          </nav>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Buy-to-Let
              </p>
              <h1 className="font-heading text-3xl font-bold text-neutral-900 md:text-4xl dark:text-white">
                <em className="not-italic">Rental Yield Calculator</em>
              </h1>
              <p className="mt-3 max-w-xl text-sm text-neutral-500 dark:text-neutral-400">
                Quantify your investment potential with surgical precision. Our calculator
                accounts for maintenance, management fees, and void periods to give you an
                accurate view of a property&apos;s performance.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-neutral-200 text-neutral-600 hover:border-brand-primary hover:text-brand-primary"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "Rental Yield Calculator", url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
              >
                <Share2 className="size-3.5" /> Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-neutral-200 text-neutral-600 hover:border-brand-primary hover:text-brand-primary"
                onClick={() => window.print()}
              >
                <Download className="size-3.5" /> PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="bg-[#F7F6F2] dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

            {/* Left / Main Column */}
            <div className="space-y-6 lg:col-span-2">

              {/* ── Inputs ── */}
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                {/* Row 1: Primary inputs */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Property Price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">£</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatInputValue(purchasePrice)}
                        onChange={(e) => setPurchasePrice(parseNumericInput(e.target.value))}
                        className="h-11 rounded-lg border-neutral-200 bg-neutral-50 pl-7 pr-3 text-sm font-medium text-neutral-900 focus-visible:border-brand-primary focus-visible:ring-brand-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Monthly Rent
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">£</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatInputValue(monthlyRent)}
                        onChange={(e) => setMonthlyRent(parseNumericInput(e.target.value))}
                        className="h-11 rounded-lg border-neutral-200 bg-neutral-50 pl-7 pr-3 text-sm font-medium text-neutral-900 focus-visible:border-brand-primary focus-visible:ring-brand-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Deposit
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={depositPercent === 0 ? "" : String(depositPercent)}
                        onChange={(e) => setDepositPercent(parseNumericInput(e.target.value))}
                        className="h-11 rounded-lg border-neutral-200 bg-neutral-50 pl-3 pr-7 text-sm font-medium text-neutral-900 focus-visible:border-brand-primary focus-visible:ring-brand-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">%</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">{formatCurrency(results.deposit)}</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Management
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={managementFeePercent === 0 ? "" : String(managementFeePercent)}
                        onChange={(e) => setManagementFeePercent(parseNumericInput(e.target.value))}
                        className="h-11 rounded-lg border-neutral-200 bg-neutral-50 pl-3 pr-7 text-sm font-medium text-neutral-900 focus-visible:border-brand-primary focus-visible:ring-brand-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">%</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">Letting agent fee</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-5 border-t border-neutral-100 dark:border-neutral-800" />

                {/* Row 2: Annual Operational Costs */}
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Annual Operational Costs
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-neutral-500">Maintenance (£)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">£</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatInputValue(maintenance)}
                        onChange={(e) => setMaintenance(parseNumericInput(e.target.value))}
                        className="h-10 rounded-lg border-neutral-200 bg-neutral-50 pl-7 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-neutral-500">Insurance (£)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">£</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatInputValue(insurance)}
                        onChange={(e) => setInsurance(parseNumericInput(e.target.value))}
                        className="h-10 rounded-lg border-neutral-200 bg-neutral-50 pl-7 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-neutral-500">Void Weeks / Year</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={12}
                      value={voidWeeks === 0 ? "" : String(voidWeeks)}
                      onChange={(e) => {
                        const val = Math.min(12, Math.max(0, Number(e.target.value) || 0));
                        setVoidWeeks(val);
                      }}
                      className="h-10 rounded-lg border-neutral-200 bg-neutral-50 pl-3 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                    />
                    <p className="text-[10px] text-neutral-400">
                      {voidWeeks > 0 ? `${formatCurrency(results.voidLoss)} lost` : "No voids"}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-neutral-500">Annual Gross Rent</Label>
                    <div className="flex h-10 items-center rounded-lg bg-neutral-100 px-3 text-sm font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-white">
                      {formatCurrency(results.annualRent)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Dark stat cards row ── */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-brand-primary p-5 text-white">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
                    Gross Rental Yield
                  </p>
                  <p className="text-3xl font-black tracking-tight">{formatPercent(results.grossYield)}%</p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-white/70">
                    <TrendingUp className="size-3" />
                    {results.grossYield > LONDON_AVERAGE_YIELD ? "Above market avg" : "Below market avg"}
                  </p>
                </div>

                <div className="rounded-2xl bg-brand-primary p-5 text-white">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
                    Net Yield
                  </p>
                  <p className="text-3xl font-black tracking-tight">{formatPercent(results.netYield)}%</p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-white/70">
                    <CheckCircle className="size-3" />
                    {results.netYield > 0 ? "Profitable" : "Operating at a loss"}
                  </p>
                </div>

                <div className="rounded-2xl bg-brand-primary p-5 text-white">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
                    Net Annual Profit
                  </p>
                  <p className="text-3xl font-black tracking-tight">{formatCurrency(results.annualProfit)}</p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-white/70">
                    <Calendar className="size-3" />
                    After all costs
                  </p>
                </div>
              </div>

              {/* ── Equity & ROI Timeline bar chart ── */}
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-heading text-base font-bold text-neutral-900 dark:text-white">
                    Equity &amp; ROI Timeline
                  </h3>
                  <div className="flex items-center gap-4 text-[11px] font-medium text-neutral-500">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-2.5 rounded-sm bg-brand-primary" />
                      Equity (£)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-2.5 rounded-sm bg-brand-secondary" />
                      ROI (%)
                    </span>
                  </div>
                </div>
                <div className="flex items-end gap-3" style={{ height: 120 }}>
                  {timelineData.map((d) => (
                    <div key={d.year} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex w-full items-end gap-0.5" style={{ height: 96 }}>
                        {/* Equity bar */}
                        <div
                          className="flex-1 rounded-t-sm bg-brand-primary transition-all duration-500"
                          style={{ height: `${(d.equity / maxEquity) * 96}px`, minHeight: 4 }}
                        />
                        {/* ROI bar */}
                        <div
                          className="flex-1 rounded-t-sm bg-brand-secondary transition-all duration-500"
                          style={{ height: `${Math.min((d.roi / 50) * 96, 96)}px`, minHeight: 4 }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-neutral-400">{d.year}Y</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Annual P/L Breakdown ── */}
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="mb-4 font-heading text-base font-bold text-neutral-900 dark:text-white">
                  Annual P/L Breakdown
                </h3>
                <ul className="space-y-3">
                  <li className="flex justify-between text-sm">
                    <span className="text-neutral-500">Gross Rental Income</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(results.annualRent)}</span>
                  </li>
                  {voidWeeks > 0 && (
                    <li className="flex justify-between text-sm">
                      <span className="text-neutral-500">Void Period Loss ({voidWeeks} weeks)</span>
                      <span className="font-semibold text-red-500">− {formatCurrency(results.voidLoss)}</span>
                    </li>
                  )}
                  <li className="flex justify-between text-sm">
                    <span className="text-neutral-500">Management Fees ({managementFeePercent}%)</span>
                    <span className="font-semibold text-red-500">− {formatCurrency(results.managementFees)}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-neutral-500">Maintenance &amp; Service</span>
                    <span className="font-semibold text-red-500">− {formatCurrency(maintenance)}</span>
                  </li>
                  <li className="flex justify-between border-b border-neutral-100 pb-3 text-sm dark:border-neutral-800">
                    <span className="text-neutral-500">Insurance &amp; Misc</span>
                    <span className="font-semibold text-red-500">− {formatCurrency(insurance)}</span>
                  </li>
                  <li className="flex justify-between pt-1 text-base">
                    <span className="font-bold text-neutral-900 dark:text-white">Net Annual Profit</span>
                    <span className={`font-bold ${results.annualProfit >= 0 ? "text-brand-primary" : "text-red-500"}`}>
                      {formatCurrency(results.annualProfit)}
                    </span>
                  </li>
                </ul>
              </div>

              {/* ── Cash-on-Cash ── */}
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="mb-4 font-heading text-base font-bold text-neutral-900 dark:text-white">
                  Cash-on-Cash Return Breakdown
                </h3>
                <ul className="space-y-3">
                  <li className="flex justify-between text-sm">
                    <span className="text-neutral-500">Deposit ({depositPercent}%)</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(results.deposit)}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-neutral-500">Stamp Duty (additional property rate)</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(results.stampDuty)}</span>
                  </li>
                  <li className="flex justify-between border-b border-neutral-100 pb-3 text-sm dark:border-neutral-800">
                    <span className="text-neutral-500">Purchase Costs (legal/survey est.)</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(PURCHASE_COSTS_ESTIMATE)}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="font-semibold text-neutral-900 dark:text-white">Total Cash Invested</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(results.totalCashInvested)}</span>
                  </li>
                  <li className="flex justify-between border-t border-neutral-100 pt-3 text-base dark:border-neutral-800">
                    <span className="font-bold text-neutral-900 dark:text-white">Cash-on-Cash Return</span>
                    <span className={`font-bold ${results.cashOnCash >= 0 ? "text-brand-primary" : "text-red-500"}`}>
                      {formatPercent(results.cashOnCash)}%
                    </span>
                  </li>
                </ul>
              </div>

              {/* ── Bottom 2-col: Tax Strategies + Methodology ── */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Essential Tax Strategies */}
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h3 className="mb-4 font-heading text-base font-bold text-neutral-900 dark:text-white">
                    Essential Tax Strategies
                  </h3>
                  <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <li className="flex gap-3">
                      <CheckCircle className="mt-0.5 size-4 shrink-0 text-brand-primary" />
                      <div>
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200">Mortgage Interest Allowance</p>
                        <p className="text-[12px]">Claim tax credit on mortgage interest payments (basic rate only since Section 24).</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle className="mt-0.5 size-4 shrink-0 text-brand-primary" />
                      <div>
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200">Capital Gains Planning</p>
                        <p className="text-[12px]">Hold for the long term and use your annual CGT allowance. Consider transferring to a Ltd company for higher-rate taxpayers.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle className="mt-0.5 size-4 shrink-0 text-brand-primary" />
                      <div>
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200">Allowable Expenses</p>
                        <p className="text-[12px]">Deduct maintenance, management fees, insurance, and professional services from rental income.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Calculation Methodology */}
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <h3 className="mb-4 font-heading text-base font-bold text-neutral-900 dark:text-white">
                    Our Calculation Methodology
                  </h3>
                  <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <p>
                      Our calculator uses industry-standard formulas preferred by professional property investors
                      for high-net-worth investors and certified managers.
                    </p>
                    <ul className="space-y-1.5 text-[12px]">
                      <li className="flex justify-between border-b border-neutral-100 pb-1 dark:border-neutral-800">
                        <span className="text-neutral-500">Gross Yield</span>
                        <span className="font-mono text-neutral-700 dark:text-neutral-300">Annual Rent ÷ Purchase Price</span>
                      </li>
                      <li className="flex justify-between border-b border-neutral-100 pb-1 dark:border-neutral-800">
                        <span className="text-neutral-500">Net Yield</span>
                        <span className="font-mono text-neutral-700 dark:text-neutral-300">(Rent − Costs) ÷ Price</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-neutral-500">Cash-on-Cash</span>
                        <span className="font-mono text-neutral-700 dark:text-neutral-300">Net Profit ÷ Cash Invested</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ── FAQ ── */}
              <div>
                <h3 className="mb-4 font-heading text-lg font-bold text-neutral-900 dark:text-white">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-2">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between p-5 text-left"
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      >
                        <span className="pr-4 text-sm font-semibold text-neutral-900 dark:text-white">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`size-4 shrink-0 text-neutral-400 transition-transform ${expandedFaq === index ? "rotate-180" : ""}`}
                        />
                      </button>
                      {expandedFaq === index && (
                        <div className="border-t border-neutral-100 px-5 pb-5 pt-4 dark:border-neutral-800">
                          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Find a Letting Agent CTA ── */}
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-brand-primary/20 bg-brand-primary-lighter px-6 py-8 text-center sm:flex-row sm:text-left dark:bg-brand-primary/10">
                <MapPin className="size-8 shrink-0 text-brand-primary" />
                <div className="flex-1">
                  <p className="font-heading text-base font-bold text-neutral-900 dark:text-white">Find a Letting Agent</p>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    Compare top-rated local agents to maximise your yield and minimise voids.
                  </p>
                </div>
                <Link href="/agents">
                  <Button className="shrink-0 gap-2 bg-brand-primary px-6 font-semibold text-white hover:bg-brand-primary-light">
                    Browse Agents <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>

              {/* ── Related Tools ── */}
              <div className="flex flex-wrap gap-3">
                <Link href="/tools/mortgage-calculator">
                  <Button variant="outline" size="sm" className="gap-2 border-neutral-200 text-neutral-600 hover:border-brand-primary hover:text-brand-primary">
                    Mortgage Calculator <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
                <Link href="/tools/stamp-duty-calculator">
                  <Button variant="outline" size="sm" className="gap-2 border-neutral-200 text-neutral-600 hover:border-brand-primary hover:text-brand-primary">
                    Stamp Duty Calculator <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* ── Right Sidebar ── */}
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">

              {/* CTA: Maximise yield */}
              <div className="overflow-hidden rounded-2xl bg-brand-primary p-6 text-white shadow-sm">
                <h4 className="mb-2 font-heading text-base font-bold">
                  Maximise your yield with local expertise.
                </h4>
                <p className="mb-4 text-sm leading-relaxed text-white/70">
                  Using Britestate connects you with the best letting agents in your area. Compare fees, reviews, and average void periods before choosing.
                </p>
                <Link href="/agents">
                  <Button className="w-full gap-2 bg-brand-secondary font-semibold text-white hover:bg-brand-secondary/90">
                    Find a Letting Agent <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>

              {/* Property image card */}
              <div className="overflow-hidden rounded-2xl shadow-sm">
                <div
                  className="relative h-44 bg-cover bg-center"
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop')" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Market Insight</p>
                    <p className="font-heading text-base font-bold text-white">The Rise of Suburban Sanctuary Living</p>
                  </div>
                </div>
              </div>

              {/* Area benchmarks */}
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-900">
                <h4 className="mb-4 text-sm font-bold text-neutral-900 dark:text-white">
                  Area Benchmarks
                </h4>
                <div className="space-y-3">
                  {[
                    { area: "London", yield: 4.1 },
                    { area: "Manchester", yield: 6.2 },
                    { area: "Liverpool", yield: 7.3 },
                    { area: "Birmingham", yield: 5.9 },
                  ].map((item) => (
                    <div key={item.area} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">{item.area}</span>
                      <span className="font-bold text-brand-primary">{item.yield.toFixed(1)}%</span>
                    </div>
                  ))}
                  <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm font-bold dark:border-neutral-800">
                    <span className="text-neutral-900 dark:text-white">Your Property</span>
                    <span className={results.grossYield > 0 ? "text-brand-primary" : "text-neutral-400"}>
                      {formatPercent(results.grossYield)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Landlord Insurance CTA */}
              <div className="relative overflow-hidden rounded-2xl bg-neutral-900 p-6 text-white dark:bg-neutral-800">
                <div className="relative z-10">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-white/10">
                    <ShieldCheck className="size-5 text-white" />
                  </div>
                  <h4 className="mb-2 font-heading text-base font-bold">Landlord Insurance</h4>
                  <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                    Protect your investment with comprehensive building and rent guarantee insurance from £15/mo.
                  </p>
                  <Button className="w-full bg-white py-3 font-bold text-neutral-900 hover:bg-neutral-100">
                    Get Instant Quote
                  </Button>
                </div>
                <div className="absolute -bottom-10 -right-10 size-36 rounded-full bg-brand-primary/20 blur-3xl" />
              </div>

              {/* Cash-on-cash aside stat */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                  Cash-on-Cash Return
                </p>
                <p className={`text-3xl font-black ${results.cashOnCash >= 0 ? "text-brand-primary" : "text-red-500"}`}>
                  {formatPercent(results.cashOnCash)}%
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
                  <Banknote className="size-3" />
                  {formatCurrency(results.totalCashInvested)} invested
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px]">
                  <Info className="size-3 text-neutral-400" />
                  <span className="text-neutral-400">Profit ÷ total cash deployed</span>
                </div>
              </div>

              {/* Comparison bar */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h4 className="mb-4 text-sm font-bold text-neutral-900 dark:text-white">
                  vs. Area Average
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-neutral-500">Your Property</span>
                      <span className="font-bold text-brand-primary">{formatPercent(results.grossYield)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-brand-primary transition-all"
                        style={{ width: `${Math.min(results.grossYield * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-neutral-500">London Avg</span>
                      <span className="font-bold text-neutral-500">{formatPercent(LONDON_AVERAGE_YIELD)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-neutral-300 dark:bg-neutral-600"
                        style={{ width: `${LONDON_AVERAGE_YIELD * 10}%` }}
                      />
                    </div>
                  </div>
                  <p className="rounded-lg bg-brand-primary-lighter px-3 py-2 text-[11px] leading-relaxed text-brand-primary dark:bg-brand-primary/10">
                    {yieldDifference > 0
                      ? `${formatPercent(yieldDifference)}% above London average — strong investment potential.`
                      : `${formatPercent(Math.abs(yieldDifference))}% below London average — review your rental pricing.`}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
