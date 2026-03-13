"use client";

import dynamic from "next/dynamic";

const AreaPriceTrend = dynamic(
  () => import("@/components/charts/AreaPriceTrend").then((m) => ({ default: m.AreaPriceTrend })),
  { ssr: false, loading: () => <div className="h-[200px] animate-pulse bg-primary/5 rounded-xl" /> }
);

export function AreaPriceTrendClient() {
  return <AreaPriceTrend />;
}
