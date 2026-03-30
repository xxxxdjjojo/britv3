"use client";

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { ListingAnalyticsSummary } from "@/types/seller";
import { cn } from "@/lib/utils";

const DATE_RANGES: Array<{ label: string; days: number }> = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

const PIE_COLORS = ["#1B4D3E", "#D4A853", "#2563EB", "#7C3AED", "#DB2777"];

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
      const res = await fetch(`/api/seller/listings/${listingId}/analytics?days=${newDays}`);
      if (res.ok) setSummary(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const chartData = summary.daily_views.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    views: d.count,
  }));

  const pieData = [
    { name: "Views", value: summary.total_views },
    { name: "Saves", value: summary.total_saves },
    { name: "Enquiries", value: summary.total_enquiries },
    { name: "Phone Clicks", value: summary.total_phone_clicks },
    { name: "Email Clicks", value: summary.total_email_clicks },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[--color-neutral-500] mr-1 font-inter">Period:</span>
        <div className="flex items-center gap-1 bg-[--color-neutral-100] rounded-xl p-1">
          {DATE_RANGES.map(({ label, days: d }) => (
            <button
              key={d}
              type="button"
              onClick={() => handleRangeChange(d)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 font-inter",
                days === d
                  ? "bg-white text-[--color-brand-primary] shadow-sm"
                  : "text-[--color-neutral-500] hover:text-[--color-neutral-900]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {loading && (
          <div className="h-4 w-4 rounded-full border-2 border-[--color-brand-primary]/30 border-t-[--color-brand-primary] animate-spin ml-1" />
        )}
      </div>

      {/* Views Over Time Chart */}
      <div className={cn(
        "bg-white rounded-xl shadow-sm p-6 transition-opacity duration-200",
        loading ? "opacity-50" : "opacity-100",
      )}>
        <h3 className="font-semibold text-[--color-neutral-900] mb-6 font-['Plus_Jakarta_Sans']">
          Views Over Time
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#analyticsGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#1B4D3E", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-[--color-neutral-400] text-sm font-inter">
            No views data for this period
          </div>
        )}
      </div>

      {/* Event Breakdown */}
      <div className={cn(
        "bg-white rounded-xl shadow-sm p-6 transition-opacity duration-200",
        loading ? "opacity-50" : "opacity-100",
      )}>
        <h3 className="font-semibold text-[--color-neutral-900] mb-6 font-['Plus_Jakarta_Sans']">
          Engagement Breakdown
        </h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.03)",
                  fontFamily: "Inter, sans-serif",
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ fontSize: 12, color: "#5E5E6A", fontFamily: "Inter, sans-serif" }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-[--color-neutral-400] text-sm font-inter">
            No event data for this period
          </div>
        )}
      </div>
    </div>
  );
}
