"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IncomeExpenseTrendChart,
  ExpenseCategoryChart,
} from "@/components/landlord/IncomeExpenseChart";
import type { MonthlyDataPoint, CategoryDataPoint } from "@/components/landlord/IncomeExpenseChart";
import { Download } from "lucide-react";

type Props = Readonly<{
  monthlyData: MonthlyDataPoint[];
  categoryData: CategoryDataPoint[];
}>;

/**
 * Client wrapper for the Income & Expense Report page.
 * Renders Recharts charts and handles CSV export (client-side).
 */
export function IncomeExpenseReportClient({ monthlyData, categoryData }: Props) {
  function handleCsvExport() {
    const rows: string[][] = [
      ["Month", "Income (£)", "Expenses (£)", "Net (£)"],
      ...monthlyData.map((d) => [
        d.month,
        d.income.toFixed(2),
        d.expenses.toFixed(2),
        d.net.toFixed(2),
      ]),
    ];

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `income-expense-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Export button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleCsvExport}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            Income vs Expenses — Last 12 Months
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.every((d) => d.income === 0 && d.expenses === 0) ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No financial data for the last 12 months.
            </p>
          ) : (
            <IncomeExpenseTrendChart data={monthlyData} />
          )}
          {/* Legend */}
          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="block h-2 w-6 rounded-full bg-brand-primary/80" />
              Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="block h-2 w-6 rounded-full bg-brand-secondary/80" />
              Expenses
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No expense data yet.
            </p>
          ) : (
            <ExpenseCategoryChart data={categoryData} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
