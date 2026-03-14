/**
 * 9.29 Portfolio Analytics — portfolio-wide charts from real data.
 * Server Component: fetches KPIs, financial entries, and portfolio properties,
 * then passes data to PortfolioAnalyticsCharts (client component).
 */

import { createClient } from "@/lib/supabase/server";
import { getPortfolioKPIs, getPortfolioProperties } from "@/services/landlord/portfolio-service";
import { getFinancialEntries } from "@/services/landlord/financial-service";
import PortfolioAnalyticsCharts from "@/components/landlord/PortfolioAnalyticsCharts";

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

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portfolio Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Charts and KPIs across your entire rental portfolio.
        </p>
      </div>

      <PortfolioAnalyticsCharts
        kpis={kpis}
        entries={entries}
        properties={properties}
      />
    </div>
  );
}
