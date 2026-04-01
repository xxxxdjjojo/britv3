import type { Metadata } from "next";
import Link from "next/link";
import { Info, ChevronRight } from "lucide-react";
import { LtvCalculator } from "@/components/calculators/LtvCalculator";

export const metadata: Metadata = {
  title: "LTV Calculator | Britestate",
  description:
    "Calculate your Loan-to-Value ratio and see which mortgage rate tier you qualify for. Understand how LTV affects your borrowing costs.",
};

const LTV_TIERS = [
  { range: "≤60%", label: "Elite", description: "Best rates available" },
  { range: "61–70%", label: "Premier", description: "Excellent rates" },
  { range: "71–75%", label: "Standard", description: "Good rates" },
  { range: "76–80%", label: "Mid", description: "Moderate rates" },
  { range: "81–85%", label: "High", description: "Higher rates" },
  { range: "86–90%", label: "Upper", description: "Limited options" },
  { range: "91–95%", label: "Max", description: "Specialist products" },
];

const RELATED_TOOLS = [
  { href: "/tools/mortgage-calculator", label: "Mortgage Calculator" },
  { href: "/tools/overpayment-calculator", label: "Overpayment Calculator" },
  { href: "/tools/equity-calculator", label: "Equity Calculator" },
  { href: "/tools/remortgage-calculator", label: "Remortgage Calculator" },
];

const FAQS = [
  {
    q: "What is LTV and why does it matter?",
    a: "LTV (Loan-to-Value) is the ratio of your mortgage loan to the value of your property, expressed as a percentage. A lower LTV signals less risk to lenders, which typically unlocks better interest rates and broader product choice.",
  },
  {
    q: "What is a good LTV for a mortgage?",
    a: "60% LTV or below typically secures the best available mortgage rates. 75–80% LTV is considered typical for many buyers and still attracts competitive deals. Higher LTVs are possible but come with higher rates and fewer product options.",
  },
  {
    q: "Can my LTV change over time?",
    a: "Yes. As you repay your mortgage the outstanding balance falls, improving your LTV. Rising property values also reduce your LTV, while falling values can increase it. You can recalculate whenever you remortgage or review your deal.",
  },
  {
    q: "How does LTV affect my mortgage rate?",
    a: "Lenders price risk through LTV bands. Dropping from 85% to 80% LTV, for instance, can unlock a significantly lower rate tier — sometimes saving thousands of pounds over a two- or five-year fixed period.",
  },
  {
    q: "What if my LTV is above 90%?",
    a: "Products are more limited above 90% LTV. The Government's Mortgage Guarantee Scheme enables some lenders to offer 95% LTV mortgages. A larger deposit or a gifted deposit from family can help bring your LTV down to a more competitive band.",
  },
];

export default function LtvCalculatorPage() {
  return (
    <>
      {/* Breadcrumbs */}
      <div className="border-b border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Link
              href="/tools"
              className="hover:text-brand-primary transition-colors"
            >
              Tools
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              LTV Calculator
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
            LTV{" "}
            <em className="italic text-brand-primary font-heading not-italic">
              Calculator
            </em>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
            Understand your loan-to-value ratio and discover which mortgage rate
            tier you qualify for. See exactly how your deposit size and property
            value affect your borrowing costs.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* ── Main Calculator Column ── */}
          <div className="space-y-10 lg:col-span-8">
            <LtvCalculator />

            {/* How LTV Works + FAQ — 2 column layout */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* How LTV works */}
              <div className="rounded-xl border border-neutral-100 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="mb-4 font-heading text-base font-semibold text-neutral-900 dark:text-white">
                  How LTV works
                </h3>
                <div className="space-y-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  <p>
                    LTV is calculated by dividing your mortgage amount by the
                    property value and multiplying by 100. A £180,000 mortgage
                    on a £300,000 property gives an LTV of 60%.
                  </p>
                  <p>
                    Lenders group LTV into rate tiers — each tier has a distinct
                    set of products. Crossing a tier boundary (e.g. from 80% to
                    75%) can meaningfully reduce your interest rate.
                  </p>
                  <p>
                    Saving a slightly larger deposit to clear a tier boundary is
                    often one of the highest-return financial decisions a buyer
                    can make.
                  </p>
                </div>
              </div>

              {/* FAQ accordion */}
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
                      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-neutral-800 marker:content-none dark:text-neutral-200 flex items-center justify-between">
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

          {/* ── Sidebar ── */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Secure a Better Rate CTA */}
            <div className="overflow-hidden rounded-xl bg-neutral-900 text-white shadow-lg dark:bg-neutral-950">
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-stone-700 to-stone-900">
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    Mortgage Advice
                  </p>
                  <p className="text-sm font-bold text-white">
                    Secure a Better Rate
                  </p>
                </div>
              </div>
              <div className="p-6">
                <p className="mb-5 text-sm leading-relaxed text-neutral-400">
                  A lower LTV unlocks better rates — our vetted mortgage brokers
                  can help you find the right product for your situation, fast.
                  Free, no-obligation advice.
                </p>
                <Link
                  href="/marketplace?category=mortgage-brokers"
                  className="block w-full rounded-lg bg-brand-primary py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brand-primary-light"
                >
                  Find a Mortgage Broker
                </Link>
                <p className="mt-3 text-center text-[10px] text-neutral-500">
                  Free, no-obligation quote
                </p>
              </div>
            </div>

            {/* LTV Tier Reference */}
            <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                LTV Tier Reference
              </h3>
              <div className="space-y-2">
                {LTV_TIERS.map((tier) => (
                  <div
                    key={tier.range}
                    className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800"
                  >
                    <div>
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        {tier.range}
                      </span>
                      <span className="ml-2 text-[10px] text-neutral-400">
                        {tier.description}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
                      {tier.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Tools */}
            <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                Related Tools
              </h3>
              <ul className="space-y-1">
                {RELATED_TOOLS.map((tool) => (
                  <li key={tool.href}>
                    <Link
                      href={tool.href}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-brand-primary dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-neutral-300" />
                      {tool.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 p-5 dark:border-neutral-700 dark:bg-neutral-900/30">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-300" />
                <p className="text-[11px] leading-relaxed text-neutral-400 italic">
                  This calculator is for illustrative purposes only. Rates and
                  products change regularly. We recommend speaking with a
                  qualified mortgage adviser before making any financial
                  decisions.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
