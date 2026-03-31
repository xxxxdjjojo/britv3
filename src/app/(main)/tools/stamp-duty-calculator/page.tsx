import type { Metadata } from "next";
import Link from "next/link";
import { Scale, Info, ChevronRight } from "lucide-react";
import { SdltCalculator } from "@/components/calculators/SdltCalculator";
import { SdltRelatedTools } from "@/components/calculators/SdltRelatedTools";

export const metadata: Metadata = {
  title: "Stamp Duty Calculator | Britestate",
  description:
    "Calculate Stamp Duty (SDLT), Scottish LBTT, or Welsh LTT for residential property purchases across the UK. Supports first-time buyer relief and additional property surcharge.",
};

// Placeholder property image cards for the sidebar
const SIDEBAR_PROPERTIES = [
  {
    label: "The Fulton Estate — London W1",
    sublabel: "3-bed townhouse",
    gradient: "from-zinc-700 to-zinc-900",
  },
  {
    label: "Moorgate Residences — EC2",
    sublabel: "2-bed apartment",
    gradient: "from-stone-700 to-stone-900",
  },
];

const FAQS = [
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
];

export default function StampDutyCalculatorPage() {
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
              Stamp Duty Calculator
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
            Stamp Duty{" "}
            <em className="italic text-brand-primary font-heading not-italic">
              Calculator
            </em>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
            Calculate SDLT, LBTT, or LTT with precision. Our calculator
            accounts for all UK thresholds, ensuring your financial planning
            is always current and reliable.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* ── Main Calculator Column ── */}
          <div className="space-y-10 lg:col-span-8">
            <SdltCalculator />

            {/* How SDLT is Calculated + FAQ — 2 column layout */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* How SDLT is calculated */}
              <div className="rounded-xl border border-neutral-100 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="mb-4 font-heading text-base font-semibold text-neutral-900 dark:text-white">
                  How SDLT is calculated
                </h3>
                <div className="space-y-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  <p>
                    SDLT uses a tiered system, similar to income tax. You only
                    pay the higher rate on the portion of the price that falls
                    within each band, not the entire purchase price.
                  </p>
                  <p>
                    For example: buying for £300,000 means 0% on the first
                    £250,000 and 5% on the remaining £50,000 — a total of
                    £2,500 SDLT.
                  </p>
                  <p>
                    First-time buyers benefit from a higher nil-rate threshold.
                    Additional property buyers pay a 5% surcharge on every
                    band.
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
            {/* Secure Your Legal Counsel CTA */}
            <div className="overflow-hidden rounded-xl bg-neutral-900 text-white shadow-lg dark:bg-neutral-950">
              {/* Decorative property image placeholder */}
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-stone-700 to-stone-900">
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    Conveyancing
                  </p>
                  <p className="text-sm font-bold text-white">
                    Secure Your Legal Counsel
                  </p>
                </div>
              </div>
              <div className="p-6">
                <p className="mb-5 text-sm leading-relaxed text-neutral-400">
                  SDLT is just one part of your acquisition costs. Connect with
                  accredited conveyancers to streamline your transaction — fast
                  quotes, zero obligation.
                </p>
                <Link
                  href="/marketplace?category=conveyancing"
                  className="block w-full rounded-lg bg-brand-primary py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brand-primary-light"
                >
                  Find a Solicitor
                </Link>
                <p className="mt-3 text-center text-[10px] text-neutral-500">
                  Free, no-obligation quote
                </p>
              </div>
            </div>

            {/* Placeholder property cards */}
            <div className="space-y-3">
              {SIDEBAR_PROPERTIES.map((prop) => (
                <Link
                  key={prop.label}
                  href="/search"
                  className="group flex overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div
                    className={`h-20 w-24 flex-shrink-0 bg-gradient-to-br ${prop.gradient}`}
                  />
                  <div className="flex flex-col justify-center px-4 py-3">
                    <p className="text-xs font-semibold text-neutral-900 group-hover:text-brand-primary dark:text-white">
                      {prop.label}
                    </p>
                    <p className="text-[11px] text-neutral-400">{prop.sublabel}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Related Tools */}
            <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                Related Tools
              </h3>
              <SdltRelatedTools />
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 p-5 dark:border-neutral-700 dark:bg-neutral-900/30">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-300" />
                <p className="text-[11px] leading-relaxed text-neutral-400 italic">
                  This calculator is for illustrative purposes only. Tax laws
                  are subject to change. We recommend seeking professional
                  advice from a qualified solicitor or tax advisor before
                  making financial decisions.
                </p>
              </div>
            </div>

            {/* Regulated badge */}
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-700 dark:bg-neutral-800/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-900">
                <Scale className="h-5 w-5 text-brand-primary" />
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
      </main>
    </>
  );
}
