"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// Note: <defs>, <linearGradient>, <stop> are native SVG elements — do NOT import from recharts.

type DataPoint = Readonly<{ year: string; price: number }>;

type AreaPriceTrendProps = Readonly<{
  data?: DataPoint[];
  className?: string;
}>;

const DEFAULT_DATA: DataPoint[] = [
  { year: "2021", price: 480000 },
  { year: "2022", price: 510000 },
  { year: "2023", price: 495000 },
  { year: "2024", price: 528000 },
  { year: "2025", price: 556000 },
  { year: "2026", price: 590000 },
];

export function formatPrice(value: number) {
  return `£${(value / 1000).toFixed(0)}k`;
}

export function AreaPriceTrend({ data = DEFAULT_DATA, className }: AreaPriceTrendProps) {
  const gradientId = useId();
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1B4D3E" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#1B4D3E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: "#9E9EAB", fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={44}
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatPrice}
            tick={{ fontSize: 10, fill: "#9E9EAB", fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => [formatPrice(value), "Avg Price"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #E2E2E8", fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#1B4D3E"
            strokeWidth={3}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, fill: "#1B4D3E" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
