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
import type { ListingAnalyticsSummary } from "@/types/seller";

type Props = Readonly<{
  data: ListingAnalyticsSummary["daily_views"];
}>;

export function PerformanceChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-[--color-outline] text-sm">
        No data yet for this period
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    views: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={256}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary-container)" stopOpacity={0.12} />
            <stop offset="95%" stopColor="var(--color-primary-container)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--color-outline)", fontFamily: "var(--font-sans)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-outline)", fontFamily: "var(--font-sans)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface)",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.03)",
            fontFamily: "var(--font-sans)",
          }}
          labelStyle={{ color: "var(--color-on-surface)", fontWeight: 600, fontSize: "12px" }}
          itemStyle={{ color: "var(--color-primary-container)", fontSize: "12px" }}
        />
        <Area
          type="monotone"
          dataKey="views"
          stroke="var(--color-primary-container)"
          strokeWidth={2}
          fill="url(#viewsGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "var(--color-primary-container)", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
