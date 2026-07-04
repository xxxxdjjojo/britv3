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

type Props = Readonly<{ data?: Array<{ month: string; revenue: number }> }>;

export function AdminDashboardCharts({ data }: Props) {
  const hasRevenue = data && data.some((d) => d.revenue > 0);

  if (!hasRevenue) {
    return (
      <p className="text-sm text-neutral-500 py-8 text-center">
        No revenue data yet — payments will appear here as they occur.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1B4D3E" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#1B4D3E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
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
            border: "1px solid #e5e7eb",
            fontSize: "12px",
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#1B4D3E"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
