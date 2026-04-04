/**
 * 9.29 Portfolio Analytics — portfolio-wide charts from real data.
 * Server Component: fetches KPIs, financial entries, and portfolio properties,
 * then passes data to PortfolioAnalyticsCharts (client component).
 */

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { getPortfolioKPIs, getPortfolioProperties } from "@/services/landlord/portfolio-service";
import { getFinancialEntries } from "@/services/landlord/financial-service";
import { calculateYield } from "@/lib/yield-calculator";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Building2, Wrench } from "lucide-react";

const PortfolioAnalyticsCharts = dynamic(
  () => import("@/components/landlord/PortfolioAnalyticsCharts"),
  { loading: () => <div className="h-64 animate-pulse rounded-2xl bg-muted" /> }
);


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

async function PageContent() {
  const supabase = await createClient();

  // Fetch data in parallel
  const [kpisResult, propertiesResult] = await Promise.allSettled([
    getPortfolioKPIs(supabase),
    getPortfolioProperties(supabase),
  ]);

  const kpis =
    kpisResult.status === "fulfilled"
      ? kpisResult.value
      : {
          total_properties: 0,
          occupied: 0,
          vacant: 0,
          occupancy_rate: 0,
          total_monthly_rent: 0,
          compliance_alerts: 0,
          open_maintenance: 0,
          expired_compliance: 0,
        };

  const properties =
    propertiesResult.status === "fulfilled" ? propertiesResult.value : [];

  // Fetch financial entries for all properties (portfolio-wide)
  let entries: Awaited<ReturnType<typeof getFinancialEntries>> = [];
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data } = await supabase
        .from("financial_entries")
        .select("*")
        .gte("entry_date", oneYearAgo.toISOString().slice(0, 10))
        .order("entry_date", { ascending: false });

      entries = (data ?? []) as typeof entries;
    }
  } catch {
    // Graceful degradation — charts render with empty data
  }

  // Compute portfolio KPI summary from financial entries
  const totalIncome = entries
    .filter(e => e.type === "income")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalExpenses = entries
    .filter(e => e.type === "expense")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const netCashflow = totalIncome - totalExpenses;

  // Compute average gross yield across portfolio using yield calculator
  const avgYield = properties.length > 0 && kpis.total_monthly_rent > 0
    ? calculateYield({
        propertyValue: kpis.total_monthly_rent * 12 * 20, // Estimated portfolio value
        monthlyRent: kpis.total_monthly_rent,
        monthlyManagementFee: 0,
        monthlyMaintenance: 0,
        monthlyInsurance: 0,
        monthlyMortgage: 0,
      })
    : null;

  const formatGBP = (value: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Landlord Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time performance metrics for your UK property portfolio.
          </p>
        </div>
      </div>

      {/* Portfolio KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Income */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Income
            </p>
            <span className="rounded-lg bg-success-light p-1.5 dark:bg-success/10">
              <TrendingUp className="size-3.5 text-success dark:text-success" />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-success dark:text-success">
            {formatGBP(totalIncome)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Last 12 months</p>
        </div>

        {/* Total Expenses */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Expenses
            </p>
            <span className="rounded-lg bg-error-light p-1.5 dark:bg-error/10">
              <TrendingDown className="size-3.5 text-error dark:text-error" />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-error dark:text-error">
            {formatGBP(totalExpenses)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Last 12 months</p>
        </div>

        {/* Net Cashflow */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Net Cashflow
            </p>
            <span className={`rounded-lg p-1.5 ${netCashflow >= 0 ? "bg-success-light dark:bg-success/10" : "bg-error-light dark:bg-error/10"}`}>
              {netCashflow >= 0
                ? <TrendingUp className="size-3.5 text-success dark:text-success" />
                : <TrendingDown className="size-3.5 text-error dark:text-error" />
              }
            </span>
          </div>
          <p className={`mt-3 font-heading text-2xl font-bold ${netCashflow >= 0 ? "text-success dark:text-success" : "text-error dark:text-error"}`}>
            {formatGBP(netCashflow)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Income minus expenses</p>
        </div>

        {/* Avg Gross Yield */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg Gross Yield
            </p>
            <span className="rounded-lg bg-brand-primary/10 p-1.5 dark:bg-primary/20">
              <Building2 className="size-3.5 text-brand-primary dark:text-primary" />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-brand-primary dark:text-primary">
            {avgYield ? `${avgYield.grossYield}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Across portfolio</p>
        </div>
      </div>

      {/* Maintenance alert if needed */}
      {kpis.open_maintenance > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-light p-4 dark:border-warning/20 dark:bg-warning/10">
          <Wrench className="size-4 shrink-0 text-warning dark:text-warning" />
          <p className="text-sm text-warning dark:text-warning">
            <span className="font-semibold">{kpis.open_maintenance}</span> open maintenance request{kpis.open_maintenance > 1 ? "s" : ""} across your portfolio
          </p>
        </div>
      )}

      {/* Charts */}
      <PortfolioAnalyticsCharts
        kpis={kpis}
        entries={entries}
        properties={properties}
      />
    </div>
  );
}

export default function PortfolioAnalyticsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
