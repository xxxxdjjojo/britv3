"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";

const DATE_RANGES: Array<{ label: string; days: number }> = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

type Props = Readonly<{
  listingId: string;
  initialSummary: ListingAnalyticsSummary;
}>;

export function ListingAnalyticsCharts({ listingId, initialSummary }: Props) {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);

  const handleRangeChange = async (newDays: number) => {
    if (newDays === days) return;
    setDays(newDays);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/seller/listings/${listingId}/analytics?days=${newDays}`
      );
      if (res.ok) setSummary(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const chartData = summary.daily_views.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    views: d.count,
  }));

  return (
    <div className={cn("space-y-4 transition-opacity duration-200", loading ? "opacity-50" : "opacity-100")}>
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-[--color-surface-container-low] rounded-xl p-1">
          {DATE_RANGES.map(({ label, days: d }) => (
            <button
              key={d}
              type="button"
              onClick={() => handleRangeChange(d)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150",
                days === d
                  ? "bg-white text-[--color-brand-primary-dark] shadow-sm"
                  : "text-neutral-400 hover:text-[--color-brand-primary-dark]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {loading && (
          <div className="h-4 w-4 rounded-full border-2 border-[--color-brand-primary-dark]/20 border-t-[--color-brand-primary-dark] animate-spin ml-1" />
        )}
      </div>

      {/* Views Over Time */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-brand-primary-dark)" stopOpacity={0.1} />
                <stop offset="95%" stopColor="var(--color-brand-primary-dark)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-neutral-100)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--color-neutral-400)", fontFamily: "Inter, sans-serif" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--color-neutral-400)", fontFamily: "Inter, sans-serif" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
              }}
              labelStyle={{ color: "var(--color-neutral-900)", fontWeight: 600 }}
              itemStyle={{ color: "var(--color-brand-primary-dark)" }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="var(--color-brand-primary-dark)"
              strokeWidth={2.5}
              fill="url(#analyticsGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "var(--color-brand-primary-dark)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-neutral-400 text-sm">
          No views data for this period
        </div>
      )}
    </div>
  );
}
