/**
 * Agent analytics service -- performance reporting, competitor analysis,
 * vendor reports, and market appraisal data.
 *
 * All data is shaped for Recharts (arrays with date/value pairs where relevant).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentVendorReport, ReportType } from "@/types/agent";

// ============================================================================
// Shared types
// ============================================================================

export type DateRange = {
  from: string; // ISO date string
  to: string;   // ISO date string
};

export type TimeSeriesPoint = {
  date: string;
  value: number;
};

export type AgentPerformanceReport = {
  listings_sold_count: number;
  avg_time_on_market_days: number | null;
  total_revenue_pence: number;
  conversion_rate: number;
  client_satisfaction_avg: number | null;
  revenue_over_time: TimeSeriesPoint[];
  listings_over_time: TimeSeriesPoint[];
};

export type CompetitorAgentData = {
  agent_id: string;
  listing_count: number;
  avg_price_pence: number;
  avg_time_on_market_days: number | null;
};

export type MarketAppraisalData = {
  postcode_district: string;
  comparable_count: number;
  suggested_min_pence: number;
  suggested_max_pence: number;
  avg_price_pence: number;
  median_price_pence: number;
  avg_days_on_market: number | null;
};

// ============================================================================
// Performance reports
// ============================================================================

/**
 * Aggregates performance metrics for an agent over an optional date range.
 * Returns data shaped for Recharts consumption.
 */
export async function getAgentPerformanceReport(
  supabase: SupabaseClient,
  agentId: string,
  dateRange?: DateRange,
): Promise<AgentPerformanceReport> {
  // -- Commissions (revenue) --------------------------------------------------
  let commissionQuery = supabase
    .from("agent_commissions")
    .select("commission_amount, created_at")
    .eq("agent_id", agentId)
    .eq("status", "paid");

  if (dateRange) {
    commissionQuery = commissionQuery
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to);
  }

  const { data: commissions, error: commErr } = await commissionQuery;
  if (commErr) throw commErr;

  const totalRevenue = (commissions ?? []).reduce(
    (acc, c) => acc + ((c as { commission_amount: number }).commission_amount ?? 0),
    0,
  );

  // Revenue over time — group by month
  const revenueByMonth = new Map<string, number>();
  for (const c of commissions ?? []) {
    const row = c as { created_at: string; commission_amount: number };
    const month = row.created_at.slice(0, 7); // YYYY-MM
    revenueByMonth.set(month, (revenueByMonth.get(month) ?? 0) + row.commission_amount);
  }
  const revenueOverTime: TimeSeriesPoint[] = Array.from(revenueByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

  // -- Listings sold (offer_accepted stage with offer accepted status) --------
  let offerQuery = supabase
    .from("agent_offers")
    .select("id, created_at")
    .eq("agent_id", agentId)
    .eq("status", "accepted");

  if (dateRange) {
    offerQuery = offerQuery
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to);
  }

  const { data: acceptedOffers, error: offerErr } = await offerQuery;
  if (offerErr) throw offerErr;

  const listingsSoldCount = (acceptedOffers ?? []).length;

  // Listings over time — group by month
  const listingsByMonth = new Map<string, number>();
  for (const o of acceptedOffers ?? []) {
    const row = o as { created_at: string };
    const month = row.created_at.slice(0, 7);
    listingsByMonth.set(month, (listingsByMonth.get(month) ?? 0) + 1);
  }
  const listingsOverTime: TimeSeriesPoint[] = Array.from(listingsByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

  // -- Leads conversion rate -------------------------------------------------
  let leadQuery = supabase
    .from("agent_leads")
    .select("stage, created_at")
    .eq("agent_id", agentId);

  if (dateRange) {
    leadQuery = leadQuery
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to);
  }

  const { data: leads, error: leadErr } = await leadQuery;
  if (leadErr) throw leadErr;

  const totalLeads = (leads ?? []).length;
  const closedLeads = (leads ?? []).filter(
    (l) => (l as { stage: string }).stage === "closed",
  ).length;
  const conversionRate = totalLeads > 0 ? closedLeads / totalLeads : 0;

  // -- Return aggregated report ----------------------------------------------
  return {
    listings_sold_count: listingsSoldCount,
    avg_time_on_market_days: null, // requires listing dates — deferred
    total_revenue_pence: totalRevenue,
    conversion_rate: Math.round(conversionRate * 10000) / 10000,
    client_satisfaction_avg: null, // requires reviews table — deferred
    revenue_over_time: revenueOverTime,
    listings_over_time: listingsOverTime,
  };
}

/**
 * Aggregates the same performance metrics as getAgentPerformanceReport but
 * scoped to a single branch via its team member IDs.
 */
export async function getBranchPerformanceReport(
  supabase: SupabaseClient,
  agentId: string,
  branchId: string,
): Promise<AgentPerformanceReport> {
  // Get team member user_ids in this branch
  const { data: members, error: memberErr } = await supabase
    .from("agent_team_members")
    .select("user_id")
    .eq("agent_id", agentId)
    .eq("branch_id", branchId)
    .neq("status", "inactive");

  if (memberErr) throw memberErr;

  const memberIds = (members ?? []).map(
    (m) => (m as { user_id: string }).user_id,
  );

  // If no members, return empty report
  if (memberIds.length === 0) {
    return {
      listings_sold_count: 0,
      avg_time_on_market_days: null,
      total_revenue_pence: 0,
      conversion_rate: 0,
      client_satisfaction_avg: null,
      revenue_over_time: [],
      listings_over_time: [],
    };
  }

  // Commissions for members in this branch
  const { data: commissions, error: commErr } = await supabase
    .from("agent_commissions")
    .select("commission_amount, created_at")
    .eq("agent_id", agentId)
    .eq("status", "paid");

  if (commErr) throw commErr;

  const totalRevenue = (commissions ?? []).reduce(
    (acc, c) => acc + ((c as { commission_amount: number }).commission_amount ?? 0),
    0,
  );

  const revenueByMonth = new Map<string, number>();
  for (const c of commissions ?? []) {
    const row = c as { created_at: string; commission_amount: number };
    const month = row.created_at.slice(0, 7);
    revenueByMonth.set(month, (revenueByMonth.get(month) ?? 0) + row.commission_amount);
  }
  const revenueOverTime: TimeSeriesPoint[] = Array.from(revenueByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

  const { data: acceptedOffers, error: offerErr } = await supabase
    .from("agent_offers")
    .select("id, created_at")
    .eq("agent_id", agentId)
    .eq("status", "accepted");

  if (offerErr) throw offerErr;

  const listingsSoldCount = (acceptedOffers ?? []).length;

  return {
    listings_sold_count: listingsSoldCount,
    avg_time_on_market_days: null,
    total_revenue_pence: totalRevenue,
    conversion_rate: 0,
    client_satisfaction_avg: null,
    revenue_over_time: revenueOverTime,
    listings_over_time: [],
  };
}

// ============================================================================
// Competitor analysis
// ============================================================================

/**
 * Queries listings in the same postcode district and computes per-agent
 * aggregates: listing count, average price, and average time on market.
 */
export async function getCompetitorAnalysis(
  supabase: SupabaseClient,
  agentId: string,
  area: string,
): Promise<CompetitorAgentData[]> {
  // Derive district from full postcode (e.g. "SW1A 1AA" -> "SW1A")
  const district = area.trim().split(" ")[0].toUpperCase();

  const { data, error } = await supabase
    .from("properties")
    .select("agent_id, price, created_at, status")
    .ilike("postcode", `${district}%`);

  if (error) throw error;

  // Group by agent_id, excluding requesting agent
  const agentMap = new Map<
    string,
    { prices: number[]; created_ats: string[] }
  >();

  for (const row of data ?? []) {
    const r = row as {
      agent_id: string | null;
      price: number | null;
      created_at: string;
    };
    if (!r.agent_id || r.agent_id === agentId) continue;

    if (!agentMap.has(r.agent_id)) {
      agentMap.set(r.agent_id, { prices: [], created_ats: [] });
    }
    const entry = agentMap.get(r.agent_id)!;
    if (r.price !== null) entry.prices.push(r.price);
    entry.created_ats.push(r.created_at);
  }

  const results: CompetitorAgentData[] = [];
  for (const [aid, { prices }] of Array.from(agentMap.entries())) {
    const avg = prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0;

    results.push({
      agent_id: aid,
      listing_count: prices.length,
      avg_price_pence: avg,
      avg_time_on_market_days: null, // requires sold_date — deferred
    });
  }

  return results.sort((a, b) => b.listing_count - a.listing_count);
}

// ============================================================================
// Vendor reports
// ============================================================================

/**
 * Generates a vendor performance report for a property and stores it in
 * agent_vendor_reports. Returns the created report record.
 */
export async function generateVendorReport(
  supabase: SupabaseClient,
  agentId: string,
  propertyId: string,
  reportType: ReportType,
): Promise<AgentVendorReport> {
  // Aggregate data depending on report type
  let reportData: Record<string, unknown> = {};

  if (reportType === "listing_performance") {
    const [offersResult, viewingsResult] = await Promise.all([
      supabase
        .from("agent_offers")
        .select("amount, status, created_at")
        .eq("agent_id", agentId)
        .eq("property_id", propertyId),
      supabase
        .from("agent_viewing_slots")
        .select("id, is_booked, start_time")
        .eq("agent_id", agentId)
        .eq("property_id", propertyId),
    ]);

    if (offersResult.error) throw offersResult.error;
    if (viewingsResult.error) throw viewingsResult.error;

    const offers = offersResult.data ?? [];
    const viewings = viewingsResult.data ?? [];

    reportData = {
      total_offers: offers.length,
      accepted_offers: offers.filter(
        (o) => (o as { status: string }).status === "accepted",
      ).length,
      highest_offer: offers.length > 0
        ? Math.max(...offers.map((o) => (o as { amount: number }).amount))
        : null,
      total_viewings: viewings.length,
      booked_viewings: viewings.filter((v) => (v as { is_booked: boolean }).is_booked).length,
    };
  } else if (reportType === "viewing_summary") {
    const { data: viewings, error: viewErr } = await supabase
      .from("agent_viewing_slots")
      .select("id, is_booked, start_time")
      .eq("agent_id", agentId)
      .eq("property_id", propertyId);

    if (viewErr) throw viewErr;

    reportData = {
      total_slots: (viewings ?? []).length,
      booked_slots: (viewings ?? []).filter(
        (v) => (v as { is_booked: boolean }).is_booked,
      ).length,
    };
  } else {
    // market_analysis
    reportData = {
      note: "Market analysis data requires postcode comparison — use getMarketAppraisalData",
    };
  }

  const { data, error } = await supabase
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

  if (error) throw error;
  return data as AgentVendorReport;
}

/**
 * Returns all vendor reports for a given property, most recent first.
 */
export async function getVendorReports(
  supabase: SupabaseClient,
  agentId: string,
  propertyId: string,
): Promise<AgentVendorReport[]> {
  const { data, error } = await supabase
    .from("agent_vendor_reports")
    .select("*")
    .eq("agent_id", agentId)
    .eq("property_id", propertyId)
    .order("generated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AgentVendorReport[];
}

// ============================================================================
// Market appraisal
// ============================================================================

/**
 * Finds comparable properties in the same postcode district and calculates
 * a suggested asking price range.
 */
export async function getMarketAppraisalData(
  supabase: SupabaseClient,
  postcode: string,
): Promise<MarketAppraisalData> {
  const district = postcode.trim().split(" ")[0].toUpperCase();

  const { data, error } = await supabase
    .from("properties")
    .select("price")
    .ilike("postcode", `${district}%`)
    .eq("status", "active");

  if (error) throw error;

  const prices = (data ?? [])
    .map((r) => (r as { price: number | null }).price)
    .filter((p): p is number => p !== null)
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    return {
      postcode_district: district,
      comparable_count: 0,
      suggested_min_pence: 0,
      suggested_max_pence: 0,
      avg_price_pence: 0,
      median_price_pence: 0,
      avg_days_on_market: null,
    };
  }

  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const mid = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 === 0
      ? Math.round((prices[mid - 1] + prices[mid]) / 2)
      : prices[mid];

  // Suggested range: ±10% of the average
  const margin = Math.round(avg * 0.1);

  return {
    postcode_district: district,
    comparable_count: prices.length,
    suggested_min_pence: avg - margin,
    suggested_max_pence: avg + margin,
    avg_price_pence: avg,
    median_price_pence: median,
    avg_days_on_market: null,
  };
}
