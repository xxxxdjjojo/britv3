/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTaxSummary } from "@/services/landlord/financial-service";
import { TaxYearSelector } from "./TaxYearSelector";
import { TaxSummaryExportClient as TaxSummaryExport } from "./TaxSummaryExportClient";
import { AlertTriangle, ExternalLink } from "lucide-react";

/**
 * Current UK tax year calculation.
 * If today is on/after April 6, the tax year started this calendar year.
 * Otherwise it started last calendar year.
 */
function getCurrentTaxYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  const day = now.getDate();

  // UK tax year starts April 6
  if (month > 4 || (month === 4 && day >= 6)) {
    return year;
  }
  return year - 1;
}

function formatTaxYear(startYear: number): string {
  return `${startYear}/${String(startYear + 1).slice(2)}`;
}

type Props = {
  searchParams: Promise<{ year?: string }>;
};

/**
 * 9.20 Tax Summary — Server Component
 *
 * Shows income/expenses for the selected UK tax year (Apr 6 – Apr 5),
 * plus an informational estimated tax at basic rate (20%).
 * Exports via TaxSummaryExport (ssr:false).
 */
export default async function TaxSummaryPage({ searchParams }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const currentTaxYear = getCurrentTaxYear();
  const selectedYear = resolvedParams.year
    ? parseInt(resolvedParams.year, 10)
    : currentTaxYear;

  // Last 5 tax years for the selector
  const taxYearOptions = Array.from({ length: 5 }, (_, i) => currentTaxYear - i);

  // Fetch the summary via the service (UK Apr 6 boundary)
  const summary = await getTaxSummary(supabase, selectedYear).catch((err) => {
    console.error("getTaxSummary failed:", err.message);
    return { income: 0, expenses: 0, net: 0, tax_year: formatTaxYear(selectedYear) };
  });

  // Fetch income entries by property for the income breakdown table
  const startDate = `${selectedYear}-04-06`;
  const endDate = `${selectedYear + 1}-04-06`;

  const { data: incomeEntries } = await supabase
    .from("financial_entries")
    .select("*, properties(address_line1, city, postcode)")
    .eq("user_id", user.id)
    .eq("type", "income")
    .gte("entry_date", startDate)
    .lt("entry_date", endDate);

  const { data: expenseEntries } = await supabase
    .from("financial_entries")
    .select("property_id, category, amount")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .gte("entry_date", startDate)
    .lt("entry_date", endDate);

  // Build income-by-property breakdown
  type IncomeByProperty = Map<string, { label: string; total: number }>;
  const incomeByProperty: IncomeByProperty = new Map();

  for (const entry of incomeEntries ?? []) {
    const prop = entry.properties as {
      address_line1: string;
      city: string;
      postcode: string;
    } | null;
    const label = prop
      ? `${prop.address_line1}, ${prop.city}`
      : entry.property_id?.slice(0, 8) + "…";

    const key = entry.property_id ?? "unknown";
    if (!incomeByProperty.has(key)) {
      incomeByProperty.set(key, { label, total: 0 });
    }
    incomeByProperty.get(key)!.total += entry.amount ?? 0;
  }

  // Build expense-by-category breakdown
  const expenseByCategory = new Map<string, number>();
  for (const entry of expenseEntries ?? []) {
    const cat = entry.category ?? "other_expense";
    expenseByCategory.set(cat, (expenseByCategory.get(cat) ?? 0) + (entry.amount ?? 0));
  }

  const estimatedTax = summary.net > 0 ? summary.net * 0.2 : 0;

  const gbp = (n: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  function formatCategory(cat: string) {
    return cat
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Get landlord name for export
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name:display_name")
    .eq("id", user.id)
    .single();

  const landlordName = (profile?.full_name as string | null) ?? user.email ?? "Landlord";

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
            <BreadcrumbPage>Tax Summary</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Tax Summary
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            UK tax year {summary.tax_year} (6 April {selectedYear} – 5 April{" "}
            {selectedYear + 1})
          </p>
        </div>
        <TaxYearSelector
          currentYear={selectedYear}
          options={taxYearOptions}
        />
      </div>

      {/* Disclaimer banner */}
      <Alert className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-300">
          <strong>This is a summary for reference only.</strong> Consult a
          qualified tax professional before filing your Self Assessment return.
          The estimated tax figure is indicative only and does not account for
          personal allowances, higher rate thresholds, or mortgage interest
          restrictions.{" "}
          <a
            href="https://www.gov.uk/self-assessment-tax-returns"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline"
          >
            HMRC Self Assessment guidance
            <ExternalLink className="size-3" />
          </a>
        </AlertDescription>
      </Alert>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              {gbp(summary.income)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {gbp(summary.expenses)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                summary.net >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {gbp(summary.net)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-5">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Estimated Tax (20%)
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
              {gbp(estimatedTax)}
            </p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
              Indicative only
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export buttons */}
      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">
          Export for Self-Assessment
        </h2>
        <TaxSummaryExport
          summary={summary}
          taxYear={summary.tax_year}
          landlordName={landlordName}
        />
      </div>

      {/* Income breakdown by property */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Income by Property</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Total Rent Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeByProperty.size === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No income recorded for this tax year.
                  </TableCell>
                </TableRow>
              ) : (
                [...incomeByProperty.values()].map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>{p.label}</TableCell>
                    <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">
                      {gbp(p.total)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expense breakdown by category */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseByCategory.size === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No expenses recorded for this tax year.
                  </TableCell>
                </TableRow>
              ) : (
                [...expenseByCategory.entries()]
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amount]) => (
                    <TableRow key={cat}>
                      <TableCell>{formatCategory(cat)}</TableCell>
                      <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                        {gbp(amount)}
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
