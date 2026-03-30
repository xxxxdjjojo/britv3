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
      <div className="h-64 flex items-center justify-center text-[--color-neutral-400] text-sm">
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
            <stop offset="5%" stopColor="#1B4D3E" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#1B4D3E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E8" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#7A7A88", fontFamily: "Inter, sans-serif" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#7A7A88", fontFamily: "Inter, sans-serif" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "white",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.03)",
            fontFamily: "Inter, sans-serif",
          }}
          labelStyle={{ color: "#171719", fontWeight: 600, fontSize: "12px" }}
          itemStyle={{ color: "#1B4D3E", fontSize: "12px" }}
        />
        <Area
          type="monotone"
          dataKey="views"
          stroke="#1B4D3E"
          strokeWidth={2}
          fill="url(#viewsGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#1B4D3E", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
