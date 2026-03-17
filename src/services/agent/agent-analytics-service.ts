/**
 * Agent analytics service.
 * Provides performance reports, competitor analysis, and market appraisal data.
 * All functions accept a Supabase client as first parameter for testability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type PerformanceReport = {
  listings_sold_count: number;
  avg_time_on_market_days: number;
  total_revenue: number;
  conversion_rate: number;
  client_satisfaction: number;
  listings_sold_per_month: Array<{ month: string; count: number }>;
  revenue_per_month: Array<{ month: string; amount: number }>;
};

export type CompetitorEntry = {
  agent_id: string;
  listing_count: number;
  avg_price: number;
  market_share_pct: number;
};

export type ComparableSale = {
  id: string;
  postcode: string;
  price: number;
  bedrooms: number | null;
  sold_at: string | null;
};

export type MarketAppraisalData = {
  comparable_sales: ComparableSale[];
  suggested_min_price: number;
  suggested_max_price: number;
  avg_price: number;
};

/**
 * Get an agent's performance report, optionally scoped to a date range.
 */
export async function getAgentPerformanceReport(
  supabase: SupabaseClient,
  agentId: string,
  dateRange?: { start: string; end: string },
): Promise<PerformanceReport> {
  // Query sold listings
  let listingsQuery = supabase
    .from("listings")
    .select("id, created_at, sold_at, price")
    .eq("user_id", agentId)
    .eq("status", "sold");

  if (dateRange) {
    listingsQuery = listingsQuery
      .gte("sold_at", dateRange.start)
      .lte("sold_at", dateRange.end);
  }

  const { data: soldListings } = await listingsQuery;
  const listings = soldListings ?? [];

  // Query commission revenue
  let commissionQuery = supabase
    .from("agent_commissions")
    .select("commission_amount, created_at")
    .eq("agent_id", agentId)
    .eq("status", "paid");

  if (dateRange) {
    commissionQuery = commissionQuery
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end);
  }

  const { data: commissions } = await commissionQuery;
  const commissionRows = commissions ?? [];

  // Query leads for conversion rate
  let leadsQuery = supabase
    .from("agent_leads")
    .select("id, stage")
    .eq("agent_id", agentId);

  if (dateRange) {
    leadsQuery = leadsQuery
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end);
  }

  const { data: leads } = await leadsQuery;
  const leadRows = leads ?? [];

  // Calculate metrics
  const listings_sold_count = listings.length;
  const total_revenue = commissionRows.reduce(
    (sum: number, c: Record<string, unknown>) =>
      sum + ((c.commission_amount as number) ?? 0),
    0,
  );

  // Average time on market (days between created_at and sold_at)
  const timesOnMarket = listings
    .filter(
      (l: Record<string, unknown>) => l.sold_at && l.created_at,
    )
    .map((l: Record<string, unknown>) => {
      const created = new Date(l.created_at as string).getTime();
      const sold = new Date(l.sold_at as string).getTime();
      return (sold - created) / (1000 * 60 * 60 * 24);
    });

  const avg_time_on_market_days =
    timesOnMarket.length > 0
      ? timesOnMarket.reduce((sum: number, t: number) => sum + t, 0) /
        timesOnMarket.length
      : 0;

  // Conversion rate: closed / total leads
  const closedLeads = leadRows.filter(
    (l: Record<string, unknown>) => l.stage === "closed",
  ).length;
  const conversion_rate =
    leadRows.length > 0 ? closedLeads / leadRows.length : 0;

  // Client satisfaction placeholder (would come from reviews table)
  const client_satisfaction = 0;

  // Group by month
  const soldByMonth: Record<string, number> = {};
  for (const listing of listings) {
    const l = listing as Record<string, unknown>;
    if (l.sold_at) {
      const month = (l.sold_at as string).substring(0, 7);
      soldByMonth[month] = (soldByMonth[month] ?? 0) + 1;
    }
  }

  const revenueByMonth: Record<string, number> = {};
  for (const commission of commissionRows) {
    const c = commission as Record<string, unknown>;
    const month = (c.created_at as string).substring(0, 7);
    revenueByMonth[month] =
      (revenueByMonth[month] ?? 0) + ((c.commission_amount as number) ?? 0);
  }

  const listings_sold_per_month = Object.entries(soldByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const revenue_per_month = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  return {
    listings_sold_count,
    avg_time_on_market_days,
    total_revenue,
    conversion_rate,
    client_satisfaction,
    listings_sold_per_month,
    revenue_per_month,
  };
}

/**
 * Get performance report scoped to a specific branch.
 * Looks up branch members then aggregates their metrics.
 */
export async function getBranchPerformanceReport(
  supabase: SupabaseClient,
  agentId: string,
  branchId: string,
): Promise<PerformanceReport> {
  // Get member user IDs for this branch
  const { data: members } = await supabase
    .from("agent_team_members")
    .select("user_id")
    .eq("agent_id", agentId)
    .eq("branch_id", branchId)
    .eq("status", "active");

  const memberIds = (members ?? []).map(
    (m: Record<string, unknown>) => m.user_id as string,
  );

  // If no members, return empty report
  if (memberIds.length === 0) {
    return {
      listings_sold_count: 0,
      avg_time_on_market_days: 0,
      total_revenue: 0,
      conversion_rate: 0,
      client_satisfaction: 0,
      listings_sold_per_month: [],
      revenue_per_month: [],
    };
  }

  // Query sold listings for all branch members
  const { data: soldListings } = await supabase
    .from("listings")
    .select("id, created_at, sold_at, price")
    .in("user_id", memberIds)
    .eq("status", "sold");

  const listings = soldListings ?? [];
  const listings_sold_count = listings.length;

  const timesOnMarket = listings
    .filter(
      (l: Record<string, unknown>) => l.sold_at && l.created_at,
    )
    .map((l: Record<string, unknown>) => {
      const created = new Date(l.created_at as string).getTime();
      const sold = new Date(l.sold_at as string).getTime();
      return (sold - created) / (1000 * 60 * 60 * 24);
    });

  const avg_time_on_market_days =
    timesOnMarket.length > 0
      ? timesOnMarket.reduce((sum: number, t: number) => sum + t, 0) /
        timesOnMarket.length
      : 0;

  // Query commissions
  const { data: commissions } = await supabase
    .from("agent_commissions")
    .select("commission_amount, created_at")
    .eq("agent_id", agentId)
    .eq("status", "paid");

  const commissionRows = commissions ?? [];
  const total_revenue = commissionRows.reduce(
    (sum: number, c: Record<string, unknown>) =>
      sum + ((c.commission_amount as number) ?? 0),
    0,
  );

  // Query leads for branch members
  const { data: leads } = await supabase
    .from("agent_leads")
    .select("id, stage")
    .eq("agent_id", agentId)
    .in("assigned_to", memberIds);

  const leadRows = leads ?? [];
  const closedLeads = leadRows.filter(
    (l: Record<string, unknown>) => l.stage === "closed",
  ).length;
  const conversion_rate =
    leadRows.length > 0 ? closedLeads / leadRows.length : 0;

  const soldByMonth: Record<string, number> = {};
  for (const listing of listings) {
    const l = listing as Record<string, unknown>;
    if (l.sold_at) {
      const month = (l.sold_at as string).substring(0, 7);
      soldByMonth[month] = (soldByMonth[month] ?? 0) + 1;
    }
  }

  const revenueByMonth: Record<string, number> = {};
  for (const commission of commissionRows) {
    const c = commission as Record<string, unknown>;
    const month = (c.created_at as string).substring(0, 7);
    revenueByMonth[month] =
      (revenueByMonth[month] ?? 0) + ((c.commission_amount as number) ?? 0);
  }

  return {
    listings_sold_count,
    avg_time_on_market_days,
    total_revenue,
    conversion_rate,
    client_satisfaction: 0,
    listings_sold_per_month: Object.entries(soldByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count })),
    revenue_per_month: Object.entries(revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount })),
  };
}

/**
 * Analyse competitor agents in a given area.
 * Groups listings by agent (user_id) and calculates market share.
 */
export async function getCompetitorAnalysis(
  supabase: SupabaseClient,
  agentId: string,
  area: string,
): Promise<CompetitorEntry[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("user_id, price, postcode")
    .ilike("postcode", `${area}%`);

  if (error) {
    throw new Error(`Failed to get competitor analysis: ${error.message}`);
  }

  const rows = (data ?? []) as Array<{
    user_id: string;
    price: number;
    postcode: string;
  }>;

  // Group by agent
  const grouped: Record<
    string,
    { listing_count: number; total_price: number }
  > = {};

  for (const row of rows) {
    if (!grouped[row.user_id]) {
      grouped[row.user_id] = { listing_count: 0, total_price: 0 };
    }
    grouped[row.user_id].listing_count += 1;
    grouped[row.user_id].total_price += row.price ?? 0;
  }

  const total_listings = rows.length;

  return Object.entries(grouped)
    .map(([agent_id, stats]) => ({
      agent_id,
      listing_count: stats.listing_count,
      avg_price:
        stats.listing_count > 0
          ? Math.round(stats.total_price / stats.listing_count)
          : 0,
      market_share_pct:
        total_listings > 0
          ? Math.round((stats.listing_count / total_listings) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.listing_count - a.listing_count);
}

/**
 * Generate a vendor report for a specific property.
 * Aggregates listing and viewing data, stores in agent_vendor_reports.
 */
export async function generateVendorReport(
  supabase: SupabaseClient,
  agentId: string,
  propertyId: string,
  reportType: string,
): Promise<Record<string, unknown>> {
  // Gather listing data
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("property_id", propertyId)
    .eq("user_id", agentId)
    .maybeSingle();

  // Gather viewing feedback
  const { data: viewings } = await supabase
    .from("agent_viewing_feedback")
    .select("*")
    .eq("agent_id", agentId);

  // Gather offers
  const { data: offers } = await supabase
    .from("agent_offers")
    .select("*")
    .eq("property_id", propertyId)
    .eq("agent_id", agentId);

  const reportData: Record<string, unknown> = {
    property_id: propertyId,
    report_type: reportType,
    listing,
    viewings_count: (viewings ?? []).length,
    offers_count: (offers ?? []).length,
    offers,
    generated_at: new Date().toISOString(),
  };

  const { data: savedReport, error } = await supabase
    .from("agent_vendor_reports")
    .insert({
      agent_id: agentId,
      property_id: propertyId,
      report_type: reportType,
      data: reportData,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to generate vendor report: ${error.message}`);
  }

  return savedReport as Record<string, unknown>;
}

/**
 * Get market appraisal data for a postcode.
 * Returns comparable sales and a suggested price range.
 */
export async function getMarketAppraisalData(
  supabase: SupabaseClient,
  postcode: string,
): Promise<MarketAppraisalData> {
  const postcodePrefix = postcode.substring(0, 4);

  const { data, error } = await supabase
    .from("listings")
    .select("id, postcode, price, bedrooms, sold_at")
    .ilike("postcode", `${postcodePrefix}%`)
    .eq("status", "sold")
    .order("sold_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Failed to get market appraisal data: ${error.message}`);
  }

  const comparables = (data ?? []) as ComparableSale[];
  const prices = comparables.map((c) => c.price ?? 0).filter((p) => p > 0);

  const avg_price =
    prices.length > 0
      ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
      : 0;

  const sorted = [...prices].sort((a, b) => a - b);
  const suggested_min_price =
    sorted.length > 0 ? Math.round(sorted[0] * 0.95) : 0;
  const suggested_max_price =
    sorted.length > 0
      ? Math.round(sorted[sorted.length - 1] * 1.05)
      : 0;

  return {
    comparable_sales: comparables,
    suggested_min_price,
    suggested_max_price,
    avg_price,
  };
}
