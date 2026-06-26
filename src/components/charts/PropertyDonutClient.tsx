"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { PropertyDonut as PropertyDonutComponent } from "@/components/charts/PropertyDonut";

const PropertyDonut = dynamic(
  () => import("@/components/charts/PropertyDonut").then((m) => ({ default: m.PropertyDonut })),
  { ssr: false, loading: () => <div className="h-[140px] animate-pulse bg-primary/5 rounded-xl" /> }
);

type Props = ComponentProps<typeof PropertyDonutComponent>;

export function PropertyDonutClient(props: Props) {
  return <PropertyDonut {...props} />;
}
