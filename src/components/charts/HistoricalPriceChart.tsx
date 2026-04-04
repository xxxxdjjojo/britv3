"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

type DataPoint = Readonly<{ year: number; price: number }>;

type HistoricalPriceChartProps = Readonly<{
  data: DataPoint[];
  className?: string;
}>;

function formatPrice(value: number) {
  return `£${(value / 1000).toFixed(0)}k`;
}

type CustomTooltipProps = Readonly<{
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
}>;

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white dark:bg-neutral-900 border border-primary/10 rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-bold text-neutral-900 dark:text-neutral-100">{label}</p>
      <p className="text-primary">{formatPrice(payload[0].value)}</p>
    </div>
  );
}

const KEY_EVENTS: Array<{ year: number; label: string }> = [
  { year: 2008, label: "Financial Crisis" },
  { year: 2013, label: "Recovery" },
  { year: 2020, label: "Covid" },
  { year: 2022, label: "Rate Rises" },
  { year: 2023, label: "Market Dip" },
];

export function HistoricalPriceChart({ data, className }: HistoricalPriceChartProps) {
  const gradientId = useId();
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 20, right: 16, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "var(--color-neutral-400)", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tickFormatter={formatPrice}
            tick={{ fontSize: 11, fill: "var(--color-neutral-400)" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          {KEY_EVENTS.map(({ year, label }) => (
            <ReferenceLine
              key={year}
              x={year}
              stroke="var(--color-brand-primary)"
              strokeDasharray="4 3"
              strokeOpacity={0.4}
              label={{ value: label, position: "top", fontSize: 9, fill: "var(--color-brand-primary)", fontWeight: 600 }}
            />
          ))}
          <Area
            type="monotone"
            dataKey="price"
            stroke="var(--color-brand-primary)"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, fill: "var(--color-brand-primary)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
