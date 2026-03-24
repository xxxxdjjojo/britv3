import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { MortgageCalculator } from "@/components/calculators/MortgageCalculator";
import { MortgageRelatedTools } from "@/components/calculators/MortgageRelatedTools";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Mortgage Calculator | Britestate",
  description:
    "Calculate your monthly mortgage payments, total interest, and loan-to-value ratio. Save your parameters to see personalised estimates on property listings.",
};

export default function MortgageCalculatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex gap-2 text-xs text-neutral-500">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span>/</span>
        <Link href="/tools" className="hover:underline">
          Tools
        </Link>
        <span>/</span>
        <span className="text-brand-primary">Mortgage Calculator</span>
      </nav>

      {/* Hero */}
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-neutral-900 md:text-5xl dark:text-white">
          Mortgage Repayment Calculator
        </h1>
        <p className="max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          Estimate your monthly mortgage repayments based on property price,
          deposit, and interest rate. Save your parameters to see personalised
          figures on property listing cards.
        </p>
      </div>

      {/* Calculator + Sidebar Grid */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Calculator (spans 9 cols) */}
        <div className="lg:col-span-9">
          <MortgageCalculator />
        </div>

        {/* Sidebar (spans 3 cols) */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-3">
          {/* Broker CTA */}
          <Card className="overflow-hidden border-0 bg-neutral-900 text-white shadow-lg">
            <CardContent className="relative p-8">
              <h3 className="mb-3 text-xl font-bold">Speak to a Broker</h3>
              <p className="mb-6 text-sm leading-relaxed text-neutral-300">
                Ready to take the next step? Get free expert advice from our
                trusted partner brokers.
              </p>
              <Button className="w-full font-bold" asChild>
                <Link href="/marketplace?category=mortgage-broker">Connect Now</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Related Tools */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 font-bold text-neutral-900 dark:text-white">
                Other Tools
              </h3>
              <MortgageRelatedTools />
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* How is this calculated? */}
      <div className="mt-8 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-6">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-200">
              How is this calculated?
            </h3>
            <ChevronDown className="h-5 w-5 text-neutral-500 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-400">
            <p>
              This calculation is based on a standard repayment mortgage where
              you pay back both the interest and a portion of the original loan
              each month.
            </p>
            <p>
              The formula used is the standard amortisation formula:{" "}
              <strong>
                M = P [ i(1 + i)^n ] / [ (1 + i)^n &ndash; 1 ]
              </strong>
              , where M is the monthly payment, P is the principal loan amount, i
              is the monthly interest rate, and n is the number of months.
            </p>
          </div>
        </details>
      </div>

      {/* FAQ Section */}
      <section className="mt-20 border-t border-neutral-200 pt-12 dark:border-neutral-800">
        <h2 className="mb-8 text-2xl font-extrabold text-neutral-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-bold text-neutral-900 dark:text-neutral-200">
              How do interest rates affect my monthly payment?
            </h4>
            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Even a small 0.5% increase in interest rates can add hundreds of
              pounds to your monthly repayments over time. It&apos;s always best
              to lock in a fixed-rate mortgage if you want stability.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-bold text-neutral-900 dark:text-neutral-200">
              Should I choose a longer or shorter mortgage term?
            </h4>
            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              A longer term (e.g., 35-40 years) results in lower monthly
              payments but costs significantly more in total interest. Shorter
              terms (15-20 years) save you money in the long run but require
              higher monthly outgoings.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-bold text-neutral-900 dark:text-neutral-200">
              How much deposit do I really need?
            </h4>
            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              While many lenders accept 5%, having a 10% or 15% deposit often
              unlocks much better interest rate tiers, potentially saving you
              thousands over the lifetime of the loan.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-bold text-neutral-900 dark:text-neutral-200">
              What is the difference between fixed and variable rates?
            </h4>
            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Fixed rates stay the same for a set period (2-10 years), providing
              budget certainty. Variable rates can change based on the Bank of
              England&apos;s base rate.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
