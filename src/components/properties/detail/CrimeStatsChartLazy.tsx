"use client";

import dynamic from "next/dynamic";
import type { CrimeStat } from "./CrimeStatsChart";

/**
 * Lazy, client-only wrapper around CrimeStatsChart. Keeps Recharts (~362 KB
 * minified chunk) out of the property-detail route's first-load JS — the chart
 * is below the fold, so it loads on demand. See PERFORMANCE_AUDIT.md R3.
 */
const CrimeStatsChart = dynamic(
  () => import("./CrimeStatsChart").then((m) => m.CrimeStatsChart),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 rounded-xl border bg-card animate-pulse" />
    ),
  },
);

type Props = Readonly<{
  stats: CrimeStat[] | null;
  boroughAvg?: number | null;
}>;

export function CrimeStatsChartLazy(props: Props) {
  return <CrimeStatsChart {...props} />;
}
