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
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 mr-2">Period:</span>
        {DATE_RANGES.map(({ label, days: d }) => (
          <button
            key={d}
            type="button"
            onClick={() => handleRangeChange(d)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150",
              days === d
                ? "bg-brand-primary text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300",
            )}
          >
            {label}
          </button>
        ))}
        {loading && <div className="h-4 w-4 rounded-full border-2 border-brand-primary/30 border-t-brand-primary animate-spin ml-2" />}
      </div>

      <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-opacity duration-200", loading ? "opacity-50" : "opacity-100")}>
        <h3 className="font-semibold text-slate-900 mb-6 font-['Plus_Jakarta_Sans']">Views Over Time</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B4D3E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1B4D3E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
              <Area type="monotone" dataKey="views" stroke="#1B4D3E" strokeWidth={2} fill="url(#analyticsGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No views data for this period</div>
        )}
      </div>

      <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-opacity duration-200", loading ? "opacity-50" : "opacity-100")}>
        <h3 className="font-semibold text-slate-900 mb-6 font-['Plus_Jakarta_Sans']">Event Breakdown</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
              <Legend iconType="circle" iconSize={10} formatter={(value) => <span style={{ fontSize: 12, color: "#64748b" }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No event data for this period</div>
        )}
      </div>
    </div>
  );
}
