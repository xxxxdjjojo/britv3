"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AreaPriceTrend } from "@/services/land-registry/types";

function formatPrice(value: number): string {
  if (value >= 1_000_000) {
    return `\u00A3${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `\u00A3${(value / 1_000).toFixed(0)}K`;
  }
  return `\u00A3${value}`;
}

export default function PriceTrendChart(
  props: Readonly<{ data: AreaPriceTrend[] }>,
) {
  const { data } = props;

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="year"
            className="text-xs"
          />
          <YAxis
            tickFormatter={formatPrice}
            className="text-xs"
            width={70}
          />
          <Tooltip
            formatter={(value) => [formatPrice(Number(value)), "Avg Price"]}
            labelFormatter={(label) => `Year: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="averagePrice"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
