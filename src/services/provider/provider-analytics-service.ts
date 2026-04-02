/**
 * provider-analytics-service.ts
 *
 * Analytics aggregation for the provider dashboard.
 * Reads from the provider_analytics_daily table and computes
 * period summaries, conversion funnel metrics, and earnings breakdowns.
 * All monetary values are in pence.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ConversionFunnel, ProviderAnalyticsDaily } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Period helper
// ---------------------------------------------------------------------------

type AnalyticsPeriod = "7d" | "30d" | "90d";

function startDateForPeriod(period: AnalyticsPeriod): string {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0] as string;
}

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export type ProfileViewsByDay = Readonly<{
  date: string; // YYYY-MM-DD
  views: number;
}>;

export type EarningsByMonth = Readonly<{
  month: string; // YYYY-MM
  earnings_pence: number;
}>;

export type TopCategory = Readonly<{
  category: string;
  bookings: number;
}>;

export type ProviderAnalyticsSummary = Readonly<{
  profile_views_total: number;
  profile_views_by_day: ProfileViewsByDay[];
  enquiry_rate_pct: number;
  conversion_by_stage: ConversionFunnel;
  earnings_by_month: EarningsByMonth[];
  top_categories: TopCategory[];
}>;

// ---------------------------------------------------------------------------
// getProviderAnalytics
// ---------------------------------------------------------------------------

/**
 * Returns aggregated analytics for the given provider over the requested period.
 *
 * Reads from provider_analytics_daily and computes:
 *  - profile_views_total: sum of profile_views
 *  - profile_views_by_day: daily breakdown
 *  - enquiry_rate_pct: (sum enquiries / sum profile_views) * 100, capped to 100
 *  - conversion_by_stage: ConversionFunnel aggregation
 *  - earnings_by_month: grouped by YYYY-MM
 *  - top_categories: placeholder (requires a separate bookings-by-category query)
 */
export async function getProviderAnalytics(
  supabase: SupabaseClient,
  providerId: string,
  period: AnalyticsPeriod,
): Promise<ProviderAnalyticsSummary> {
  const EMPTY: ProviderAnalyticsSummary = {
    profile_views_total: 0,
    profile_views_by_day: [],
    enquiry_rate_pct: 0,
    conversion_by_stage: { viewed: 0, enquired: 0, quoted: 0, booked: 0 },
    earnings_by_month: [],
    top_categories: [],
  };

  try {
    const startDate = startDateForPeriod(period);

    const { data, error } = await supabase
      .from("provider_analytics_daily")
      .select("*")
      .eq("provider_id", providerId)
      .gte("date", startDate)
      .order("date", { ascending: true });

    if (error || !data) return EMPTY;

    const rows = data as ProviderAnalyticsDaily[];

    // -- profile_views_total
    const profile_views_total = rows.reduce((sum, r) => sum + r.profile_views, 0);

    // -- profile_views_by_day
    const profile_views_by_day: ProfileViewsByDay[] = rows.map((r) => ({
      date: r.date,
      views: r.profile_views,
    }));

    // -- enquiry_rate_pct
    const totalEnquiries = rows.reduce((sum, r) => sum + r.enquiries_received, 0);
    const enquiry_rate_pct =
      profile_views_total > 0
        ? Math.min(100, Math.round((totalEnquiries / profile_views_total) * 100 * 100) / 100)
        : 0;

    // -- conversion_by_stage
    const conversion_by_stage = await getConversionFunnel(supabase, providerId, period, rows);

    // -- earnings_by_month (group by YYYY-MM)
    const earningsMap = new Map<string, number>();
    for (const row of rows) {
      const month = row.date.slice(0, 7); // YYYY-MM
      earningsMap.set(month, (earningsMap.get(month) ?? 0) + row.earnings_pence);
    }
    const earnings_by_month: EarningsByMonth[] = Array.from(earningsMap.entries())
      .map(([month, earnings_pence]) => ({ month, earnings_pence }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // -- top_categories: requires bookings data; not available in analytics_daily
    // TODO: query provider_bookings joined to provider_services for category breakdown
    const top_categories: TopCategory[] = [];

    return {
      profile_views_total,
      profile_views_by_day,
      enquiry_rate_pct,
      conversion_by_stage,
      earnings_by_month,
      top_categories,
    };
  } catch {
    return EMPTY;
  }
}

// ---------------------------------------------------------------------------
// getConversionFunnel
// ---------------------------------------------------------------------------

/**
 * Returns ConversionFunnel { viewed, enquired, quoted, booked } by summing
 * columns from provider_analytics_daily for the given period.
 *
 * Accepts an optional pre-fetched rows array to avoid a duplicate DB call
 * when called from getProviderAnalytics.
 */
export async function getConversionFunnel(
  supabase: SupabaseClient,
  providerId: string,
  period: AnalyticsPeriod,
  rows?: ProviderAnalyticsDaily[],
): Promise<ConversionFunnel> {
  let dailyRows: ProviderAnalyticsDaily[];

  if (rows) {
    dailyRows = rows;
  } else {
    const startDate = startDateForPeriod(period);
    const { data, error } = await supabase
      .from("provider_analytics_daily")
      .select("profile_views, enquiries_received, quotes_sent, bookings_won")
      .eq("provider_id", providerId)
      .gte("date", startDate);

    if (error || !data) return { viewed: 0, enquired: 0, quoted: 0, booked: 0 };
    dailyRows = data as ProviderAnalyticsDaily[];
  }

  const viewed = dailyRows.reduce((sum, r) => sum + r.profile_views, 0);
  const enquired = dailyRows.reduce((sum, r) => sum + r.enquiries_received, 0);
  const quoted = dailyRows.reduce((sum, r) => sum + r.quotes_sent, 0);
  const booked = dailyRows.reduce((sum, r) => sum + r.bookings_won, 0);

  return { viewed, enquired, quoted, booked };
}
