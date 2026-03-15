"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DataPoint = { date: string; count: number };

type Props = Readonly<{
  data: DataPoint[];
}>;

export function SearchVolumeChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart
        data={data}
        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: number) => [value.toLocaleString("en-GB"), "Searches"]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: "12px",
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#2563EB"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
