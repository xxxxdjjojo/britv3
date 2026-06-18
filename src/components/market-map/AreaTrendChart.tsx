"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatCompactPounds, formatPounds } from "@/lib/market-map/format";
import type { TrendPoint } from "@/types/market-map";

type Props = Readonly<{ data: TrendPoint[] }>;

/** Median sold price by quarter for the selected borough/window. */
export function AreaTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Not enough data to chart a trend for this window.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="medianFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1B4D3E" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#1B4D3E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
          <XAxis dataKey="period" tickLine={false} axisLine={false} className="text-[0.65rem]" />
          <YAxis
            tickFormatter={(v) => formatCompactPounds(Number(v))}
            tickLine={false}
            axisLine={false}
            width={56}
            className="text-[0.65rem]"
          />
          <Tooltip
            formatter={(value) => [formatPounds(Number(value)), "Median"]}
            labelFormatter={(label) => `Quarter ${label}`}
          />
          <Area
            type="monotone"
            dataKey="median_price"
            stroke="#1B4D3E"
            strokeWidth={2}
            fill="url(#medianFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
