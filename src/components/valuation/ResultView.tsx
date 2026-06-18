import Link from "next/link";
import { Home, TrendingUp, Info, MapPin, Pencil } from "lucide-react";
import type { StoredValuation } from "@/services/valuation/session-repo";
import type { EvidenceQuality } from "@/types/valuation";

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const EVIDENCE: Record<EvidenceQuality, { label: string; className: string; blurb: string }> = {
  high: {
    label: "High",
    className: "bg-brand-primary/10 text-brand-primary",
    blurb: "Strong address match and several recent, highly similar comparable sales.",
  },
  medium: {
    label: "Medium",
    className: "bg-brand-secondary/15 text-brand-secondary",
    blurb: "Usable evidence, but some characteristics or close comparables are missing.",
  },
  low: {
    label: "Low",
    className: "bg-amber-100 text-amber-800",
    blurb: "Limited, older, geographically broad or dissimilar evidence — treat as a rough guide.",
  },
  unavailable: {
    label: "Unavailable",
    className: "bg-neutral-200 text-neutral-700",
    blurb: "We can't responsibly produce an instant estimate for this property.",
  },
};

const TYPE_LABEL: Record<string, string> = {
  D: "Detached", S: "Semi-detached", T: "Terraced", F: "Flat / maisonette", O: "Other",
};

function formatSaleDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function ResultView({ valuation }: { valuation: StoredValuation }) {
  const { result, subject, id } = valuation;
  const ev = EVIDENCE[result.evidenceQuality];
  const address = [subject.saon, subject.paon, subject.street].filter(Boolean).join(" ");
  const noEstimate = result.estimatedValue === null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-6">
        <p className="font-heading text-sm font-semibold uppercase tracking-wide text-brand-primary">
          Indicative automated estimate
        </p>
        <h1 className="mt-1 flex items-center gap-2 font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
          <Home className="size-6 text-brand-primary" aria-hidden="true" />
          {address ? `${address}, ${subject.postcode}` : subject.postcode}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Estimated on{" "}
          {new Date(`${result.valuationDate}T00:00:00Z`).toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
          })}{" "}
          · model {result.modelVersion}
        </p>
      </header>

      {/* Primary result */}
      <section
        aria-labelledby="estimate-heading"
        className="rounded-2xl border border-brand-primary/20 bg-brand-primary-lighter/40 p-6 sm:p-8"
      >
        <h2 id="estimate-heading" className="sr-only">Your estimate</h2>
        {noEstimate ? (
          <div>
            <p className="font-heading text-2xl font-bold text-neutral-900">
              We can&apos;t give a reliable instant estimate
            </p>
            <p className="mt-2 text-neutral-600">
              There isn&apos;t enough nearby sales evidence to value this property responsibly. A local
              estate agent can give you an accurate, in-person valuation.
            </p>
          </div>
        ) : (
          <div>
            <p className="font-heading text-4xl font-bold text-brand-primary sm:text-5xl">
              {gbp.format(result.estimatedValue!)}
            </p>
            <p className="mt-2 text-neutral-700">
              Estimated range{" "}
              <span className="font-semibold">
                {gbp.format(result.estimatedLow!)} – {gbp.format(result.estimatedHigh!)}
              </span>
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Estimated range based on comparable sales and model uncertainty — not a calibrated
              confidence interval.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${ev.className}`}>
                Evidence: {ev.label}
              </span>
              <span className="text-sm text-neutral-500">
                from {result.comparableCount} comparable sales
              </span>
            </div>
            <p className="mt-3 text-sm text-neutral-600">{ev.blurb}</p>
          </div>
        )}
      </section>

      {/* Property information */}
      <section className="mt-8" aria-labelledby="property-heading">
        <h2 id="property-heading" className="font-heading text-lg font-semibold text-neutral-900">
          Property information
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
          {[
            ["Type", TYPE_LABEL[subject.propertyType] ?? subject.propertyType],
            ["Bedrooms", subject.bedrooms?.toString() ?? "—"],
            ["Bathrooms", subject.bathrooms?.toString() ?? "—"],
            ["Floor area", subject.floorAreaSqm ? `${subject.floorAreaSqm} m²` : "—"],
            ["Tenure", subject.tenure === "L" ? "Leasehold" : "Freehold"],
            ["Condition", subject.condition?.replace(/_/g, " ") ?? "—"],
          ].map(([label, value]) => (
            <div key={label} className="bg-white px-4 py-3">
              <dt className="text-xs text-neutral-500">{label}</dt>
              <dd className="mt-0.5 text-sm font-medium capitalize text-neutral-900">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Evidence: comparable sales */}
      {result.comparableSales.length > 0 ? (
        <section className="mt-8" aria-labelledby="evidence-heading">
          <h2 id="evidence-heading" className="flex items-center gap-2 font-heading text-lg font-semibold text-neutral-900">
            <TrendingUp className="size-5 text-brand-primary" aria-hidden="true" />
            Comparable registered sales
          </h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Address</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Sold</th>
                  <th className="px-4 py-2 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {result.comparableSales.slice(0, 8).map((c) => (
                  <tr key={c.transactionId}>
                    <td className="px-4 py-2 text-neutral-700">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3 text-neutral-400" aria-hidden="true" />
                        {[c.paon, c.street].filter(Boolean).join(" ") || c.postcode}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-neutral-600">{TYPE_LABEL[c.propertyType] ?? c.propertyType}</td>
                    <td className="px-4 py-2 text-neutral-600">{formatSaleDate(c.saleDate)}</td>
                    <td className="px-4 py-2 text-right font-medium text-neutral-900">{gbp.format(c.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Limitations */}
      {result.limitations.length > 0 ? (
        <section className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-5" aria-labelledby="limitations-heading">
          <h2 id="limitations-heading" className="flex items-center gap-2 font-heading text-sm font-semibold text-neutral-900">
            <Info className="size-4 text-neutral-500" aria-hidden="true" />
            What this estimate doesn&apos;t account for
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600">
            {result.limitations.map((lim) => (
              <li key={lim}>{lim}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Actions */}
      <section className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/value-my-property/details"
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-brand-primary px-6 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/10"
        >
          <Pencil className="size-4" aria-hidden="true" />
          Correct details & recalculate
        </Link>
        <Link
          href={`/value-my-property/result/${id}/expert`}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-brand-primary-light"
        >
          <TrendingUp className="size-4" aria-hidden="true" />
          Get a local expert valuation
        </Link>
      </section>
    </div>
  );
}
