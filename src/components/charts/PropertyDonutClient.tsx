"use client";

import dynamic from "next/dynamic";

const PropertyDonut = dynamic(
  () => import("@/components/charts/PropertyDonut").then((m) => ({ default: m.PropertyDonut })),
  { ssr: false, loading: () => <div className="h-[140px] animate-pulse bg-primary/5 rounded-xl" /> }
);

export function PropertyDonutClient() {
  return <PropertyDonut />;
}
