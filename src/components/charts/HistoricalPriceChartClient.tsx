"use client";

import dynamic from "next/dynamic";

const HistoricalPriceChart = dynamic(
  () => import("@/components/charts/HistoricalPriceChart").then((m) => ({ default: m.HistoricalPriceChart })),
  { ssr: false, loading: () => <div className="h-[320px] animate-pulse bg-primary/5 rounded-xl" /> }
);

type DataPoint = Readonly<{ year: number; price: number }>;

type HistoricalPriceChartClientProps = Readonly<{
  data: DataPoint[];
  className?: string;
}>;

export function HistoricalPriceChartClient({ data, className }: HistoricalPriceChartClientProps) {
  return <HistoricalPriceChart data={data} className={className} />;
}
