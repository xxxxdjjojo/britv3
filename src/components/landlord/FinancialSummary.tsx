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
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Period:</span>
        <div className="flex gap-1">
          {(Object.entries(PERIOD_LABELS) as [PeriodPreset, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === key
                    ? "bg-brand-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
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
        <Card size="sm">
          <CardHeader>
            <CardTitle>Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {isLoading
                ? "..."
                : gbpFormatter.format(summary?.total_income ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {isLoading
                ? "..."
                : gbpFormatter.format(summary?.total_expenses ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                netIsPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isLoading
                ? "..."
                : gbpFormatter.format(summary?.net_income ?? 0)}
            </p>
            {!isLoading && summary && (
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.entry_count} entries
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
