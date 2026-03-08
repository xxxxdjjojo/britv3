"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LONDON_AVERAGE_YIELD = 4.1;

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

export default function RentalYieldCalculatorPage() {
  const [purchasePrice, setPurchasePrice] = useState(300000);
  const [monthlyRent, setMonthlyRent] = useState(1560);
  const [maintenance, setMaintenance] = useState(1200);
  const [managementFeePercent, setManagementFeePercent] = useState(10);
  const [insurance, setInsurance] = useState(650);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const results = useMemo(() => {
    if (purchasePrice <= 0) {
      return {
        grossYield: 0,
        netYield: 0,
        annualProfit: 0,
        annualRent: 0,
        managementFees: 0,
        annualCosts: 0,
      };
    }

    const annualRent = monthlyRent * 12;
    const managementFees = (annualRent * managementFeePercent) / 100;
    const annualCosts = maintenance + insurance + managementFees;
    const grossYield = (annualRent / purchasePrice) * 100;
    const netYield = ((annualRent - annualCosts) / purchasePrice) * 100;
    const annualProfit = annualRent - annualCosts;

    return {
      grossYield,
      netYield,
      annualProfit,
      annualRent,
      managementFees,
      annualCosts,
    };
  }, [purchasePrice, monthlyRent, maintenance, managementFeePercent, insurance]);

  const yieldDifference = results.grossYield - LONDON_AVERAGE_YIELD;

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
      <header className="border-b border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <nav className="mb-4 flex text-xs font-medium uppercase tracking-wider text-neutral-500">
                <Link
                  href="/tools"
                  className="hover:text-brand-primary"
                >
                  Tools
                </Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-400">
                  Rental Yield Calculator
                </span>
              </nav>
              <h1 className="mb-2 font-heading text-3xl font-bold text-neutral-900 md:text-4xl dark:text-white">
                Rental Yield &amp; ROI Calculator
              </h1>
              <p className="max-w-2xl text-neutral-600 dark:text-neutral-400">
                Professional-grade tool for UK landlords to calculate Gross and
                Net investment returns. Analyze property profitability and
                compare against area averages.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Share2 className="size-4" /> Share
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Download className="size-4" /> Download PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Left Column: Inputs & Main Results (75%) */}
          <div className="space-y-8 lg:col-span-3">
            {/* Results Scorecards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Gross Yield */}
              <Card className="relative overflow-hidden border-neutral-200 shadow-sm dark:border-neutral-800">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      Gross Yield
                    </span>
                    <Info
                      className="size-4 cursor-help text-neutral-400"
                      title="Annual rent divided by purchase price"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-neutral-900 dark:text-white">
                      {formatPercent(results.grossYield)}%
                    </span>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="mr-1 size-3" />
                    {results.grossYield > LONDON_AVERAGE_YIELD
                      ? "Above market average"
                      : "Below market average"}
                  </div>
                </CardContent>
              </Card>

              {/* Net Yield (ROI) - Highlighted */}
              <div className="relative overflow-hidden rounded-xl bg-brand-primary p-6 shadow-lg">
                <div className="mb-4 flex items-start justify-between">
                  <span className="text-sm font-medium text-brand-primary-lighter">
                    Net Yield (ROI)
                  </span>
                  <Info
                    className="size-4 cursor-help text-brand-primary-lighter"
                    title="Annual profit after costs divided by purchase price"
                  />
                </div>
                <div className="flex items-baseline gap-2 text-white">
                  <span className="text-4xl font-bold">
                    {formatPercent(results.netYield)}%
                  </span>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-brand-primary-lighter">
                  <CheckCircle className="mr-1 size-3" />
                  {results.netYield > 0
                    ? "Sustainable profit margin"
                    : "Operating at a loss"}
                </div>
              </div>

              {/* Annual P/L */}
              <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      Annual Net P/L
                    </span>
                    <Info
                      className="size-4 cursor-help text-neutral-400"
                      title="Total annual rental income minus all expenses"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(results.annualProfit)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-medium text-neutral-500">
                    <Calendar className="mr-1 size-3" /> Breakdown below
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Input Groups */}
            <Card className="divide-y divide-neutral-100 border-neutral-200 shadow-sm dark:divide-neutral-800 dark:border-neutral-800">
              {/* Section 1: Property Details */}
              <div className="p-8">
                <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white">
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-primary-lighter text-sm font-bold text-brand-primary dark:bg-brand-primary/20">
                    1
                  </span>
                  Property Details
                </h3>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Purchase Price (&pound;)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                        &pound;
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatInputValue(purchasePrice)}
                        onChange={(e) =>
                          setPurchasePrice(parseNumericInput(e.target.value))
                        }
                        className="h-12 rounded-lg border-neutral-200 bg-neutral-50 pl-8 pr-4 font-medium text-neutral-900 focus-visible:border-brand-primary focus-visible:ring-brand-primary/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Monthly Rent (&pound;)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-neutral-400">
                        &pound;
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatInputValue(monthlyRent)}
                        onChange={(e) =>
                          setMonthlyRent(parseNumericInput(e.target.value))
                        }
                        className="h-12 rounded-lg border-neutral-200 bg-neutral-50 pl-8 pr-4 font-medium text-neutral-900 focus-visible:border-brand-primary focus-visible:ring-brand-primary/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Operating Costs */}
              <div className="p-8">
                <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white">
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-primary-lighter text-sm font-bold text-brand-primary dark:bg-brand-primary/20">
                    2
                  </span>
                  Annual Operating Costs
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Maintenance (&pound;)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                        &pound;
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatInputValue(maintenance)}
                        onChange={(e) =>
                          setMaintenance(parseNumericInput(e.target.value))
                        }
                        className="rounded-lg border-neutral-200 bg-white pl-8 pr-4 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                    <p className="text-[10px] italic text-neutral-400">
                      Estimated ~1% of value
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Management Fees (%)
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={
                          managementFeePercent === 0
                            ? ""
                            : String(managementFeePercent)
                        }
                        onChange={(e) =>
                          setManagementFeePercent(
                            parseNumericInput(e.target.value)
                          )
                        }
                        className="rounded-lg border-neutral-200 bg-white pl-4 pr-8 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                        %
                      </span>
                    </div>
                    <p className="text-[10px] italic text-neutral-400">
                      Letting agent monthly fee
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Insurance &amp; Others (&pound;)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                        &pound;
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatInputValue(insurance)}
                        onChange={(e) =>
                          setInsurance(parseNumericInput(e.target.value))
                        }
                        className="rounded-lg border-neutral-200 bg-white pl-8 pr-4 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                    <p className="text-[10px] italic text-neutral-400">
                      Building &amp; landlord cover
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Comparison & Detailed Breakdown */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Area Comparison */}
              <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
                <CardContent className="p-8">
                  <h4 className="mb-6 text-lg font-bold text-neutral-900 dark:text-white">
                    Area Average Comparison
                  </h4>
                  <div className="space-y-6">
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          Your Property
                        </span>
                        <span className="font-bold text-brand-primary">
                          {formatPercent(results.grossYield)}%
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-brand-primary"
                          style={{
                            width: `${Math.min(results.grossYield * 10, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          Regional Average (London)
                        </span>
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">
                          {formatPercent(LONDON_AVERAGE_YIELD)}%
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-neutral-400 dark:bg-neutral-600"
                          style={{
                            width: `${LONDON_AVERAGE_YIELD * 10}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-brand-primary-lighter bg-brand-primary-lighter/50 p-4 dark:border-brand-primary/30 dark:bg-brand-primary/10">
                      <p className="text-sm leading-relaxed text-brand-primary dark:text-brand-primary-light">
                        {yieldDifference > 0 ? (
                          <>
                            This property&apos;s yield is{" "}
                            <strong>
                              {formatPercent(yieldDifference)}% higher
                            </strong>{" "}
                            than the local postcode average. This indicates high
                            investment potential.
                          </>
                        ) : (
                          <>
                            This property&apos;s yield is{" "}
                            <strong>
                              {formatPercent(Math.abs(yieldDifference))}% lower
                            </strong>{" "}
                            than the local postcode average. Consider reviewing
                            your rental pricing.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Annual Profit Breakdown */}
              <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
                <CardContent className="p-8">
                  <h4 className="mb-6 text-lg font-bold text-neutral-900 dark:text-white">
                    Annual P/L Breakdown
                  </h4>
                  <ul className="space-y-4">
                    <li className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Gross Rental Income
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(results.annualRent)}
                      </span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Management Fees ({managementFeePercent}%)
                      </span>
                      <span className="font-semibold text-red-500">
                        - {formatCurrency(results.managementFees)}
                      </span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Maintenance &amp; Service
                      </span>
                      <span className="font-semibold text-red-500">
                        - {formatCurrency(maintenance)}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-neutral-100 pb-4 text-sm dark:border-neutral-800">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Insurance &amp; Misc
                      </span>
                      <span className="font-semibold text-red-500">
                        - {formatCurrency(insurance)}
                      </span>
                    </li>
                    <li className="flex justify-between pt-2 text-lg">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        Net Annual Profit
                      </span>
                      <span
                        className={`font-bold ${results.annualProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}
                      >
                        {formatCurrency(results.annualProfit)}
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <div className="mt-4">
              <h3 className="mb-6 text-xl font-bold text-neutral-900 dark:text-white">
                Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <Card
                    key={index}
                    className="border-neutral-200 dark:border-neutral-800"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between p-5 text-left"
                      onClick={() =>
                        setExpandedFaq(expandedFaq === index ? null : index)
                      }
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
                  </Card>
                ))}
              </div>
            </div>

            {/* Related Tools */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Link href="/tools/mortgage-calculator">
                <Button variant="outline" size="lg" className="gap-2">
                  Mortgage Calculator <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/tools/stamp-duty-calculator">
                <Button variant="outline" size="lg" className="gap-2">
                  Stamp Duty Calculator <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Sidebar Widgets (25%) */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* CTA: Letting Agent */}
            <Card className="overflow-hidden border-neutral-200 shadow-sm dark:border-neutral-800">
              <div className="relative h-40 bg-neutral-200 dark:bg-neutral-800">
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
                  <span className="text-lg font-bold text-white">
                    Find a Letting Agent
                  </span>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="mb-6 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Reduce your management fees and find verified tenants faster.
                  Compare top-rated agents in your area.
                </p>
                <Button className="w-full gap-2 py-3 font-bold">
                  Browse Agents <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>

            {/* CTA: Insurance */}
            <div className="relative overflow-hidden rounded-xl bg-neutral-900 p-8 text-white dark:bg-neutral-800">
              <div className="relative z-10">
                <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-white/10">
                  <ShieldCheck className="size-5 text-white" />
                </div>
                <h4 className="mb-3 text-xl font-bold">Landlord Insurance</h4>
                <p className="mb-6 text-sm leading-relaxed text-neutral-400">
                  Protect your investment with comprehensive building and rent
                  guarantee insurance from &pound;15/mo.
                </p>
                <Button
                  variant="secondary"
                  className="w-full bg-white py-3 font-bold text-neutral-900 hover:bg-neutral-100"
                >
                  Get Instant Quote
                </Button>
              </div>
              <div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-brand-primary/20 blur-3xl" />
            </div>

            {/* Feedback */}
            <div className="p-4 text-center">
              <p className="text-xs text-neutral-400">
                Found this tool useful?{" "}
                <Link
                  href="#"
                  className="text-brand-primary hover:underline"
                >
                  Leave feedback
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
