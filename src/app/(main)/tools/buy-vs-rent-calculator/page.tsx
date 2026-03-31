"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  TrendingUp,
  Info,
  ArrowRight,
  Home,
  Key,
  ChevronDown,
  ChevronUp,
  Calculator,
  PiggyBank,
  Scale,
  BookOpen,
  BarChart2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calculateSdlt } from "@/lib/calculators/sdlt";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

type YearData = {
  year: number;
  buyingCost: number;
  rentingCost: number;
  propertyValue: number;
  equity: number;
  totalMortgagePaid: number;
  totalRentPaid: number;
};

const FAQ_ITEMS = [
  {
    question: "How is the break-even point calculated?",
    answer:
      "The break-even point is the year when the cumulative cost of buying (deposit + mortgage payments + maintenance - equity gained) becomes less than the cumulative cost of renting (rent payments - investment returns on your saved deposit). This accounts for property price growth, mortgage interest, and potential investment returns.",
  },
  {
    question: "What assumptions does this calculator make?",
    answer:
      "This calculator assumes a repayment mortgage over 25 years, annual maintenance costs of 1% of the appreciated property value (cumulative), stamp duty (SDLT) at standard residential rates, and that rent increases at the specified inflation rate. Legal fees and survey costs are excluded for simplicity. Investment returns on the deposit alternative are compounded annually.",
  },
  {
    question: "Should I use this calculator as financial advice?",
    answer:
      "No. This tool provides estimates for comparison purposes only and does not constitute financial advice. Property markets are unpredictable, and individual circumstances vary. Always consult a qualified financial adviser before making major property decisions.",
  },
  {
    question: "What is a typical property growth rate in the UK?",
    answer:
      "Historically, UK property prices have grown at around 3-4% per year on average, though this varies significantly by region and time period. London and the South East have typically seen higher growth, while other regions may be lower. Past performance does not guarantee future results.",
  },
];

function getUrlParam(key: string, defaultValue: number): number {
  if (typeof window === "undefined") return defaultValue;
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key);
  return val !== null && !isNaN(Number(val)) ? Number(val) : defaultValue;
}

export default function BuyVsRentCalculatorPage() {
  const [propertyPrice, setPropertyPrice] = useState(() => getUrlParam("price", 450000));
  const [monthlyRent, setMonthlyRent] = useState(() => getUrlParam("rent", 1850));
  const [growthRate, setGrowthRate] = useState(() => getUrlParam("growth", 3.5));
  const [depositPercent, setDepositPercent] = useState(15);
  const [mortgageRate, setMortgageRate] = useState(4.2);
  const [rentInflation, setRentInflation] = useState(2.5);
  const [investmentReturn, setInvestmentReturn] = useState(5.0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Sync key state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (propertyPrice !== 450000) params.set("price", String(propertyPrice));
    if (monthlyRent !== 1850) params.set("rent", String(monthlyRent));
    if (growthRate !== 3.5) params.set("growth", String(growthRate));
    const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [propertyPrice, monthlyRent, growthRate]);

  const deposit = (propertyPrice * depositPercent) / 100;
  const loanAmount = propertyPrice - deposit;
  const maintenanceRate = 0.01;

  const results = useMemo(() => {
    const monthlyRate = mortgageRate / 100 / 12;
    const totalPayments = 25 * 12;
    const monthlyMortgage =
      monthlyRate > 0
        ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
          (Math.pow(1 + monthlyRate, totalPayments) - 1)
        : loanAmount / totalPayments;

    const stampDuty = calculateSdlt(propertyPrice, "standard").totalTax;

    const yearData: YearData[] = [];
    let breakEvenYear: number | null = null;
    let cumulativeMaintenance = 0;

    for (let year = 1; year <= 25; year++) {
      const propertyValue = propertyPrice * Math.pow(1 + growthRate / 100, year);
      cumulativeMaintenance += maintenanceRate * propertyValue;

      const paymentsMade = year * 12;
      const remainingBalance =
        monthlyRate > 0
          ? loanAmount * Math.pow(1 + monthlyRate, paymentsMade) -
            monthlyMortgage *
              ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate)
          : loanAmount - monthlyMortgage * paymentsMade;

      const totalMortgagePaid = monthlyMortgage * 12 * year;
      const equity = propertyValue - Math.max(0, remainingBalance);
      const buyingCost =
        deposit + stampDuty + totalMortgagePaid + cumulativeMaintenance - equity;

      let totalRentPaid = 0;
      for (let y = 0; y < year; y++) {
        totalRentPaid += monthlyRent * 12 * Math.pow(1 + rentInflation / 100, y);
      }

      const investmentValue = deposit * Math.pow(1 + investmentReturn / 100, year);
      const rentingCost = totalRentPaid - investmentValue + deposit;

      yearData.push({
        year,
        buyingCost,
        rentingCost,
        propertyValue,
        equity,
        totalMortgagePaid,
        totalRentPaid,
      });

      if (breakEvenYear === null && buyingCost < rentingCost) {
        breakEvenYear = year;
      }
    }

    const tenYearData = yearData.find((d) => d.year === 10);
    const netGain10yr = tenYearData
      ? tenYearData.rentingCost - tenYearData.buyingCost
      : 0;

    return { yearData, breakEvenYear, monthlyMortgage, netGain10yr };
  }, [
    propertyPrice,
    monthlyRent,
    growthRate,
    depositPercent,
    mortgageRate,
    rentInflation,
    investmentReturn,
    loanAmount,
    deposit,
    maintenanceRate,
  ]);

  const highlightYears = [1, 5, 10, 15, 25];
  const tableRows = results.yearData.filter((d) => highlightYears.includes(d.year));

  // Chart data — normalise bar heights for the visual bar chart
  const chartYears = [1, 3, 5, 7, 10, 15, 20, 25];
  const chartData = results.yearData.filter((d) => chartYears.includes(d.year));
  const maxVal = Math.max(...chartData.flatMap((d) => [d.buyingCost, d.rentingCost]));

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <header className="bg-brand-primary text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row min-h-[340px]">
            {/* Left copy */}
            <div className="flex-1 py-14 lg:py-20 pr-0 lg:pr-12">
              <nav className="flex mb-6 text-xs font-semibold text-white/50 uppercase tracking-widest">
                <Link href="/tools" className="hover:text-white transition-colors">
                  Tools
                </Link>
                <span className="mx-2">/</span>
                <span className="text-white/70">Buy vs Rent</span>
              </nav>

              <h1 className="text-5xl md:text-6xl font-bold font-heading leading-tight mb-5">
                Is it better to<br />buy or rent?
              </h1>
              <p className="text-white/70 text-base max-w-md leading-relaxed">
                A data-driven analysis using your real numbers — purchase costs, equity
                projections, alternative investments, and capital growth — to give you
                a definitive answer.
              </p>
            </div>

            {/* Right decorative panel */}
            <div className="hidden lg:flex lg:w-80 xl:w-96 items-stretch">
              <div className="w-full bg-white/5 border-l border-white/10 flex flex-col items-center justify-center gap-4 px-8 py-12">
                <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex flex-col items-center justify-center gap-2">
                  <div className="grid grid-cols-3 gap-1.5 w-24">
                    {[60, 85, 40, 70, 95, 55, 80, 45, 65].map((h, i) => (
                      <div
                        key={i}
                        className="bg-white/30 rounded-sm"
                        style={{ height: `${h * 0.4}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-2">
                    sanctuary
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                    Est. Net Gain (10yr)
                  </div>
                  <div className="text-3xl font-bold font-heading text-white">
                    {formatCurrency(Math.abs(results.netGain10yr))}
                  </div>
                  <div className="text-white/40 text-xs mt-1">
                    {results.netGain10yr > 0 ? "buying advantage" : "renting advantage"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Verdict Banner ───────────────────────────────────────────────── */}
      <section className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-2">
                Our Analysis
              </p>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-neutral-900 dark:text-white">
                {results.breakEvenYear ? (
                  <>
                    Buying becomes cheaper than renting after{" "}
                    <span className="text-brand-primary">
                      {results.breakEvenYear}{" "}
                      {results.breakEvenYear === 1 ? "year" : "years"}.
                    </span>
                  </>
                ) : (
                  <>
                    Renting remains cheaper{" "}
                    <span className="text-brand-primary">over 25 years.</span>
                  </>
                )}
              </h2>
              <p className="text-sm text-neutral-500 mt-3 max-w-lg">
                {results.breakEvenYear
                  ? `Based on current market growth and interest rates, equity gain outpaces rent and costs at the ${results.breakEvenYear * 12}-month mark.`
                  : "With the current parameters, renting and investing your deposit produces better returns over the modelled period."}
              </p>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="text-center px-6 py-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">
                  Break-even
                </p>
                <p className="text-4xl font-bold font-heading text-brand-primary">
                  {results.breakEvenYear ?? "25+"}
                </p>
                <p className="text-xs text-neutral-400 mt-1">years</p>
              </div>
              <div className="text-center px-6 py-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">
                  Net Advantage (10yr)
                </p>
                <p className="text-4xl font-bold font-heading text-brand-secondary">
                  {formatCurrency(Math.abs(results.netGain10yr))}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {results.netGain10yr > 0 ? "buying" : "renting"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ─── Main Content ──────────────────────────────────────────────── */}
          <div className="flex-1 space-y-8 min-w-0">

            {/* Variable Parameters Form */}
            <Card className="p-0 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-7">
                  <SlidersHorizontal className="size-5 text-brand-primary" />
                  <h2 className="text-xl font-bold font-heading">Variable Parameters</h2>
                </div>

                {/* Primary inputs row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                  {/* Property Price */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                        Property Price
                      </Label>
                      <span className="text-sm font-bold text-brand-primary">
                        {formatCurrency(propertyPrice)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={100000}
                      max={2000000}
                      step={10000}
                      value={propertyPrice}
                      onChange={(e) => setPropertyPrice(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer accent-brand-primary"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">£</span>
                      <Input
                        type="number"
                        value={propertyPrice}
                        onChange={(e) => setPropertyPrice(Number(e.target.value))}
                        className="pl-7 text-sm bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                    </div>
                  </div>

                  {/* Monthly Rent */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                        Monthly Rent
                      </Label>
                      <span className="text-sm font-bold text-brand-primary">
                        {formatCurrency(monthlyRent)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={10000}
                      step={50}
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer accent-brand-primary"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">£</span>
                      <Input
                        type="number"
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                        className="pl-7 text-sm bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                    </div>
                  </div>

                  {/* Annual Growth */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                        Annual Growth
                        <Info className="size-3 text-neutral-400" aria-label="Estimated annual property price appreciation" />
                      </Label>
                      <span className="text-sm font-bold text-brand-primary">{growthRate}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={0.1}
                      value={growthRate}
                      onChange={(e) => setGrowthRate(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer accent-brand-primary"
                    />
                    <div className="relative">
                      <Input
                        type="number"
                        value={growthRate}
                        onChange={(e) => setGrowthRate(Number(e.target.value))}
                        className="pr-8 text-right text-sm bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">%</span>
                    </div>
                  </div>
                </div>

                {/* Advanced inputs row */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Deposit %
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={depositPercent}
                        onChange={(e) => setDepositPercent(Number(e.target.value))}
                        className="pr-7 text-sm bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Mortgage Rate
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={mortgageRate}
                        onChange={(e) => setMortgageRate(Number(e.target.value))}
                        className="pr-7 text-sm bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Rent Inflation
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={rentInflation}
                        onChange={(e) => setRentInflation(Number(e.target.value))}
                        className="pr-7 text-sm bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Investment Return
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={investmentReturn}
                        onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                        className="pr-7 text-sm bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart Comparison */}
            <Card className="p-0 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="size-5 text-brand-primary" />
                    <h2 className="text-xl font-bold font-heading">Cost Comparison Over Time</h2>
                  </div>
                  <div className="flex items-center gap-5 text-xs font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-brand-primary inline-block" />
                      Buying
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-brand-secondary inline-block" />
                      Renting
                    </span>
                  </div>
                </div>

                {/* Bar chart */}
                <div className="flex items-end gap-2 sm:gap-3 h-44 mb-3">
                  {chartData.map((d) => {
                    const buyH = maxVal > 0 ? Math.max(2, Math.round((d.buyingCost / maxVal) * 100)) : 2;
                    const rentH = maxVal > 0 ? Math.max(2, Math.round((d.rentingCost / maxVal) * 100)) : 2;
                    const buyFav = d.buyingCost <= d.rentingCost;
                    return (
                      <div key={d.year} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end gap-0.5 h-40">
                          <div
                            className={`flex-1 rounded-t transition-all duration-500 ${buyFav ? "bg-brand-primary" : "bg-brand-primary/50"}`}
                            style={{ height: `${buyH}%` }}
                            title={`Buying: ${formatCurrency(d.buyingCost)}`}
                          />
                          <div
                            className={`flex-1 rounded-t transition-all duration-500 ${!buyFav ? "bg-brand-secondary" : "bg-brand-secondary/50"}`}
                            style={{ height: `${rentH}%` }}
                            title={`Renting: ${formatCurrency(d.rentingCost)}`}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-neutral-400">Yr {d.year}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Comparison table */}
                <div className="mt-8 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="text-left py-2.5 px-3 font-bold text-neutral-400 uppercase tracking-wider text-xs">
                          Year
                        </th>
                        <th className="text-right py-2.5 px-3 font-bold text-neutral-400 uppercase tracking-wider text-xs">
                          Cum. Buying
                        </th>
                        <th className="text-right py-2.5 px-3 font-bold text-neutral-400 uppercase tracking-wider text-xs">
                          Cum. Renting
                        </th>
                        <th className="text-right py-2.5 px-3 font-bold text-neutral-400 uppercase tracking-wider text-xs">
                          Net Benefit
                        </th>
                        <th className="text-right py-2.5 px-3 font-bold text-neutral-400 uppercase tracking-wider text-xs hidden sm:table-cell">
                          Property Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => {
                        const diff = row.rentingCost - row.buyingCost;
                        const buyingCheaper = diff > 0;
                        return (
                          <tr
                            key={row.year}
                            className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                          >
                            <td className="py-3 px-3 font-bold text-neutral-900 dark:text-white">
                              {row.year}yr
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-brand-primary">
                              {formatCurrency(row.buyingCost)}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-neutral-500">
                              {formatCurrency(row.rentingCost)}
                            </td>
                            <td
                              className={`py-3 px-3 text-right font-bold text-xs ${
                                buyingCheaper
                                  ? "text-brand-primary"
                                  : "text-brand-secondary"
                              }`}
                            >
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  buyingCheaper
                                    ? "bg-brand-primary-lighter text-brand-primary"
                                    : "bg-brand-secondary-light text-brand-secondary"
                                }`}
                              >
                                {buyingCheaper ? "Buy" : "Rent"} +{formatCurrency(Math.abs(diff))}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-neutral-500 hidden sm:table-cell">
                              {formatCurrency(row.propertyValue)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Two-col info section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Algorithmic Methodology */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="size-4 text-brand-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-brand-primary">
                    Algorithmic Methodology
                  </h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                  We use compounding mortgage amortisation against rent inflation to
                  pinpoint the crossover year with mathematical precision.
                </p>
                <ul className="space-y-1 text-xs text-neutral-500">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-brand-primary inline-block" />
                    25-year repayment mortgage model
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-brand-primary inline-block" />
                    SDLT at current standard residential rates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-brand-primary inline-block" />
                    Opportunity cost of deposit included
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-brand-primary inline-block" />
                    Annual maintenance at 1% of property value
                  </li>
                </ul>
              </div>

              {/* Regional Market Intelligence */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="size-4 text-brand-secondary" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-brand-secondary">
                    Regional Market Intelligence
                  </h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                  UK property historically grows at 3–4% annually, but regional variation
                  is significant and past performance does not predict future returns.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { region: "London", rate: "4.8%" },
                    { region: "South East", rate: "3.9%" },
                    { region: "North West", rate: "3.2%" },
                    { region: "Scotland", rate: "3.5%" },
                  ].map(({ region, rate }) => (
                    <div key={region} className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs text-neutral-500">{region}</p>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white font-heading">{rate}</p>
                      <p className="text-[10px] text-neutral-400">avg annual growth</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <Card className="p-0 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-xl font-bold font-heading mb-6">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-0 divide-y divide-neutral-100 dark:divide-neutral-800">
                  {FAQ_ITEMS.map((item, index) => (
                    <div key={index} className="py-4 first:pt-0 last:pb-0">
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="flex w-full items-center justify-between text-left gap-4"
                      >
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {item.question}
                        </span>
                        {openFaq === index ? (
                          <ChevronUp className="size-4 text-neutral-400 shrink-0" />
                        ) : (
                          <ChevronDown className="size-4 text-neutral-400 shrink-0" />
                        )}
                      </button>
                      {openFaq === index && (
                        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {item.answer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Sidebar ───────────────────────────────────────────────────── */}
          <aside className="w-full lg:w-72 xl:w-80 space-y-6">
            {/* Specialist Guidance */}
            <div className="bg-brand-primary-lighter dark:bg-brand-primary/10 rounded-xl p-6 border border-brand-primary/20">
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-5">
                Specialist Guidance
              </h3>
              <div className="space-y-3">
                <Link
                  href="/tools/mortgage-calculator"
                  className="group flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-lg border border-brand-primary/10 hover:border-brand-primary/30 transition-colors"
                >
                  <div className="size-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <Calculator className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-brand-primary transition-colors">
                      Financial Stress Testing
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate">
                      Mortgage affordability check
                    </p>
                  </div>
                  <ArrowRight className="size-3.5 text-neutral-400 shrink-0" />
                </Link>

                <Link
                  href="/tools/stamp-duty-calculator"
                  className="group flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-lg border border-brand-primary/10 hover:border-brand-primary/30 transition-colors"
                >
                  <div className="size-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <PiggyBank className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-brand-primary transition-colors">
                      Estate Value Tracker
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate">
                      Stamp duty & transaction costs
                    </p>
                  </div>
                  <ArrowRight className="size-3.5 text-neutral-400 shrink-0" />
                </Link>

                <Link
                  href="/tools/affordability-calculator"
                  className="group flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-lg border border-brand-primary/10 hover:border-brand-primary/30 transition-colors"
                >
                  <div className="size-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <Scale className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-brand-primary transition-colors">
                      Affordability Calculator
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate">
                      How much can you borrow?
                    </p>
                  </div>
                  <ArrowRight className="size-3.5 text-neutral-400 shrink-0" />
                </Link>
              </div>
            </div>

            {/* Mortgage quick stat */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Est. Monthly Mortgage
              </p>
              <p className="text-3xl font-bold font-heading text-neutral-900 dark:text-white">
                {formatCurrency(Math.round(results.monthlyMortgage))}
                <span className="text-sm text-neutral-400 font-normal">/mo</span>
              </p>
              <p className="text-xs text-neutral-400 mt-2 mb-5">
                {depositPercent}% deposit on {formatCurrency(propertyPrice)}
              </p>
              <Link
                href={`/tools/mortgage-calculator?price=${propertyPrice}`}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-primary hover:underline"
              >
                Explore mortgage rates <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Property Alerts */}
            <div className="bg-neutral-900 rounded-xl p-6 text-white overflow-hidden relative">
              <div className="relative z-10">
                <div className="bg-brand-primary/20 p-2 rounded-lg w-fit mb-4">
                  <Key className="size-5 text-brand-primary-light" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-heading">Property Alerts</h3>
                <p className="text-sm text-neutral-400 mb-5">
                  Be the first to see properties matching your comparison criteria.
                </p>
                <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                  <Input
                    type="email"
                    placeholder="Email address"
                    className="w-full bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 text-sm"
                  />
                  <Button className="w-full bg-brand-primary hover:bg-brand-primary-light text-white font-bold rounded-lg h-10">
                    Set Alert
                  </Button>
                </form>
                <p className="text-[10px] text-neutral-500 mt-3 text-center italic">
                  No spam. Unsubscribe any time.
                </p>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-primary/10 rounded-full blur-3xl" />
            </div>

            {/* Related Tools — compact */}
            <Card className="p-0 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">
                  Related Tools
                </h3>
                <div className="space-y-2">
                  {[
                    { href: `/tools/mortgage-calculator?price=${propertyPrice}`, label: "Mortgage Calculator", sub: "Monthly repayments", icon: Calculator },
                    { href: `/tools/stamp-duty-calculator?price=${propertyPrice}`, label: "Stamp Duty Calculator", sub: "SDLT costs", icon: PiggyBank },
                    { href: "/tools/affordability-calculator", label: "Affordability Calculator", sub: "Borrowing limits", icon: Home },
                  ].map(({ href, label, sub, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="size-8 rounded-lg bg-brand-primary-lighter flex items-center justify-center text-brand-primary shrink-0">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold group-hover:text-brand-primary transition-colors">
                          {label}
                        </p>
                        <p className="text-[10px] text-neutral-400">{sub}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <p className="text-xs text-neutral-400 text-center">
          Calculations are estimates and do not constitute financial advice. Always consult a qualified financial adviser.
        </p>
      </div>
    </>
  );
}
