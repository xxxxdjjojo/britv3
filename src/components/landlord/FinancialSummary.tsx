"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PeriodPreset = "this_month" | "this_quarter" | "ytd" | "last_12_months";

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  this_month: "This Month",
  this_quarter: "This Quarter",
  ytd: "Year to Date",
  last_12_months: "Last 12 Months",
};

type SummaryData = {
  total_income: number;
  total_expenses: number;
  net_income: number;
  entry_count: number;
};

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Displays financial summary cards for a property.
 * Shows Total Income, Total Expenses, and Net Income with period selection.
 * Uses RPC function via API route for server-side aggregation.
 * No charts, no graphs -- plain numbers per spec.
 */
export function FinancialSummary(
  props: Readonly<{ propertyId: string }>,
) {
  const [period, setPeriod] = useState<PeriodPreset>("this_month");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/properties/${props.propertyId}/financials?summary_only=true&period=${period}`,
      );
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // Silently fail -- summary is non-critical
    } finally {
      setIsLoading(false);
    }
  }, [props.propertyId, period]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const netIsPositive = (summary?.net_income ?? 0) >= 0;

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-neutral-500">Period:</span>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.entries(PERIOD_LABELS) as [PeriodPreset, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                aria-pressed={period === key}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  period === key
                    ? "bg-brand-primary text-white shadow-sm"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm" className="bg-white rounded-2xl border border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-500">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-success">
              {isLoading
                ? "—"
                : gbpFormatter.format(summary?.total_income ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card size="sm" className="bg-white rounded-2xl border border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-500">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-error">
              {isLoading
                ? "—"
                : gbpFormatter.format(summary?.total_expenses ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card size="sm" className="bg-white rounded-2xl border border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-500">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`font-heading text-2xl font-bold ${
                netIsPositive ? "text-success" : "text-error"
              }`}
            >
              {isLoading
                ? "—"
                : gbpFormatter.format(summary?.net_income ?? 0)}
            </p>
            {!isLoading && summary && (
              <p className="mt-1 text-xs text-neutral-500">
                {summary.entry_count} entries
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
