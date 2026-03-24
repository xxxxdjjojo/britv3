import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Info, Calculator, PiggyBank } from "lucide-react";
import { SdltCalculator } from "@/components/calculators/SdltCalculator";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Stamp Duty Calculator | Britestate",
  description:
    "Calculate Stamp Duty (SDLT), Scottish LBTT, or Welsh LTT for residential property purchases across the UK. Supports first-time buyer relief and additional property surcharge.",
};

export default function StampDutyCalculatorPage() {
  return (
    <>
      {/* Breadcrumbs */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/tools" className="hover:text-brand-primary transition-colors">
              Tools
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-neutral-900 dark:text-white">
              Stamp Duty Calculator
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <header className="border-b border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 font-heading text-4xl font-bold text-neutral-900 dark:text-white">
            Stamp Duty Calculator
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
            Calculate SDLT (England &amp; NI), LBTT (Scotland), or LTT (Wales)
            for your next residential property purchase.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-8">
            <SdltCalculator />

            {/* What is Stamp Duty */}
            <article className="prose prose-neutral max-w-none dark:prose-invert">
              <h3 className="mb-4 text-xl font-bold">What is Stamp Duty?</h3>
              <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
                Stamp Duty Land Tax (SDLT) is a tax you must pay when you buy a
                property or land over a certain price in England and Northern
                Ireland. The amount you pay depends on whether the land or
                property is residential or non-residential, and whether you are a
                first-time buyer or buying an additional home.
              </p>
            </article>

            {/* How is SDLT Calculated */}
            <details className="group rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <summary className="cursor-pointer px-6 py-4 font-heading text-lg font-bold text-neutral-900 dark:text-white">
                How is SDLT calculated?
              </summary>
              <div className="space-y-3 px-6 pb-6 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                <p>
                  SDLT is calculated using a tiered system, similar to income tax.
                  You only pay the higher rate on the portion of the property price
                  that falls within each band, not on the entire purchase price.
                </p>
                <p>
                  For example, if you buy a home for £300,000 as a standard buyer,
                  you pay 0% on the first £250,000 and 5% on the remaining £50,000,
                  giving a total SDLT of £2,500.
                </p>
                <p>
                  First-time buyers benefit from a higher nil-rate threshold, meaning
                  they pay no SDLT on the first £300,000 (for properties up to
                  £500,000). Additional property buyers pay a 5% surcharge on top of
                  standard rates.
                </p>
              </div>
            </details>

            {/* FAQ Section */}
            <section className="space-y-4">
              <h3 className="font-heading text-xl font-bold text-neutral-900 dark:text-white">
                Frequently Asked Questions
              </h3>
              {[
                {
                  q: "When do I need to pay stamp duty?",
                  a: "You must submit an SDLT return and pay any tax due within 14 days of completing your property purchase. Late filing may result in penalties and interest charges.",
                },
                {
                  q: "Do first-time buyers pay stamp duty?",
                  a: "First-time buyers pay no SDLT on properties up to £300,000, and a reduced rate of 5% on the portion between £300,001 and £500,000. If the property costs more than £500,000, standard rates apply.",
                },
                {
                  q: "What is the additional property surcharge?",
                  a: "If you already own a residential property and are buying another (e.g. a buy-to-let or second home), you pay an extra 5% surcharge on top of standard SDLT rates on each band.",
                },
                {
                  q: "Does stamp duty apply in Scotland and Wales?",
                  a: "Scotland uses Land and Buildings Transaction Tax (LBTT) and Wales uses Land Transaction Tax (LTT). Use the country selector above to calculate LBTT or LTT alongside SDLT.",
                },
                {
                  q: "Can I add stamp duty to my mortgage?",
                  a: "Some lenders may allow you to add SDLT to your mortgage, but this means you'll pay interest on it over the full mortgage term. It's generally better to pay it upfront if possible.",
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
            {/* Solicitor CTA */}
            <div className="rounded-xl bg-brand-primary p-6 text-white shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-white/20 p-2">
                  <Calculator className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Ready to Move?</h3>
              </div>
              <p className="mb-6 text-sm text-blue-100">
                Get a competitive conveyancing quote from our panel of trusted
                solicitors in minutes.
              </p>
              <Link
                href="/marketplace?category=conveyancing"
                className="block w-full rounded-lg bg-white py-3 text-center font-bold text-brand-primary transition-colors hover:bg-neutral-50"
              >
                Find a Solicitor
              </Link>
              <p className="mt-4 text-center text-[10px] text-blue-200">
                Free, no-obligation quote
              </p>
            </div>

            {/* Related Tools */}
            <Card>
              <CardContent className="space-y-3 p-5">
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  Related Tools
                </h3>
                <Link
                  href="/tools/mortgage-calculator"
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <PiggyBank className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">Mortgage Calculator</p>
                    <p className="text-xs text-neutral-500">
                      Estimate your monthly repayments
                    </p>
                  </div>
                </Link>
                <Link
                  href="/tools/affordability-calculator"
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <Calculator className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      Affordability Calculator
                    </p>
                    <p className="text-xs text-neutral-500">
                      See how much you can borrow
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 p-5 dark:border-neutral-700 dark:bg-neutral-900/30">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <p className="text-[11px] leading-relaxed text-neutral-500 italic dark:text-neutral-400">
                  Disclaimer: This calculator is for illustrative purposes only.
                  Tax laws are subject to change. We recommend seeking professional
                  advice from a qualified solicitor or tax advisor before making
                  financial decisions.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
