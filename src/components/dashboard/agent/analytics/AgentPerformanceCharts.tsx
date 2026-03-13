"use client";

import { useState, useCallback } from "react";
import type { PerformanceReport } from "@/services/agent/agent-analytics-service";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DateRangeOption = "30d" | "90d" | "12m";

const MONTHLY_LISTINGS_DATA = [
  { month: "Sep", sold: 4 },
  { month: "Oct", sold: 6 },
  { month: "Nov", sold: 5 },
  { month: "Dec", sold: 3 },
  { month: "Jan", sold: 7 },
  { month: "Feb", sold: 8 },
];

const MONTHLY_REVENUE_DATA = [
  { month: "Sep", revenue: 12400 },
  { month: "Oct", revenue: 18600 },
  { month: "Nov", revenue: 15200 },
  { month: "Dec", revenue: 9800 },
  { month: "Jan", revenue: 21000 },
  { month: "Feb", revenue: 24500 },
];

function KpiCard(props: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
        {props.value}
      </p>
    </div>
  );
}

export function AgentPerformanceCharts(
  props: Readonly<{ initialReport: PerformanceReport }>,
) {
  const [report, setReport] = useState(props.initialReport);
  const [dateRange, setDateRange] = useState<DateRangeOption>("90d");
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async (range: DateRangeOption) => {
    setDateRange(range);
    setLoading(true);

    const now = new Date();
    const start = new Date();
    if (range === "30d") start.setDate(now.getDate() - 30);
    else if (range === "90d") start.setDate(now.getDate() - 90);
    else start.setFullYear(now.getFullYear() - 1);

    try {
      const params = new URLSearchParams({
        type: "agent",
        start: start.toISOString(),
        end: now.toISOString(),
      });
      const res = await fetch(`/api/agent/analytics?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { report: PerformanceReport };
        setReport(data.report);
      }
    } catch {
      // keep current report on error
    } finally {
      setLoading(false);
    }
  }, []);

  const rangeButtons: Array<{ key: DateRangeOption; label: string }> = [
    { key: "30d", label: "Last 30d" },
    { key: "90d", label: "Last 90d" },
    { key: "12m", label: "Last 12m" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Agent Performance
        </h1>
        <div className="flex gap-2">
          {rangeButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => fetchReport(btn.key)}
              disabled={loading}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                dateRange === btn.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Listings Sold" value={String(report.listings_sold)} />
        <KpiCard
          label="Avg Days on Market"
          value={String(report.avg_time_on_market_days)}
        />
        <KpiCard
          label="Total Revenue"
          value={`\u00A3${report.total_revenue.toLocaleString()}`}
        />
        <KpiCard
          label="Conversion Rate"
          value={`${(report.conversion_rate * 100).toFixed(1)}%`}
        />
        <KpiCard
          label="Avg Rating"
          value={report.avg_rating > 0 ? report.avg_rating.toFixed(1) : "N/A"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Listings Sold
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={MONTHLY_LISTINGS_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sold"
                stroke="#2563eb"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Revenue
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={MONTHLY_REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  `\u00A3${value.toLocaleString()}`,
                  "Revenue",
                ]}
              />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
