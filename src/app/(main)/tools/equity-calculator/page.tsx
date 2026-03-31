import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Info, TrendingUp } from "lucide-react";
import { EquityCalculator } from "@/components/calculators/EquityCalculator";

export const metadata: Metadata = {
  title: "Home Equity Calculator | Britestate",
  description:
    "Calculate your home equity and project your property wealth over the next decade. Understand your equity ratio, LTV tier, and projected growth.",
};

const RELATED_TOOLS = [
  { href: "/tools/mortgage-calculator", label: "Mortgage Calculator" },
  { href: "/tools/remortgage-calculator", label: "Remortgage Calculator" },
  { href: "/tools/affordability-calculator", label: "Affordability Calculator" },
  { href: "/tools/stamp-duty-calculator", label: "Stamp Duty Calculator" },
];

export default function EquityCalculatorPage() {
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
              Home Equity Calculator
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <header className="border-b border-neutral-100 bg-white py-14 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            Wealth Planning as Estate
          </p>
          <h1 className="font-heading text-5xl font-bold leading-tight text-neutral-900 dark:text-white">
            Home Equity{" "}
            <em className="italic text-brand-primary font-heading not-italic">
              Calculator
            </em>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
            Calculate your property&apos;s net value and project your wealth
            over the next decade. Make informed remortgage decisions with
            clarity.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main Calculator Column */}
          <div className="space-y-10 lg:col-span-8">
            <EquityCalculator />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Equity Broker CTA */}
            <div className="overflow-hidden rounded-2xl bg-neutral-900 text-white shadow-lg dark:bg-neutral-950">
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-brand-primary to-brand-primary-dark">
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    Equity Release
                  </p>
                  <p className="text-sm font-bold text-white">
                    Unlock Your Property Wealth
                  </p>
                </div>
              </div>
              <div className="p-6">
                <p className="mb-5 text-sm leading-relaxed text-neutral-400">
                  Your equity is your most valuable asset. Connect with
                  specialist advisers to explore remortgage options, equity
                  release, and wealth planning strategies.
                </p>
                <Link
                  href="/marketplace?category=mortgage-brokers"
                  className="block w-full rounded-xl bg-brand-primary py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Find an Adviser
                </Link>
                <p className="mt-3 text-center text-[10px] text-neutral-500">
                  Free, no-obligation consultation
                </p>
              </div>
            </div>

            {/* Related Tools */}
            <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                Related Tools
              </h3>
              <ul className="space-y-3">
                {RELATED_TOOLS.map((tool) => (
                  <li key={tool.href}>
                    <Link
                      href={tool.href}
                      className="flex items-center gap-3 text-sm font-medium text-neutral-600 transition-colors hover:text-brand-primary dark:text-neutral-400 dark:hover:text-brand-primary"
                    >
                      <TrendingUp className="h-4 w-4 text-neutral-300" strokeWidth={1.5} />
                      {tool.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 p-5 dark:border-neutral-700 dark:bg-neutral-900/30">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-300" />
                <p className="text-[11px] leading-relaxed text-neutral-400 italic">
                  This calculator is for illustrative purposes only. Property
                  values and equity projections are not guaranteed. We recommend
                  seeking professional financial advice before making property
                  or mortgage decisions.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
