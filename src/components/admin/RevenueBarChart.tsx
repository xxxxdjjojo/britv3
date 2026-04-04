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

const MOCK_DATA = [
  { month: "Sep", revenue: 4200 },
  { month: "Oct", revenue: 5800 },
  { month: "Nov", revenue: 6100 },
  { month: "Dec", revenue: 5400 },
  { month: "Jan", revenue: 7200 },
  { month: "Feb", revenue: 8900 },
  { month: "Mar", revenue: 9400 },
];

type DataPoint = { month: string; revenue: number };

type Props = Readonly<{
  data?: DataPoint[] | null;
}>;

export function RevenueBarChart({ data }: Props) {
  const chartData = data && data.length > 0 ? data : MOCK_DATA;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
      >
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
          formatter={(value: number) => [
            `£${value.toLocaleString("en-GB")}`,
            "Revenue",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid var(--color-neutral-200)",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="revenue" fill="var(--color-brand-primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
