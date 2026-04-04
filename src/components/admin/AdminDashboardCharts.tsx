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

const MOCK_REVENUE = [
  { month: "Sep", revenue: 4200 },
  { month: "Oct", revenue: 5800 },
  { month: "Nov", revenue: 6100 },
  { month: "Dec", revenue: 5400 },
  { month: "Jan", revenue: 7200 },
  { month: "Feb", revenue: 8900 },
  { month: "Mar", revenue: 9400 },
];

export function AdminDashboardCharts() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={MOCK_REVENUE} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "var(--color-neutral-500)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--color-neutral-500)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number) =>
            [`£${value.toLocaleString("en-GB")}`, "Revenue"]
          }
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid var(--color-neutral-200)",
            fontSize: "12px",
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-brand-primary)"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
