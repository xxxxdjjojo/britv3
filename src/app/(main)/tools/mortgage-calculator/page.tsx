import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { MortgageCalculator } from "@/components/calculators/MortgageCalculator";
import { MortgageRelatedTools } from "@/components/calculators/MortgageRelatedTools";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Mortgage Calculator | Britestate",
  description:
    "Calculate your monthly mortgage payments, total interest, and loan-to-value ratio. Save your parameters to see personalised estimates on property listings.",
};

export default function MortgageCalculatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex gap-2 text-xs text-neutral-400">
        <Link href="/" className="hover:text-brand-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-brand-primary transition-colors">
          Tools
        </Link>
        <span>/</span>
        <span className="text-brand-primary font-medium">Mortgage Calculator</span>
      </nav>

      {/* Page heading */}
      <div className="mb-10">
        <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
          Mortgage Calculator
        </h1>
        <p className="max-w-xl text-sm text-neutral-500 dark:text-neutral-400">
          Plan your sanctuary. Refine your investment with precision and editorial clarity.
        </p>
      </div>

      {/* Calculator + Sidebar */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Calculator (9 cols) */}
        <div className="lg:col-span-9">
          <MortgageCalculator />
        </div>

        {/* Sidebar (3 cols) */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:col-span-3">
          {/* Related Tools */}
          <Card className="rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
            <CardContent className="p-5">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-400">
                Other Tools
              </h3>
              <MortgageRelatedTools />
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* How is this calculated? */}
      <div className="mt-8 rounded-2xl border border-brand-primary/20 bg-brand-primary-lighter/50 p-6 dark:bg-brand-primary/5">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-200">
              How is this calculated?
            </h3>
            <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
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
      <section className="mt-16 border-t border-neutral-200 pt-10 dark:border-neutral-800">
        <h2 className="mb-6 font-heading text-2xl font-bold text-neutral-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-200">
              How do interest rates affect my monthly payment?
            </h4>
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              Even a small 0.5% increase in interest rates can add hundreds of
              pounds to your monthly repayments over time. It&apos;s always best
              to lock in a fixed-rate mortgage if you want stability.
            </p>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-200">
              Should I choose a longer or shorter mortgage term?
            </h4>
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              A longer term (e.g., 35–40 years) results in lower monthly
              payments but costs significantly more in total interest. Shorter
              terms (15–20 years) save you money in the long run but require
              higher monthly outgoings.
            </p>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-200">
              How much deposit do I really need?
            </h4>
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              While many lenders accept 5%, having a 10% or 15% deposit often
              unlocks much better interest rate tiers, potentially saving you
              thousands over the lifetime of the loan.
            </p>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-200">
              What is the difference between fixed and variable rates?
            </h4>
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              Fixed rates stay the same for a set period (2–10 years), providing
              budget certainty. Variable rates can change based on the Bank of
              England&apos;s base rate.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
