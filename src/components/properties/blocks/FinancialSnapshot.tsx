import { ChevronDown, PoundSterling } from "lucide-react";
import { MortgageCalculator } from "@/components/calculators/MortgageCalculator";
import { SdltCalculator } from "@/components/calculators/SdltCalculator";
import { buildBuyFinancialSnapshot } from "@/lib/properties/financial-snapshot";
import type { PropertyView } from "@/lib/properties/build-property-view";

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

/**
 * Block 04 (buy) — Financial snapshot feature band. Synthesises the existing
 * mortgage + SDLT calculators into one "what does this cost me?" answer (total
 * monthly cost, total upfront, indicative income required) and expands inline
 * to the full calculators. The calculators live here rather than the rail so
 * there is a single source of truth.
 */
export function FinancialSnapshot({ view }: { view: PropertyView }) {
  const { listing, property } = view.detail;
  const snap = buildBuyFinancialSnapshot(listing.price, property.councilTaxBand);

  const headline = [
    { label: "Est. total monthly", value: gbp(snap.totalMonthly), hint: "Mortgage + council tax" },
    { label: "Upfront to buy", value: gbp(snap.totalUpfront), hint: "Deposit + stamp duty + fees" },
    { label: "Income guide", value: gbp(snap.incomeRequired), hint: `~${snap.assumptions.incomeMultiple}× the loan` },
  ];

  const breakdown = [
    { label: "Deposit", value: gbp(snap.deposit) },
    { label: "Monthly mortgage", value: gbp(snap.monthlyMortgage) },
    { label: "Stamp duty", value: gbp(snap.stampDuty) },
    {
      label: "Council tax / mo",
      value: snap.monthlyCouncilTax != null ? gbp(snap.monthlyCouncilTax) : "—",
    },
  ];

  return (
    <section className="mb-8 rounded-2xl border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <PoundSterling className="size-4" />
        </span>
        <h2 className="text-lg font-semibold">Financial snapshot</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {headline.map((h) => (
          <div key={h.label} className="rounded-xl border bg-background p-4">
            <p className="text-xs text-muted-foreground">{h.label}</p>
            <p className="mt-0.5 text-2xl font-bold text-primary">{h.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{h.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {breakdown.map((b) => (
          <div key={b.label} className="rounded-lg border bg-background px-3 py-2">
            <p className="text-[11px] text-muted-foreground">{b.label}</p>
            <p className="text-sm font-medium">{b.value}</p>
          </div>
        ))}
      </div>

      <details className="group mt-4 rounded-xl border">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
          <span className="min-w-0">Adjust the figures — mortgage &amp; stamp duty calculators</span>
          <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t p-4">
          <MortgageCalculator initialPrice={listing.price} />
          <SdltCalculator initialPrice={listing.price} />
        </div>
      </details>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Indicative only, not a mortgage offer. Assumes a{" "}
        {Math.round(snap.assumptions.depositPercent * 100)}% deposit at{" "}
        {snap.assumptions.annualRatePercent}% over {snap.assumptions.termYears}{" "}
        years; council tax is an England band-average estimate.
      </p>
    </section>
  );
}
