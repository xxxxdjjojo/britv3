// src/components/admin/PricingReviewDashboard.tsx

import type { PricingMetricsSnapshot } from "@/services/analytics/pricing-metrics-service";

interface Props {
  readonly snapshot: PricingMetricsSnapshot;
}

const SEGMENT_LABELS: Record<string, string> = {
  seller: "Sellers",
  agent: "Estate Agents",
  landlord: "Landlords",
  provider: "Providers",
  provider_niche: "Professionals (niche)",
  developer: "Developers",
  trader: "Traders",
  other: "Other",
};

function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function PricingReviewDashboard({ snapshot }: Props) {
  const { payingUsers, mrrTotalPence, mrrBySegment, churnRate, targets, capturedAt } =
    snapshot;

  const scenarios = [
    {
      key: "conservative",
      label: "Conservative",
      target: targets.conservative.payingUsers,
      ratio: payingUsers / targets.conservative.payingUsers,
    },
    {
      key: "base",
      label: "Base",
      target: targets.base.payingUsers,
      ratio: payingUsers / targets.base.payingUsers,
    },
    {
      key: "bull",
      label: "Bull",
      target: targets.bull.payingUsers,
      ratio: payingUsers / targets.bull.payingUsers,
    },
  ];

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Paying users" value={payingUsers.toLocaleString()} />
        <Stat label="MRR" value={formatGBP(mrrTotalPence)} />
        <Stat label="Churn (observed)" value={formatPercent(churnRate)} />
      </section>

      <section>
        <h2 className="font-heading text-xl font-bold text-neutral-900">
          MRR by segment
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-600">
                <th className="p-3">Segment</th>
                <th className="p-3">MRR</th>
                <th className="p-3">Share</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SEGMENT_LABELS).map(([key, label]) => {
                const value = mrrBySegment[key] ?? 0;
                const share = mrrTotalPence > 0 ? value / mrrTotalPence : 0;
                return (
                  <tr key={key} className="border-b border-neutral-100">
                    <td className="p-3 font-medium">{label}</td>
                    <td className="p-3 text-neutral-700">{formatGBP(value)}</td>
                    <td className="p-3 text-neutral-500">{formatPercent(share)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-xl font-bold text-neutral-900">
          Versus memo scenarios
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {scenarios.map((s) => (
            <div
              key={s.key}
              className="rounded-xl border border-neutral-200 p-4"
              data-scenario={s.key}
            >
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                {s.label}
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-neutral-900">
                {s.target.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-neutral-700">paying users target</p>
              <p className="mt-2 text-xs text-neutral-500">
                Current: <span className="font-mono">{Math.round(s.ratio * 100)}%</span> of target
              </p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-neutral-500">
        Snapshot captured at {capturedAt}.
      </p>
    </div>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
