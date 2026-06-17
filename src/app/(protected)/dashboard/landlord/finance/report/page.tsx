/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IncomeExpenseReportClient } from "./IncomeExpenseReportClient";
import type { FinancialEntry } from "@/types/landlord";

/**
 * 9.19 Income & Expense Report — Server Component
 *
 * Fetches all financial_entries for the authenticated landlord, aggregates
 * by month and category, then renders Recharts charts via client wrapper.
 */

type MonthlyDataPoint = {
  month: string;
  income: number;
  expenses: number;
  net: number;
};

type CategoryDataPoint = {
  category: string;
  amount: number;
};

type PropertySummary = {
  property_id: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
};

function formatCategory(cat: string) {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function IncomeExpenseReportPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all financial entries for this landlord
  const { data: rawEntries, error } = await supabase
    .from("financial_entries")
    .select("*, properties(address_line1, city, postcode, id)")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: true });

  if (error) {
    console.error("Failed to load financial entries:", error.message);
  }

  const entries = (rawEntries ?? []) as (FinancialEntry & {
    properties: { address_line1: string; city: string; postcode: string; id: string } | null;
  })[];

  // -- Build monthly trend data (last 12 months) ------------------------------

  const now = new Date();
  const monthlyMap = new Map<string, { income: number; expenses: number }>();

  // Initialise 12 months (oldest to newest)
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    });
    monthlyMap.set(key, { income: 0, expenses: 0 });
  }

  for (const entry of entries) {
    const d = new Date(entry.entry_date);
    const key = d.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    });
    if (monthlyMap.has(key)) {
      const m = monthlyMap.get(key)!;
      if (entry.type === "income") m.income += entry.amount;
      else if (entry.type === "expense") m.expenses += entry.amount;
    }
  }

  const monthlyData: MonthlyDataPoint[] = [...monthlyMap.entries()].map(
    ([month, { income, expenses }]) => ({
      month,
      income,
      expenses,
      net: income - expenses,
    }),
  );

  // -- Build category breakdown (expenses only) -------------------------------

  const categoryMap = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type === "expense") {
      categoryMap.set(
        entry.category,
        (categoryMap.get(entry.category) ?? 0) + entry.amount,
      );
    }
  }

  const categoryData: CategoryDataPoint[] = [...categoryMap.entries()]
    .map(([category, amount]) => ({
      category: formatCategory(category),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  // -- Build property summary table -------------------------------------------

  const propertyMap = new Map<
    string,
    { label: string; income: number; expenses: number }
  >();

  for (const entry of entries) {
    const label = entry.properties
      ? `${entry.properties.address_line1}, ${entry.properties.city}`
      : entry.property_id.slice(0, 8) + "…";

    if (!propertyMap.has(entry.property_id)) {
      propertyMap.set(entry.property_id, {
        label,
        income: 0,
        expenses: 0,
      });
    }

    const p = propertyMap.get(entry.property_id)!;
    if (entry.type === "income") p.income += entry.amount;
    else if (entry.type === "expense") p.expenses += entry.amount;
  }

  const propertySummaries: PropertySummary[] = [...propertyMap.entries()].map(
    ([property_id, { label, income, expenses }]) => ({
      property_id,
      label,
      income,
      expenses,
      net: income - expenses,
    }),
  );

  const gbpFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/landlord">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/landlord/finance/expenses">Finances</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Income &amp; Expense Report</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Income &amp; Expense Report
        </h1>
        <p className="text-sm text-muted-foreground">
          12-month trend and category breakdown across all your properties.
        </p>
      </div>

      {/* Client section — charts + CSV export */}
      <IncomeExpenseReportClient
        monthlyData={monthlyData}
        categoryData={categoryData}
      />

      {/* Property summary table (static server-rendered) */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Summary by Property</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propertySummaries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No financial data yet. Add entries in the Expense Tracker.
                  </TableCell>
                </TableRow>
              ) : (
                propertySummaries.map((ps) => (
                  <TableRow key={ps.property_id}>
                    <TableCell className="font-medium">{ps.label}</TableCell>
                    <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">
                      {gbpFormatter.format(ps.income)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                      {gbpFormatter.format(ps.expenses)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums font-bold ${
                        ps.net >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {gbpFormatter.format(ps.net)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
