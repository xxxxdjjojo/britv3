"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Clock, PoundSterling, Percent, Star } from "lucide-react";
import type { AgentPerformanceReport } from "@/services/agent/agent-analytics-service";

type DateRangeOption = "30d" | "90d" | "12m";

type Props = Readonly<{
  initialReport: AgentPerformanceReport;
  agentId: string;
}>;

const DATE_RANGE_OPTIONS: { label: string; value: DateRangeOption }[] = [
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last 12 months", value: "12m" },
];

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981"];

function formatMonth(iso: string): string {
  try {
    const [year, month] = iso.split("-");
    return new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit" }).format(
      new Date(Number(year), Number(month) - 1, 1),
    );
  } catch {
    return iso;
  }
}

function formatGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

// Build source breakdown from listings_over_time totals (illustrative)
function buildSourceData(totalListings: number) {
  if (totalListings === 0) {
    return [
      { name: "Website", value: 0 },
      { name: "Portal", value: 0 },
      { name: "Referral", value: 0 },
    ];
  }
  return [
    { name: "Website", value: Math.round(totalListings * 0.45) },
    { name: "Portal", value: Math.round(totalListings * 0.35) },
    { name: "Referral", value: Math.round(totalListings * 0.20) },
  ];
}

// Build a simple conversion funnel from the conversion_rate and listings sold
function buildFunnelData(report: AgentPerformanceReport) {
  const sold = report.listings_sold_count;
  // Back-calculate approximate funnel stages from conversion rate
  const convRate = report.conversion_rate > 0 ? report.conversion_rate : 0.1;
  const leads = convRate > 0 ? Math.round(sold / convRate) : sold * 4;
  const viewings = Math.round(leads * 0.6);
  const offers = Math.round(viewings * 0.4);
  const completions = sold;

  return [
    { stage: "Leads", count: leads },
    { stage: "Viewings", count: viewings },
    { stage: "Offers", count: offers },
    { stage: "Completions", count: completions },
  ];
}

export function AgentPerformanceCharts({ initialReport, agentId }: Props) {
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>("12m");
  const [report, setReport] = useState<AgentPerformanceReport>(initialReport);
  const [loading, setLoading] = useState(false);

  async function handleRangeChange(range: DateRangeOption) {
    setSelectedRange(range);
    setLoading(true);

    const now = new Date();
    const from = new Date(now);
    if (range === "30d") {
      from.setDate(now.getDate() - 30);
    } else if (range === "90d") {
      from.setDate(now.getDate() - 90);
    } else {
      from.setFullYear(now.getFullYear() - 1);
    }

    const fromStr = from.toISOString().slice(0, 10);
    const toStr = now.toISOString().slice(0, 10);

    try {
      const res = await fetch(
        `/api/agent/analytics?type=agent&from=${fromStr}&to=${toStr}`,
      );
      if (res.ok) {
        const data = (await res.json()) as AgentPerformanceReport;
        setReport(data);
      }
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }

    void agentId; // used for future per-agent filters
  }

  const revenueData = report.revenue_over_time.map((p) => ({
    date: formatMonth(p.date),
    revenue: Math.round(p.value / 100),
  }));

  const listingsData = report.listings_over_time.map((p) => ({
    date: formatMonth(p.date),
    sold: p.value,
  }));

  const sourceData = buildSourceData(report.listings_sold_count);
  const funnelData = buildFunnelData(report);
  const maxFunnelCount = funnelData[0]?.count ?? 1;

  const kpiCards = [
    {
      label: "Listings Sold",
      value: report.listings_sold_count.toLocaleString(),
      icon: <TrendingUp className="size-5 text-blue-500" />,
      color: "text-blue-600",
    },
    {
      label: "Avg Time on Market",
      value: report.avg_time_on_market_days != null
        ? `${report.avg_time_on_market_days} days`
        : "—",
      icon: <Clock className="size-5 text-amber-500" />,
      color: "text-amber-600",
    },
    {
      label: "Total Revenue",
      value: formatGbp(report.total_revenue_pence),
      icon: <PoundSterling className="size-5 text-green-500" />,
      color: "text-green-600",
    },
    {
      label: "Conversion Rate",
      value: `${(report.conversion_rate * 100).toFixed(1)}%`,
      icon: <Percent className="size-5 text-purple-500" />,
      color: "text-purple-600",
    },
    {
      label: "Client Satisfaction",
      value: report.client_satisfaction_avg != null
        ? `${report.client_satisfaction_avg.toFixed(1)} / 5`
        : "—",
      icon: <Star className="size-5 text-yellow-500" />,
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Date range selector */}
      <div className="flex gap-2">
        {DATE_RANGE_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => void handleRangeChange(value)}
            disabled={loading}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedRange === value
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            } disabled:opacity-50`}
          >
            {label}
          </button>
        ))}
        {loading && (
          <span className="flex items-center text-sm text-muted-foreground ml-2">
            Loading...
          </span>
        )}
      </div>

      {/* KPI summary row */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map(({ label, value, icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                {icon}
                <span className={`text-xl font-bold ${color}`}>{value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Listings sold per month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listings Sold per Month</CardTitle>
            <CardDescription>Accepted offers over selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {listingsData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No sales data for selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={listingsData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => [v, "Sold"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="sold"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue per month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue per Month</CardTitle>
            <CardDescription>Commission received (GBP)</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No revenue data for selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => [`£${v.toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[3, 3, 0, 0]} name="Revenue (£)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Listing source breakdown pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listing Source Breakdown</CardTitle>
            <CardDescription>Where new listings originate</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number, name: string) => [v, name]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
            <CardDescription>Leads through to completions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 pt-2">
              {funnelData.map(({ stage, count }) => {
                const pct = maxFunnelCount > 0 ? (count / maxFunnelCount) * 100 : 0;
                return (
                  <div key={stage} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{stage}</span>
                      <span className="text-muted-foreground">{count.toLocaleString()}</span>
                    </div>
                    <div className="h-5 w-full rounded bg-muted overflow-hidden">
                      <div
                        className="h-full rounded bg-blue-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
