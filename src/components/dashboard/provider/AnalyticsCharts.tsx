"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import type { EarningsByMonth, TopCategory } from "@/services/provider/provider-analytics-service";

type Period = "7d" | "30d" | "90d";

type Props = Readonly<{
  earningsByMonth: EarningsByMonth[];
  topCategories: TopCategory[];
  period: Period;
  onPeriodChange: (period: Period) => void;
}>;

const PERIODS: Period[] = ["7d", "30d", "90d"];

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
};

function formatPounds(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMonthLabel(month: string): string {
  const [year, mon] = month.split("-");
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

type EarningsTooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ value: number }>;
  label?: string;
}>;

function EarningsTooltip({ active, payload, label }: EarningsTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-brand-primary">{formatPounds(value)}</p>
    </div>
  );
}

type CategoriesBarTooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ value: number }>;
  label?: string;
}>;

function CategoriesBarTooltip({ active, payload, label }: CategoriesBarTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-brand-primary">{value} bookings</p>
    </div>
  );
}

export function AnalyticsCharts({ earningsByMonth, topCategories, period, onPeriodChange }: Props) {
  const earningsData = earningsByMonth.map((e) => ({
    month: formatMonthLabel(e.month),
    earnings: e.earnings_pence,
  }));

  const categoriesData = topCategories
    .slice(0, 5)
    .map((c) => ({ category: c.category, bookings: c.bookings }));

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Performance Overview</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Stats updated daily at 02:00 UTC</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-neutral-200 bg-surface p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Earnings Trend */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-neutral-700">Earnings Trend</h3>
        {earningsData.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-neutral-400">
            No earnings data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={earningsData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="earningsGradientProv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `£${Math.round(v / 100).toLocaleString("en-GB")}`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip content={<EarningsTooltip />} />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="var(--color-brand-primary)"
                strokeWidth={2}
                fill="url(#earningsGradientProv)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Categories */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-neutral-700">Top Categories</h3>
        {categoriesData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-neutral-400">
            No category data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={categoriesData.length * 48 + 16}>
            <BarChart
              data={categoriesData}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 12, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip content={<CategoriesBarTooltip />} />
              <Bar dataKey="bookings" fill="var(--color-brand-primary)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
