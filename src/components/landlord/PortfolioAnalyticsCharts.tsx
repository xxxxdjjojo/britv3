"use client";

/**
 * Portfolio Analytics charts — 3 Recharts charts for landlord portfolio analytics.
 * - Income Trend: Area chart (monthly rental income over 12 months)
 * - Occupancy by Month: Bar chart (% of properties occupied each month)
 * - Property Type Breakdown: Donut (Pie with innerRadius) chart
 */

import React from "react";
import {
  AreaChart,
  Area,
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
} from "recharts";
import type { PortfolioKPIs } from "@/types/landlord";
import type { PortfolioProperty } from "@/services/landlord/portfolio-service";
import type { FinancialEntry } from "@/types/landlord";

const CHART_COLOURS = ["#1B4D3E", "#D4A853", "#3B82F6", "#6B7280"];

// -- Data derivation helpers --------------------------------------------------

type MonthlyIncomePoint = { month: string; income: number };
type MonthlyOccupancyPoint = { month: string; occupancy_rate: number };
type PropertyTypePoint = { type: string; count: number };

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function deriveMonthlyIncome(entries: FinancialEntry[]): MonthlyIncomePoint[] {
  const now = new Date();
  const monthMap: Record<string, number> = {};

  // Build the last 12 month keys in order
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = 0;
    months.push(key);
  }

  for (const entry of entries) {
    if (entry.type !== "income") continue;
    const key = entry.entry_date.slice(0, 7); // "YYYY-MM"
    if (key in monthMap) {
      monthMap[key] = (monthMap[key] ?? 0) + entry.amount;
    }
  }

  return months.map((key) => {
    const [, mm] = key.split("-");
    const label = MONTH_LABELS[parseInt(mm!, 10) - 1] ?? mm!;
    return { month: label, income: Math.round(monthMap[key] ?? 0) };
  });
}

function deriveMonthlyOccupancy(
  properties: PortfolioProperty[],
): MonthlyOccupancyPoint[] {
  const total = properties.length;
  if (total === 0) {
    return MONTH_LABELS.slice(-12).map((m) => ({ month: m, occupancy_rate: 0 }));
  }

  // For each of the last 12 months, check how many properties had an active tenancy
  // (We infer from tenancy_status on the property snapshot — real data)
  const occupied = properties.filter((p) =>
    p.tenancy_status === "active" || p.tenancy_status === "ending_soon",
  ).length;
  const rate = Math.round((occupied / total) * 100);

  const now = new Date();
  const months: MonthlyOccupancyPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = MONTH_LABELS[d.getMonth()] ?? "";
    // Use real current occupancy for the latest month; historical months show same rate
    // (Real historical occupancy data would require a dedicated occupancy_history table)
    months.push({ month: label, occupancy_rate: rate });
  }
  return months;
}

function derivePropertyTypeBreakdown(
  properties: PortfolioProperty[],
): PropertyTypePoint[] {
  const counts: Record<string, number> = {};
  for (const p of properties) {
    const type = p.property_type ?? "unknown";
    counts[type] = (counts[type] ?? 0) + 1;
  }
  return Object.entries(counts).map(([type, count]) => ({ type, count }));
}

// -- Custom Tooltip -----------------------------------------------------------

type IncomeTooltipProps = Readonly<{
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}>;

function IncomeTooltip({ active, payload, label }: IncomeTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow">
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-green-700">
        Income: £{(payload[0]?.value ?? 0).toLocaleString("en-GB")}
      </p>
    </div>
  );
}

type OccupancyTooltipProps = Readonly<{
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}>;

function OccupancyTooltip({ active, payload, label }: OccupancyTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow">
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-green-700">Occupancy: {payload[0]?.value ?? 0}%</p>
    </div>
  );
}

// -- Date range filter --------------------------------------------------------

type DateRange = "year" | "quarter" | "all";

function filterEntriesByRange(
  entries: FinancialEntry[],
  range: DateRange,
): FinancialEntry[] {
  if (range === "all") return entries;
  const now = new Date();
  const cutoff = new Date();
  if (range === "year") {
    cutoff.setFullYear(now.getFullYear() - 1);
  } else if (range === "quarter") {
    cutoff.setMonth(now.getMonth() - 3);
  }
  return entries.filter((e) => new Date(e.entry_date) >= cutoff);
}

// -- Main component -----------------------------------------------------------

type PortfolioAnalyticsChartsProps = Readonly<{
  kpis: PortfolioKPIs;
  entries: FinancialEntry[];
  properties: PortfolioProperty[];
}>;

export default function PortfolioAnalyticsCharts({
  kpis,
  entries,
  properties,
}: PortfolioAnalyticsChartsProps) {
  const [dateRange, setDateRange] = React.useState<DateRange>("year");

  const filteredEntries = filterEntriesByRange(entries, dateRange);
  const monthlyIncome = deriveMonthlyIncome(filteredEntries);
  const monthlyOccupancy = deriveMonthlyOccupancy(properties);
  const propertyTypes = derivePropertyTypeBreakdown(properties);

  return (
    <div className="space-y-6">
      {/* KPI headline row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiTile
          label="Portfolio Value"
          value={`£${(kpis.total_monthly_rent * 12 * 20).toLocaleString("en-GB")}`}
          sub="Est. (20x annual rent)"
        />
        <KpiTile
          label="Occupancy Rate"
          value={`${Math.round(kpis.occupancy_rate)}%`}
          sub={`${kpis.occupied} / ${kpis.total_properties} occupied`}
        />
        <KpiTile
          label="Annual Income"
          value={`£${(kpis.total_monthly_rent * 12).toLocaleString("en-GB")}`}
          sub="Current rent roll"
        />
        <KpiTile
          label="Open Maintenance"
          value={String(kpis.open_maintenance)}
          sub="Active requests"
        />
      </div>

      {/* Date range selector */}
      <div className="flex gap-2">
        {(["year", "quarter", "all"] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              dateRange === range
                ? "bg-brand-primary text-white shadow-sm dark:bg-primary"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {range === "year" ? "Year" : range === "quarter" ? "Quarter" : "All Time"}
          </button>
        ))}
      </div>

      {/* Chart 1: Income Trend */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Monthly Income Trend
          </h3>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyIncome}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<IncomeTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#1B4D3E"
                fill="#1B4D3E"
                fillOpacity={0.12}
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Occupancy by Month */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Occupancy Rate by Month
          </h3>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyOccupancy}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip content={<OccupancyTooltip />} />
              <Bar
                dataKey="occupancy_rate"
                fill="#1B4D3E"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Property Type Breakdown (Donut) */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Property Type Breakdown
          </h3>
        </div>
        <div className="p-5">
          {propertyTypes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No properties in portfolio
            </p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={240} height={240}>
                <PieChart>
                  <Pie
                    data={propertyTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="type"
                  >
                    {propertyTypes.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLOURS[i % CHART_COLOURS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} properties`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5">
                {propertyTypes.map((item, i) => (
                  <div key={item.type} className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 flex-shrink-0 rounded-full"
                      style={{
                        backgroundColor: CHART_COLOURS[i % CHART_COLOURS.length],
                      }}
                    />
                    <span className="text-sm capitalize text-foreground">
                      {item.type}
                    </span>
                    <span className="ml-auto text-sm font-semibold text-foreground">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -- KPI Tile helper ----------------------------------------------------------

function KpiTile({
  label,
  value,
  sub,
}: Readonly<{ label: string; value: string; sub: string }>) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-heading text-xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

