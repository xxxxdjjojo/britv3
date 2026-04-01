import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Info, CheckCircle2, ShieldCheck } from "lucide-react";
import { OverpaymentCalculator } from "@/components/calculators/OverpaymentCalculator";

export const metadata: Metadata = {
  title: "Overpayment Calculator | Britestate",
  description:
    "See how much you could save by overpaying your mortgage. Calculate interest savings, term reduction, and find your mortgage-free date.",
};

const RELATED_TOOLS = [
  {
    href: "/tools/mortgage-calculator",
    label: "Mortgage Calculator",
    sublabel: "Estimate your monthly repayments",
  },
  {
    href: "/tools/remortgage-calculator",
    label: "Remortgage Calculator",
    sublabel: "Could you get a better deal?",
  },
  {
    href: "/tools/ltv-calculator",
    label: "LTV Calculator",
    sublabel: "Check your loan-to-value ratio",
  },
  {
    href: "/tools/equity-calculator",
    label: "Equity Calculator",
    sublabel: "Track your home equity growth",
  },
];

const BENEFITS = [
  "Save thousands in total interest",
  "Pay off your mortgage years early",
  "Build equity faster",
  "Reduce your total cost of borrowing",
];

const FAQS = [
  {
    q: "How much can I overpay without penalty?",
    a: "Most UK lenders allow you to overpay up to 10% of your outstanding mortgage balance each year without incurring Early Repayment Charges. Check your specific mortgage terms, as some deals may have different limits.",
  },
  {
    q: "Should I overpay or save?",
    a: "If your mortgage interest rate is higher than the return you would earn on savings (after tax), overpaying your mortgage is generally the better option. However, always keep an emergency fund of 3-6 months' expenses before making overpayments.",
  },
  {
    q: "Does overpaying reduce my term or payment?",
    a: "Most UK lenders default to keeping your monthly payment the same and reducing the mortgage term. Some lenders allow you to choose. Reducing the term typically saves more in total interest.",
  },
  {
    q: "What are Early Repayment Charges?",
    a: "ERCs are fees charged by lenders if you repay more than your annual overpayment allowance. They typically range from 1-5% of the overpaid amount and are most common during fixed-rate periods.",
  },
  {
    q: "Is it better to make regular or lump sum overpayments?",
    a: "Regular monthly overpayments are often more effective because they reduce your balance sooner, meaning less interest accrues each month. However, any overpayment — regular or lump sum — will save you money.",
  },
];

export default function OverpaymentCalculatorPage() {
  return (
    <>
      {/* Breadcrumbs */}
      <div className="border-b border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Link href="/tools" className="hover:text-brand-primary transition-colors">
              Tools
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              Overpayment Calculator
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <header className="border-b border-neutral-100 bg-white py-14 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Financial Planning as Estate
          </p>
          <h1 className="font-heading text-5xl font-bold leading-tight text-neutral-900 dark:text-white">
            Overpayment{" "}
            <em className="italic text-brand-primary font-heading not-italic">
              Calculator
            </em>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
            Model the impact of mortgage overpayments. See how much interest
            you could save, how many years you could shave off your term, and
            find your mortgage-free date.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main Calculator Column */}
          <div className="space-y-10 lg:col-span-8">
            <OverpaymentCalculator />

            {/* How overpayments work + FAQ */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="rounded-xl border border-neutral-100 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="mb-4 font-heading text-base font-semibold text-neutral-900 dark:text-white">
                  How overpayments work
                </h3>
                <div className="space-y-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  <p>
                    When you overpay your mortgage, the extra money goes directly
                    towards reducing your outstanding balance. This means less
                    interest is charged each month, creating a compounding
                    saving effect.
                  </p>
                  <p>
                    Even small regular overpayments can have a dramatic impact
                    over time. For example, overpaying just £200/month on a
                    typical £240,000 mortgage could save over £20,000 in
                    interest and clear the mortgage 5 years early.
                  </p>
                  <p>
                    Most UK lenders allow you to overpay up to 10% of your
                    outstanding balance each year without Early Repayment
                    Charges (ERCs). Our calculator factors in this annual cap.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-heading text-base font-semibold text-neutral-900 dark:text-white">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-2">
                  {FAQS.map((faq) => (
                    <details
                      key={faq.q}
                      className="group rounded-lg border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-neutral-800 marker:content-none dark:text-neutral-200">
                        {faq.q}
                        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400 transition-transform group-open:rotate-90" />
                      </summary>
                      <p className="px-4 pb-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {faq.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Compare Rates CTA */}
            <div className="overflow-hidden rounded-xl bg-neutral-900 text-white shadow-lg dark:bg-neutral-950">
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-stone-700 to-stone-900">
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    Mortgage Rates
                  </p>
                  <p className="text-sm font-bold text-white">
                    Compare Today&apos;s Best Deals
                  </p>
                </div>
              </div>
              <div className="p-6">
                <p className="mb-5 text-sm leading-relaxed text-neutral-400">
                  Before overpaying, check you&apos;re on the best rate. Switching
                  your mortgage could save you even more than overpayments alone.
                </p>
                <Link
                  href="/tools/mortgage-comparison"
                  className="block w-full rounded-lg bg-brand-primary py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brand-primary-light"
                >
                  Compare Mortgage Rates
                </Link>
                <p className="mt-3 text-center text-[10px] text-neutral-500">
                  Free comparison tool
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                Benefits of Overpaying
              </h3>
              <ul className="space-y-3">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-primary" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Related Tools */}
            <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                Related Tools
              </h3>
              <div className="space-y-2">
                {RELATED_TOOLS.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-800 group-hover:text-brand-primary dark:text-neutral-200">
                        {tool.label}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {tool.sublabel}
                      </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-300" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 p-5 dark:border-neutral-700 dark:bg-neutral-900/30">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-300" />
                <p className="text-[11px] leading-relaxed text-neutral-400 italic">
                  This calculator is for illustrative purposes only. It does
                  not account for fixed-rate end dates, ERC costs, or changes
                  in interest rates. Always confirm overpayment limits with
                  your lender before making additional payments.
                </p>
              </div>
            </div>

            {/* Regulated badge */}
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-700 dark:bg-neutral-800/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-900">
                <ShieldCheck className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Standard Amortisation
                </p>
                <p className="text-[11px] text-neutral-400">
                  Uses industry-standard formulas
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
