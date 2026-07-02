import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Home, Info, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CalculatorPageHeader } from "@/components/calculators/CalculatorPageHeader";
import { MovingStackCalculator } from "@/components/tools/moving-stack/MovingStackCalculator";
import { MethodologyFooter } from "@/components/trust/MethodologyFooter";
import { ShareBar } from "@/components/trust/ShareBar";
import { buildMovingStack } from "@/lib/calculators/moving-stack";

export const metadata: Metadata = {
  title: "Total Cost of Moving Calculator | TrueDeed",
  description:
    "The full, itemised cost of buying and moving home — stamp duty (exact), conveyancing, survey, removals, EPC, agent commission and portal passthrough. Every figure sourced or labelled an estimate.",
};

// Enumerate every source the stack can cite (selling includes all line items)
// so the methodology footer always matches what the calculator renders.
const ALL_SOURCES = (() => {
  const items = [
    ...buildMovingStack({
      propertyPrice: 300000,
      location: "england",
      buyerType: "standard",
      selling: true,
    }).items,
    ...buildMovingStack({
      propertyPrice: 300000,
      location: "scotland",
      buyerType: "standard",
      selling: false,
    }).items,
    ...buildMovingStack({
      propertyPrice: 300000,
      location: "wales",
      buyerType: "standard",
      selling: false,
    }).items,
  ];
  return items
    .flatMap((item) => (item.source ? [item.source] : []))
    .filter(
      (source, index, all) =>
        all.findIndex((s) => s.url === source.url) === index,
    );
})();

const CAVEATS = [
  "Figures are typical published ranges from consumer guides, not quotes — your actual costs will vary.",
  "Stamp duty / LBTT / LTT are computed exactly from current published rates via the same calculators as our stamp-duty tool; tax rates are subject to change.",
  "Scotland's Additional Dwelling Supplement and Wales's higher LTT rates for additional properties are not modelled.",
  "The portal passthrough line is an estimate built from published portal ARPA and a stated listings-per-branch assumption — edit those assumptions on the Portal Cost Calculator.",
  "TrueDeed tier costs are our published seller prices (upfront fee plus commission on completion).",
];

const FAQS = [
  {
    q: "Do I need a property survey?",
    a: "While not legally required, a survey is strongly recommended. A basic HomeBuyer Report (Level 2) costs around £300-£500 and can reveal issues that save you thousands. For older or unusual properties, a full Building Survey (Level 3) at £500-£700+ is advisable.",
  },
  {
    q: "Can I negotiate solicitor fees?",
    a: "Yes. Many solicitors offer fixed-fee conveyancing packages. It's worth getting 3-4 quotes. Online conveyancers are often cheaper but may offer less personal service. Always check that any quote includes disbursements (search fees, Land Registry fees, etc.).",
  },
  {
    q: "Are there any costs I'm missing?",
    a: "This estimator covers the main costs. Other potential expenses include mortgage arrangement fees (£0-£2,000), buildings insurance (required on exchange), redirected mail, new furniture, and utility connection fees.",
  },
];

export default function MovingCostEstimatorPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <CalculatorPageHeader
          title="Total Cost of Moving"
          description="The complete, itemised stack of what it really costs to buy — and sell — a home: exact stamp duty, sourced fee ranges, and the estimated portal cost hidden in your listing."
        />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main content */}
          <div className="space-y-8 lg:col-span-8">
            <MovingStackCalculator />

            <ShareBar title="Total Cost of Moving" toolKey="moving_cost_stack" />

            {/* What's included */}
            <article className="prose prose-neutral max-w-none dark:prose-invert">
              <h3 className="mb-4 text-xl font-bold">
                What costs are involved in moving?
              </h3>
              <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
                Buying a home involves more than just the purchase price. Stamp
                duty (or LBTT in Scotland, LTT in Wales) is typically the
                largest additional cost. You will also need to budget for a
                solicitor to handle conveyancing, a property survey, and removal
                costs. If you are selling at the same time, add an EPC
                certificate, the estate agent&apos;s commission, and — less
                visibly — the portal fees your agent pays to advertise your
                home. First-time buyers in England and Northern Ireland may
                benefit from stamp duty relief on properties up to
                &pound;500,000.
              </p>
            </article>

            {/* FAQ */}
            <section className="space-y-4">
              <h3 className="font-heading text-xl font-bold text-neutral-900 dark:text-white">
                Frequently Asked Questions
              </h3>
              {FAQS.map((faq) => (
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

            <MethodologyFooter sources={ALL_SOURCES} caveats={CAVEATS} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Solicitor CTA */}
            <div className="rounded-xl bg-brand-primary p-6 text-white shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-white/20 p-2">
                  <Truck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Find a Solicitor</h3>
              </div>
              <p className="mb-6 text-sm text-brand-primary-lighter">
                Get a competitive conveyancing quote from our panel of trusted
                solicitors in minutes.
              </p>
              <Link
                href="/marketplace?category=conveyancing"
                className="block w-full rounded-lg bg-white py-3 text-center font-bold text-brand-primary transition-colors hover:bg-muted"
              >
                Get Quotes
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
                  href="/tools/stamp-duty-calculator"
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-muted dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <Home className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      Stamp Duty Calculator
                    </p>
                    <p className="text-xs text-neutral-500">
                      Detailed SDLT band breakdown
                    </p>
                  </div>
                </Link>
                <Link
                  href="/tools/mortgage-calculator"
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-muted dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <Calculator className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      Mortgage Calculator
                    </p>
                    <p className="text-xs text-neutral-500">
                      Estimate monthly repayments
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
                  Disclaimer: Costs shown are exact taxes plus estimated ranges
                  based on published UK market guidance. Actual costs may vary.
                  Tax rates are subject to change. Always seek professional
                  advice.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
