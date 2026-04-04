import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, Info, ChevronRight } from "lucide-react";
import { InvestmentCalculator } from "@/components/calculators/InvestmentCalculator";

export const metadata: Metadata = {
  title: "Investment Calculator | Britestate",
  description:
    "Calculate buy-to-let returns including gross and net yield, cash-on-cash ROI, and projected capital growth. Free UK property investment calculator.",
};

const RELATED_TOOLS = [
  {
    href: "/tools/mortgage-calculator",
    label: "Mortgage Calculator",
    sublabel: "Estimate your monthly repayments",
  },
  {
    href: "/tools/rental-yield-calculator",
    label: "Rental Yield Calculator",
    sublabel: "Quick gross and net yield figures",
  },
  {
    href: "/tools/equity-calculator",
    label: "Equity Calculator",
    sublabel: "See how much equity you hold",
  },
  {
    href: "/tools/ltv-calculator",
    label: "LTV Calculator",
    sublabel: "Check your loan-to-value ratio",
  },
];

const FAQS = [
  {
    q: "What is a good rental yield for a UK property?",
    a: "Generally 5–8% gross yield is considered good for a UK buy-to-let property. Yields vary significantly by region — northern cities like Manchester and Liverpool often offer higher yields than London, where capital growth tends to compensate for lower income returns.",
  },
  {
    q: "Should I use interest-only for a buy-to-let mortgage?",
    a: "Interest-only mortgages are common for buy-to-let because they maximise monthly cash flow by keeping repayments lower. However, you won't build equity through repayments — you'll rely on capital growth and need a clear repayment strategy at the end of the term.",
  },
  {
    q: "What costs should I include in my investment analysis?",
    a: "A realistic analysis should include letting agent management fees (typically 10–15% of rent), landlord insurance, routine maintenance and repairs (budget 1% of property value per year), void periods between tenancies, mortgage interest, and any service charges or ground rent for leasehold properties.",
  },
  {
    q: "How does capital growth affect total returns?",
    a: "UK residential property has historically grown at around 3–5% annually on average, though this varies considerably by location and period. Capital growth can significantly boost your total return over the long term, even when monthly cash flow is modest.",
  },
  {
    q: "What is cash-on-cash return?",
    a: "Cash-on-cash return measures your annual net rental income as a percentage of the total cash you invested (typically your deposit plus purchase costs). Unlike gross yield, it accounts for financing costs, making it a more accurate measure of the return on your actual cash outlay.",
  },
];

export default function InvestmentCalculatorPage() {
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
              Investment Calculator
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
            Investment{" "}
            <em className="italic text-brand-primary font-heading not-italic">
              Calculator
            </em>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
            Analyse your buy-to-let investment with precision. Calculate gross
            and net yield, cash-on-cash ROI, and projected capital growth to
            make confident property investment decisions.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* ── Main Calculator Column ── */}
          <div className="lg:col-span-8">
            <InvestmentCalculator />
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Dark CTA card */}
            <div className="overflow-hidden rounded-xl bg-neutral-900 text-white shadow-lg dark:bg-neutral-950">
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-brand-primary to-neutral-900">
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    Buy-to-Let Finance
                  </p>
                  <p className="text-sm font-bold text-white">
                    Find a Buy-to-Let Mortgage
                  </p>
                </div>
              </div>
              <div className="p-6">
                <p className="mb-5 text-sm leading-relaxed text-neutral-400">
                  Get matched with specialist buy-to-let mortgage brokers who
                  understand investor needs. Compare rates and structures to
                  maximise your returns.
                </p>
                <Link
                  href="/marketplace?category=mortgage-brokers"
                  className="block w-full rounded-lg bg-brand-primary py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brand-primary-light"
                >
                  Find a Mortgage Broker
                </Link>
                <p className="mt-3 text-center text-[10px] text-neutral-500">
                  Free, no-obligation quotes
                </p>
              </div>
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
                    className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    <TrendingUp className="h-5 w-5 flex-shrink-0 text-brand-primary" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {tool.label}
                      </p>
                      <p className="text-xs text-neutral-500">{tool.sublabel}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 p-5 dark:border-neutral-700 dark:bg-neutral-900/30">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-300" />
                <p className="text-[11px] leading-relaxed text-neutral-400 italic">
                  This calculator is for illustrative purposes only. Returns are
                  not guaranteed and property values can fall as well as rise.
                  We recommend seeking professional advice from a qualified
                  financial adviser before making investment decisions.
                </p>
              </div>
            </div>

            {/* HMRC Compliant badge */}
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-700 dark:bg-neutral-800/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-900">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  HMRC Compliant
                </p>
                <p className="text-[11px] text-neutral-400">
                  Updated April 2025 rates
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* ── How it works + FAQ ── */}
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* How it works */}
          <div className="rounded-xl border border-neutral-100 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-4 font-heading text-base font-semibold text-neutral-900 dark:text-white">
              How investment returns are calculated
            </h3>
            <div className="space-y-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              <p>
                <strong className="text-neutral-700 dark:text-neutral-300">Gross yield</strong>{" "}
                is your annual rental income divided by the property purchase
                price, expressed as a percentage. It gives a quick top-line
                view before expenses.
              </p>
              <p>
                <strong className="text-neutral-700 dark:text-neutral-300">Net yield</strong>{" "}
                deducts ongoing costs — management fees, maintenance, insurance,
                and void periods — from gross income before dividing by purchase
                price.
              </p>
              <p>
                <strong className="text-neutral-700 dark:text-neutral-300">Cash-on-cash return</strong>{" "}
                measures net income as a percentage of your total cash invested
                (deposit plus costs), showing the true return on your outlay
                after mortgage financing.
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
      </main>
    </>
  );
}
