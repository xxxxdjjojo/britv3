"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DataPoint = { month: string; revenue: number };

type Props = Readonly<{
  data?: DataPoint[] | null;
}>;

export function RevenueBarChart({ data }: Props) {
  const hasRevenue = data && data.some((d) => d.revenue > 0);

  if (!hasRevenue) {
    return (
      <p className="text-sm text-neutral-500 py-8 text-center">
        No revenue data yet — payments will appear here as they occur.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
      >
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
          formatter={(value: number) => [
            `£${value.toLocaleString("en-GB")}`,
            "Revenue",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="revenue" fill="#1B4D3E" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
