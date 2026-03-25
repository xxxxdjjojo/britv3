/**
 * 9.29 Portfolio Analytics — portfolio-wide charts from real data.
 * Server Component: fetches KPIs, financial entries, and portfolio properties,
 * then passes data to PortfolioAnalyticsCharts (client component).
 */

import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { getPortfolioKPIs, getPortfolioProperties } from "@/services/landlord/portfolio-service";
import { getFinancialEntries } from "@/services/landlord/financial-service";
import { calculateYield } from "@/lib/yield-calculator";

const PortfolioAnalyticsCharts = dynamic(
  () => import("@/components/landlord/PortfolioAnalyticsCharts"),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

export default async function PortfolioAnalyticsPage() {
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
  // getFinancialEntries requires propertyId — use the first property or fetch all
  // We aggregate via a direct query for portfolio-wide analytics
  let entries: Awaited<ReturnType<typeof getFinancialEntries>> = [];
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Portfolio-wide: query all financial entries for landlord's properties
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
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portfolio Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Charts and KPIs across your entire rental portfolio.
        </p>
      </div>

      {/* Portfolio KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Income</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{formatGBP(totalIncome)}</p>
          <p className="text-xs text-gray-500">Last 12 months</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Expenses</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{formatGBP(totalExpenses)}</p>
          <p className="text-xs text-gray-500">Last 12 months</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Net Cashflow</p>
          <p className={`mt-1 text-2xl font-bold ${netCashflow >= 0 ? "text-green-700" : "text-red-600"}`}>
            {formatGBP(netCashflow)}
          </p>
          <p className="text-xs text-gray-500">Income minus expenses</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Avg Gross Yield</p>
          <p className="mt-1 text-2xl font-bold text-[#1B4D3E]">
            {avgYield ? `${avgYield.grossYield}%` : "\u2014"}
          </p>
          <p className="text-xs text-gray-500">Across portfolio</p>
        </div>
      </div>

      <PortfolioAnalyticsCharts
        kpis={kpis}
        entries={entries}
        properties={properties}
      />
    </div>
  );
}
