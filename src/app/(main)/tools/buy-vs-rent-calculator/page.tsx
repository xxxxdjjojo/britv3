"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
      "This calculator assumes a repayment mortgage over 25 years, annual maintenance costs of 1% of property value, no stamp duty or legal fees (for simplicity), and that rent increases at the specified inflation rate. Investment returns on the deposit alternative are compounded annually.",
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

export default function BuyVsRentCalculatorPage() {
  const [propertyPrice, setPropertyPrice] = useState(450000);
  const [monthlyRent, setMonthlyRent] = useState(1850);
  const [growthRate, setGrowthRate] = useState(3.5);
  const [depositPercent, setDepositPercent] = useState(15);
  const [mortgageRate, setMortgageRate] = useState(4.2);
  const [rentInflation, setRentInflation] = useState(2.5);
  const [investmentReturn, setInvestmentReturn] = useState(5.0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

    const yearData: YearData[] = [];
    let breakEvenYear: number | null = null;

    for (let year = 1; year <= 25; year++) {
      const propertyValue = propertyPrice * Math.pow(1 + growthRate / 100, year);

      // Remaining mortgage balance after `year` years of payments
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
        deposit + totalMortgagePaid + maintenanceRate * propertyPrice * year - equity;

      // Rent with inflation
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
  const tableRows = results.yearData.filter((d) =>
    highlightYears.includes(d.year)
  );

  return (
    <>
      {/* Hero Section */}
      <header className="bg-white dark:bg-neutral-900 pt-12 pb-8 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <nav className="flex mb-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              <Link
                href="/tools"
                className="hover:text-brand-primary transition-colors"
              >
                Tools
              </Link>
              <span className="mx-2">/</span>
              <span className="text-neutral-900 dark:text-white">
                Buy vs Rent Calculator
              </span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4 font-heading">
              Buy vs. Rent
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Make a data-driven decision. Compare the long-term financial
              impact of buying a home versus renting in today&apos;s market.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1 space-y-8">
            {/* Inputs Section */}
            <Card className="p-0 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <SlidersHorizontal className="size-5 text-brand-primary" />
                  <h2 className="text-xl font-bold font-heading">
                    Your Parameters
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Property Price */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Property Price
                      </Label>
                      <span className="text-brand-primary font-bold">
                        {formatCurrency(propertyPrice)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={100000}
                      max={2000000}
                      step={10000}
                      value={propertyPrice}
                      onChange={(e) =>
                        setPropertyPrice(Number(e.target.value))
                      }
                      className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                        &pound;
                      </span>
                      <Input
                        type="number"
                        value={propertyPrice}
                        onChange={(e) =>
                          setPropertyPrice(Number(e.target.value))
                        }
                        className="pl-7 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                    </div>
                  </div>

                  {/* Monthly Rent */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Current Monthly Rent
                      </Label>
                      <span className="text-brand-primary font-bold">
                        {formatCurrency(monthlyRent)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={10000}
                      step={50}
                      value={monthlyRent}
                      onChange={(e) =>
                        setMonthlyRent(Number(e.target.value))
                      }
                      className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                        &pound;
                      </span>
                      <Input
                        type="number"
                        value={monthlyRent}
                        onChange={(e) =>
                          setMonthlyRent(Number(e.target.value))
                        }
                        className="pl-7 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                    </div>
                  </div>

                  {/* Annual Growth */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                        Annual Growth
                        <Info
                          className="size-3.5 text-neutral-400 cursor-help"
                          aria-label="Estimated annual property price appreciation"
                        />
                      </Label>
                      <span className="text-brand-primary font-bold">
                        {growthRate}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={0.1}
                      value={growthRate}
                      onChange={(e) =>
                        setGrowthRate(Number(e.target.value))
                      }
                      className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                    />
                    <div className="relative">
                      <Input
                        type="number"
                        value={growthRate}
                        onChange={(e) =>
                          setGrowthRate(Number(e.target.value))
                        }
                        className="pr-8 text-right bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {/* Deposit */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Deposit %
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={depositPercent}
                        onChange={(e) =>
                          setDepositPercent(Number(e.target.value))
                        }
                        className="pr-8 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Mortgage Rate */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Mortgage Rate
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={mortgageRate}
                        onChange={(e) =>
                          setMortgageRate(Number(e.target.value))
                        }
                        className="pr-8 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Rent Inflation */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Rent Inflation
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={rentInflation}
                        onChange={(e) =>
                          setRentInflation(Number(e.target.value))
                        }
                        className="pr-8 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Investment Return */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Investment Return
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={investmentReturn}
                        onChange={(e) =>
                          setInvestmentReturn(Number(e.target.value))
                        }
                        className="pr-8 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verdict Card */}
            <div className="bg-brand-primary text-white rounded-xl shadow-lg p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
              <div className="absolute -right-8 -bottom-8 opacity-10">
                <TrendingUp className="size-24" />
              </div>
              <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
                  Our Analysis
                </span>
                <h3 className="text-3xl md:text-4xl font-bold leading-tight font-heading">
                  {results.breakEvenYear ? (
                    <>
                      Buying becomes cheaper
                      <br />
                      after{" "}
                      <span className="text-brand-primary-lighter">
                        {results.breakEvenYear}{" "}
                        {results.breakEvenYear === 1 ? "year" : "years"}
                      </span>
                    </>
                  ) : (
                    <>
                      Renting remains cheaper
                      <br />
                      <span className="text-brand-primary-lighter">
                        over 25 years
                      </span>
                    </>
                  )}
                </h3>
                <p className="mt-3 text-brand-primary-lighter/80 max-w-sm">
                  {results.breakEvenYear
                    ? `Based on current market growth and interest rates, equity gain outpaces rent and costs at the ${results.breakEvenYear * 12}-month mark.`
                    : "With the current parameters, renting and investing your deposit produces better returns over the modelled period."}
                </p>
                <p className="mt-2 text-[10px] text-white/50">
                  Based on your assumptions. Actual outcomes depend on property growth, rate changes, and market conditions.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 relative z-10 w-full md:w-auto min-w-[240px]">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-sm font-medium text-brand-primary-lighter/80">
                    Est. Net Gain (10yr)
                  </span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(Math.abs(results.netGain10yr))}
                  </span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full mb-1">
                  <div
                    className="bg-brand-primary-lighter h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(5, results.netGain10yr > 0 ? 75 : 25))}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-brand-primary-lighter/60 uppercase tracking-wider">
                  {results.netGain10yr > 0
                    ? "Buying is favoured"
                    : "Renting is favoured"}
                </p>
              </div>
            </div>

            {/* Comparison Table */}
            <Card className="p-0 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div className="flex items-center gap-2">
                    <Scale className="size-5 text-brand-primary" />
                    <h2 className="text-xl font-bold font-heading">
                      Cost Comparison
                    </h2>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-brand-primary" />
                      <span className="font-medium text-neutral-600 dark:text-neutral-400">
                        Buying
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-neutral-400" />
                      <span className="font-medium text-neutral-600 dark:text-neutral-400">
                        Renting
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="text-left py-3 px-4 font-semibold text-neutral-500 uppercase tracking-wider text-xs">
                          Year
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-500 uppercase tracking-wider text-xs">
                          Buying Cost
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-500 uppercase tracking-wider text-xs">
                          Renting Cost
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-500 uppercase tracking-wider text-xs">
                          Difference
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-neutral-500 uppercase tracking-wider text-xs">
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
                            <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                              Year {row.year}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-brand-primary">
                              {formatCurrency(row.buyingCost)}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-neutral-600 dark:text-neutral-400">
                              {formatCurrency(row.rentingCost)}
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-bold ${buyingCheaper ? "text-success" : "text-error"}`}
                            >
                              {buyingCheaper ? "+" : ""}
                              {formatCurrency(diff)}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-neutral-600 dark:text-neutral-400">
                              {formatCurrency(row.propertyValue)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
                      Total Rent Paid (10yr)
                    </h4>
                    <p className="text-2xl font-bold font-heading">
                      {formatCurrency(
                        results.yearData.find((d) => d.year === 10)
                          ?.totalRentPaid ?? 0
                      )}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
                      Mortgage Payments (10yr)
                    </h4>
                    <p className="text-2xl font-bold font-heading">
                      {formatCurrency(
                        results.yearData.find((d) => d.year === 10)
                          ?.totalMortgagePaid ?? 0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                        onClick={() =>
                          setOpenFaq(openFaq === index ? null : index)
                        }
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

          {/* Sidebar */}
          <aside className="w-full lg:w-80 space-y-6">
            {/* Affordability Check */}
            <div className="bg-brand-primary-lighter dark:bg-brand-primary/10 rounded-xl p-6 border border-brand-primary/10">
              <h3 className="text-sm font-bold text-brand-primary uppercase tracking-widest mb-4">
                Affordability Check
              </h3>
              <div className="space-y-4">
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-brand-primary/10">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">
                    Estimated Monthly Payment
                  </span>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1 font-heading">
                    {formatCurrency(Math.round(results.monthlyMortgage))}
                    <span className="text-xs text-neutral-400 font-normal">
                      /mo
                    </span>
                  </p>
                </div>
                <Link
                  href="/tools/mortgage-calculator"
                  className="w-full text-sm font-bold text-brand-primary flex items-center justify-center gap-2 hover:translate-x-1 transition-transform"
                >
                  See Mortgage Rates{" "}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Related Tools */}
            <Card className="p-0 border-neutral-200 dark:border-neutral-800 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold font-heading mb-6">
                  Related Tools
                </h3>
                <div className="space-y-4">
                  <Link
                    href="/tools/mortgage-calculator"
                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="size-10 rounded-lg bg-brand-primary-lighter flex items-center justify-center text-brand-primary shrink-0">
                      <Calculator className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold group-hover:text-brand-primary transition-colors">
                        Mortgage Calculator
                      </h4>
                      <span className="text-xs text-neutral-500">
                        Calculate your monthly repayments
                      </span>
                    </div>
                  </Link>
                  <Link
                    href="/tools/stamp-duty-calculator"
                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="size-10 rounded-lg bg-brand-primary-lighter flex items-center justify-center text-brand-primary shrink-0">
                      <PiggyBank className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold group-hover:text-brand-primary transition-colors">
                        Stamp Duty Calculator
                      </h4>
                      <span className="text-xs text-neutral-500">
                        Estimate your stamp duty costs
                      </span>
                    </div>
                  </Link>
                  <Link
                    href="/tools/affordability-calculator"
                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="size-10 rounded-lg bg-brand-primary-lighter flex items-center justify-center text-brand-primary shrink-0">
                      <Home className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold group-hover:text-brand-primary transition-colors">
                        Affordability Calculator
                      </h4>
                      <span className="text-xs text-neutral-500">
                        How much can you borrow?
                      </span>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Property Alerts */}
            <div className="bg-neutral-900 rounded-xl p-6 text-white overflow-hidden relative">
              <div className="relative z-10">
                <div className="bg-brand-primary/20 p-2 rounded-lg w-fit mb-4">
                  <Key className="size-5 text-brand-primary-light" />
                </div>
                <h3 className="text-xl font-bold mb-2 font-heading">
                  Property Alerts
                </h3>
                <p className="text-sm text-neutral-400 mb-6">
                  Be the first to see properties matching your comparison
                  criteria in your favourite areas.
                </p>
                <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                  <Input
                    type="email"
                    placeholder="Email address"
                    className="w-full px-4 py-3 bg-neutral-800 border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500"
                  />
                  <Button className="w-full bg-brand-primary hover:bg-brand-primary-light text-white font-bold py-3 rounded-lg transition-colors shadow-lg h-auto">
                    Set Alert
                  </Button>
                </form>
                <p className="text-[10px] text-neutral-500 mt-4 text-center italic">
                  No spam, just tailored property matching.
                </p>
              </div>
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl" />
            </div>
          </aside>
        </div>
      </main>

      {/* Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <p className="text-xs text-neutral-400 text-center">
          Calculations are estimates and do not constitute financial advice.
          Always consult a qualified financial adviser.
        </p>
      </div>
    </>
  );
}
