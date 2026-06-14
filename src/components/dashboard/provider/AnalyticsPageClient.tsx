"use client";

import { useRouter, usePathname } from "next/navigation";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { ConversionFunnel } from "./ConversionFunnel";
import type { EarningsByMonth, TopCategory } from "@/services/provider/provider-analytics-service";
import type { ConversionFunnel as ConversionFunnelType } from "@/types/provider-dashboard";

type Period = "7d" | "30d" | "90d";

const PERIODS: Period[] = ["7d", "30d", "90d"];

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 6 Months",
  "90d": "Year to Date",
};

type Props = Readonly<{
  period: Period;
  profileViewsTotal: number;
  enquiryRatePct: number;
  earningsByMonth: EarningsByMonth[];
  topCategories: TopCategory[];
  conversionByStage: ConversionFunnelType;
}>;

export function AnalyticsPageClient({
  period,
  profileViewsTotal,
  enquiryRatePct,
  earningsByMonth,
  topCategories,
  conversionByStage,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handlePeriodChange(newPeriod: Period) {
    router.push(`${pathname}?period=${newPeriod}`);
  }

  return (
    <div className="space-y-6">
      {/* Page header with period selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
            Dashboard / Analytics
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark">
            Performance Overview
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Real-time business health and growth metrics.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
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
          <button
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-surface"
            aria-label="Export analytics data"
          >
            <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 2v8m0 0L5 7m3 3 3-3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Summary KPIs — 4-column tile row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-primary-lighter text-brand-primary">
              <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
              ↑ 10%
            </span>
          </div>
          <p className="text-xs font-medium text-neutral-500">Profile Views</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-primary-dark">
            {profileViewsTotal.toLocaleString("en-GB")}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-primary-lighter text-brand-primary">
              <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 4h12M2 8h9M2 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
              ↑ 8.4%
            </span>
          </div>
          <p className="text-xs font-medium text-neutral-500">Enquiry Rate</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-primary-dark">
            {enquiryRatePct.toFixed(1)}%
          </p>
        </div>

        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-gold/20 text-brand-gold-foreground">
              <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
              Stable
            </span>
          </div>
          <p className="text-xs font-medium text-neutral-500">Average Rating</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-primary-dark">
            4.92 <span className="text-sm font-medium text-neutral-400">/ 5</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-primary-lighter text-brand-primary">
              <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 2H6a1 1 0 00-1 1v10a1 1 0 001 1h4a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5 5H3a1 1 0 00-1 1v6a1 1 0 001 1h2M11 5h2a1 1 0 011 1v6a1 1 0 01-1 1h-2" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </span>
            <span className="flex items-center gap-0.5 rounded-full bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">
              ↓ 5%
            </span>
          </div>
          <p className="text-xs font-medium text-neutral-500">Repeat Customers</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-primary-dark">
            32%
          </p>
        </div>
      </div>

      {/* Charts */}
      <AnalyticsCharts
        earningsByMonth={earningsByMonth}
        topCategories={topCategories}
        period={period}
        onPeriodChange={handlePeriodChange}
      />

      {/* Conversion Funnel */}
      <ConversionFunnel funnel={conversionByStage} />
    </div>
  );
}
