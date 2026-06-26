"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  PiggyBank,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalculatorPageHeader } from "@/components/calculators/CalculatorPageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateMonthlyPayment } from "@/lib/calculators/mortgage";

// ---------------------------------------------------------------------------
// Metadata (exported from a separate layout or head if needed — title set via document)
// ---------------------------------------------------------------------------

// Note: metadata must be exported from a Server Component; for a "use client"
// page we set the <title> via the parent layout or a head.tsx file.
// The tools index already links here with the correct title.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const gbpExact = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);

const gbp = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);

// ---------------------------------------------------------------------------
// Illustrative mortgage products
// ---------------------------------------------------------------------------

type MortgageProduct = {
  lender: string;
  product: string;
  ltv: string;
  rate: number;
  aprc: number;
  type: string;
};

const MORTGAGE_PRODUCTS: MortgageProduct[] = [
  { lender: "Barclays", product: "2-Year Fixed", ltv: "60%", rate: 4.15, aprc: 6.9, type: "Fixed" },
  { lender: "Barclays", product: "5-Year Fixed", ltv: "60%", rate: 4.05, aprc: 6.5, type: "Fixed" },
  { lender: "HSBC", product: "2-Year Fixed", ltv: "75%", rate: 4.45, aprc: 7.1, type: "Fixed" },
  { lender: "HSBC", product: "5-Year Fixed", ltv: "75%", rate: 4.35, aprc: 6.8, type: "Fixed" },
  { lender: "NatWest", product: "2-Year Fixed", ltv: "85%", rate: 4.89, aprc: 7.4, type: "Fixed" },
  { lender: "NatWest", product: "5-Year Fixed", ltv: "85%", rate: 4.79, aprc: 7.1, type: "Fixed" },
  { lender: "Halifax", product: "2-Year Fixed", ltv: "90%", rate: 5.24, aprc: 7.8, type: "Fixed" },
  { lender: "Halifax", product: "5-Year Fixed", ltv: "90%", rate: 5.19, aprc: 7.5, type: "Fixed" },
  { lender: "Santander", product: "Tracker", ltv: "75%", rate: 4.74, aprc: 6.9, type: "Tracker" },
  { lender: "Nationwide", product: "2-Year Fixed", ltv: "60%", rate: 4.19, aprc: 6.9, type: "Fixed" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MortgageComparisonPage() {
  const [propertyPrice, setPropertyPrice] = useState(350000);
  const [deposit, setDeposit] = useState(50000);
  const [term, setTerm] = useState(25);

  const loanAmount = Math.max(0, propertyPrice - deposit);

  const handleNumberInput =
    (setter: (v: number) => void, min = 0) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value);
      if (!isNaN(parsed) && parsed >= min) setter(parsed);
      else if (e.target.value === "" || e.target.value === "-") setter(0);
    };

  const productsWithPayments = MORTGAGE_PRODUCTS.map((p) => ({
    ...p,
    monthlyPayment: calculateMonthlyPayment(loanAmount, p.rate, term),
  })).sort((a, b) => a.monthlyPayment - b.monthlyPayment);

  const cheapestPayment = productsWithPayments[0]?.monthlyPayment ?? 0;

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <CalculatorPageHeader
          title="Mortgage Comparison"
          description="Compare illustrative mortgage products side by side. Enter your property price and deposit to see estimated monthly payments across major UK lenders."
        />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main content */}
          <div className="space-y-8 lg:col-span-8">
            {/* Disclaimer */}
            <Alert className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Important:</strong> These rates are indicative only and
                not financial advice. Rates change daily — always get a
                personalised quote from a broker.
              </AlertDescription>
            </Alert>

            {/* Inputs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Details</CardTitle>
                <CardDescription>
                  Adjust the values below to compare monthly payments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="property-price">Property Price</Label>
                    <Input
                      id="property-price"
                      type="number"
                      min={0}
                      step={5000}
                      value={propertyPrice}
                      onChange={handleNumberInput(setPropertyPrice)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Deposit</Label>
                    <Input
                      id="deposit"
                      type="number"
                      min={0}
                      step={5000}
                      value={deposit}
                      onChange={handleNumberInput(setDeposit)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="term">Term (years)</Label>
                    <Input
                      id="term"
                      type="number"
                      min={1}
                      max={40}
                      step={1}
                      value={term}
                      onChange={handleNumberInput(setTerm, 1)}
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs text-neutral-500">
                  Loan amount: <strong>{gbp(loanAmount)}</strong> &middot; LTV:{" "}
                  <strong>
                    {propertyPrice > 0
                      ? ((loanAmount / propertyPrice) * 100).toFixed(0)
                      : 0}
                    %
                  </strong>
                </p>
              </CardContent>
            </Card>

            {/* Rates table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Illustrative Mortgage Products
                </CardTitle>
                <CardDescription>
                  Showing {productsWithPayments.length} products sorted by
                  monthly payment (lowest first).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lender</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>LTV</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">
                          Initial Rate
                        </TableHead>
                        <TableHead className="text-right">
                          Monthly Payment
                        </TableHead>
                        <TableHead className="text-right">APRC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsWithPayments.map((p) => {
                        const isCheapest =
                          p.monthlyPayment === cheapestPayment;
                        return (
                          <TableRow
                            key={`${p.lender}-${p.product}`}
                            className={
                              isCheapest
                                ? "bg-success/10 hover:bg-success/20"
                                : undefined
                            }
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {p.lender}
                                {isCheapest && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-success/10 text-xs text-success"
                                  >
                                    Lowest
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{p.product}</TableCell>
                            <TableCell>{p.ltv}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  p.type === "Tracker"
                                    ? "outline"
                                    : "secondary"
                                }
                              >
                                {p.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {p.rate.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold">
                              {gbpExact(p.monthlyPayment)}/mo
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {p.aprc.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              Monthly payments calculated using standard amortisation. APRC
              figures are illustrative. Not regulated financial advice. Always
              consult an FCA-authorised mortgage broker.
            </p>

            {/* FAQ */}
            <section className="space-y-4">
              <h3 className="font-heading text-xl font-bold text-neutral-900 dark:text-white">
                Frequently Asked Questions
              </h3>
              {[
                {
                  q: "What does LTV mean?",
                  a: "Loan-to-Value (LTV) is the ratio of your mortgage to the property value. A lower LTV (e.g. 60%) typically means better interest rates because you are borrowing less relative to the property price.",
                },
                {
                  q: "What is the difference between rate and APRC?",
                  a: "The initial rate is what you pay during the introductory period (e.g. 2 or 5 years). APRC (Annual Percentage Rate of Charge) reflects the total cost over the full mortgage term, including fees and the lender's revert rate.",
                },
                {
                  q: "Should I choose a 2-year or 5-year fixed rate?",
                  a: "A 2-year fix gives you flexibility to remortgage sooner but carries more uncertainty. A 5-year fix offers longer payment stability. The best choice depends on your plans and risk tolerance.",
                },
              ].map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-neutral-900 dark:text-white">
                    {faq.q}
                  </summary>
                  <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {faq.a}
                  </p>
                </details>
              ))}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Broker CTA */}
            <div className="rounded-xl bg-brand-primary p-6 text-white shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-white/20 p-2">
                  <Calculator className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Speak to a Broker</h3>
              </div>
              <p className="mb-6 text-sm text-brand-primary-lighter">
                Get a personalised mortgage quote from an FCA-regulated broker
                in minutes.
              </p>
              <Link
                href="/marketplace?category=mortgage-broker"
                className="block w-full rounded-lg bg-white py-3 text-center font-bold text-brand-primary transition-colors hover:bg-muted"
              >
                Find a Broker
              </Link>
              <p className="mt-4 text-center text-[10px] text-brand-primary-lighter">
                Free, no-obligation quote
              </p>
            </div>

            {/* Related tools */}
            <Card>
              <CardContent className="space-y-3 p-5">
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  Related Tools
                </h3>
                <Link
                  href="/tools/mortgage-calculator"
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-muted dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <PiggyBank className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">Mortgage Calculator</p>
                    <p className="text-xs text-neutral-500">
                      Estimate monthly repayments
                    </p>
                  </div>
                </Link>
                <Link
                  href="/tools/remortgage-calculator"
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-muted dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <Calculator className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      Remortgage Calculator
                    </p>
                    <p className="text-xs text-neutral-500">
                      See if switching saves you money
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="rounded-xl border border-dashed border-neutral-300 bg-muted/50 p-5 dark:border-neutral-700 dark:bg-neutral-900/30">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <p className="text-[11px] italic leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Disclaimer: This tool is for illustrative purposes only. Rates
                  and products shown are not live offers. Always seek advice from
                  a qualified, FCA-regulated mortgage broker.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
