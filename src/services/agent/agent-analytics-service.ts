/**
 * Agent analytics service -- performance reports, competitor analysis,
 * vendor reports, and market appraisals.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentVendorReport, ReportType } from "@/types/agent";

// -- Types --------------------------------------------------------------------

export type PerformanceReport = Readonly<{
  listings_sold: number;
  avg_time_on_market_days: number;
  total_revenue: number;
  conversion_rate: number;
  avg_rating: number;
}>;

export type CompetitorEntry = Readonly<{
  agent_id: string;
  listing_count: number;
  avg_price: number;
  market_share: number;
}>;

export type MarketAppraisalData = Readonly<{
  comparables: Array<{
    id: string;
    price: number;
    sold_at: string | null;
    address: string | null;
  }>;
  suggested_range: { low: number; mid: number; high: number };
}>;

// -- Service functions --------------------------------------------------------

/**
 * Aggregate performance metrics for an agent over a date range.
 */
export async function getAgentPerformanceReport(
  supabase: SupabaseClient,
  agentId: string,
  dateRange?: { start: string; end: string },
): Promise<PerformanceReport> {
  // Listings sold
  let soldQuery = supabase
    .from("agent_listings")
    .select("id, created_at, updated_at", { count: "exact" })
    .eq("agent_id", agentId)
    .eq("status", "sold");

  if (dateRange) {
    soldQuery = soldQuery
      .gte("updated_at", dateRange.start)
      .lte("updated_at", dateRange.end);
  }

  const { data: soldListings, count: soldCount, error: soldErr } =
    await soldQuery;

  if (soldErr) {
    throw new Error(`Failed to fetch sold listings: ${soldErr.message}`);
  }

  // Average time on market (days between created_at and updated_at for sold)
  let avgTimeOnMarket = 0;
  if (soldListings && soldListings.length > 0) {
    const totalDays = soldListings.reduce((sum, l) => {
      const row = l as Record<string, string>;
      const created = new Date(row.created_at).getTime();
      const updated = new Date(row.updated_at).getTime();
      return sum + (updated - created) / (1000 * 60 * 60 * 24);
    }, 0);
    avgTimeOnMarket = Math.round(totalDays / soldListings.length);
  }

  // Total revenue from commissions
  let commissionQuery = supabase
    .from("agent_commissions")
    .select("commission_amount")
    .eq("agent_id", agentId);

  if (dateRange) {
    commissionQuery = commissionQuery
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end);
  }

  const { data: commissions, error: commErr } = await commissionQuery;

  if (commErr) {
    throw new Error(`Failed to fetch commissions: ${commErr.message}`);
  }

  const totalRevenue = (commissions ?? []).reduce(
    (sum, c) =>
      sum + ((c as Record<string, unknown>).commission_amount as number),
    0,
  );

  // Conversion rate: leads that reached 'closed' / total leads
  let leadsQuery = supabase
    .from("agent_leads")
    .select("stage", { count: "exact" })
    .eq("agent_id", agentId);

  if (dateRange) {
    leadsQuery = leadsQuery
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end);
  }

  const { data: leads, count: totalLeads, error: leadErr } = await leadsQuery;

  if (leadErr) {
    throw new Error(`Failed to fetch leads: ${leadErr.message}`);
  }

  const closedLeads = (leads ?? []).filter(
    (l) => (l as Record<string, unknown>).stage === "closed",
  ).length;
  const conversionRate =
    totalLeads && totalLeads > 0 ? closedLeads / totalLeads : 0;

  // Average rating from viewing feedback
  const { data: feedback, error: fbErr } = await supabase
    .from("agent_viewing_feedback")
    .select("interest_level")
    .eq("agent_id", agentId);

  if (fbErr) {
    throw new Error(`Failed to fetch feedback: ${fbErr.message}`);
  }

  let avgRating = 0;
  if (feedback && feedback.length > 0) {
    const totalRating = feedback.reduce(
      (sum, f) =>
        sum + ((f as Record<string, unknown>).interest_level as number),
      0,
    );
    avgRating = Math.round((totalRating / feedback.length) * 10) / 10;
  }

  return {
    listings_sold: soldCount ?? 0,
    avg_time_on_market_days: avgTimeOnMarket,
    total_revenue: totalRevenue,
    conversion_rate: Math.round(conversionRate * 100) / 100,
    avg_rating: avgRating,
  };
}

/**
 * Performance report scoped to a specific branch via team member IDs.
 */
export async function getBranchPerformanceReport(
  supabase: SupabaseClient,
  agentId: string,
  branchId: string,
): Promise<PerformanceReport> {
  // Get team member IDs for this branch
  const { data: members, error: memberErr } = await supabase
    .from("agent_team_members")
    .select("user_id")
    .eq("agent_id", agentId)
    .eq("branch_id", branchId)
    .neq("status", "inactive");

  if (memberErr) {
    throw new Error(`Failed to fetch branch members: ${memberErr.message}`);
  }

  const memberIds = (members ?? []).map(
    (m) => (m as Record<string, unknown>).user_id as string,
  );

  // If no members, return zeroed report
  if (memberIds.length === 0) {
    return {
      listings_sold: 0,
      avg_time_on_market_days: 0,
      total_revenue: 0,
      conversion_rate: 0,
      avg_rating: 0,
    };
  }

  // Listings sold by branch members
  const { data: soldListings, count: soldCount, error: soldErr } =
    await supabase
      .from("agent_listings")
      .select("id, created_at, updated_at", { count: "exact" })
      .eq("agent_id", agentId)
      .eq("status", "sold")
      .in("assigned_to", memberIds);

  if (soldErr) {
    throw new Error(`Failed to fetch branch sold listings: ${soldErr.message}`);
  }

  let avgTimeOnMarket = 0;
  if (soldListings && soldListings.length > 0) {
    const totalDays = soldListings.reduce((sum, l) => {
      const row = l as Record<string, string>;
      const created = new Date(row.created_at).getTime();
      const updated = new Date(row.updated_at).getTime();
      return sum + (updated - created) / (1000 * 60 * 60 * 24);
    }, 0);
    avgTimeOnMarket = Math.round(totalDays / soldListings.length);
  }

  // Commissions for branch members
  const { data: commissions, error: commErr } = await supabase
    .from("agent_commissions")
    .select("commission_amount")
    .eq("agent_id", agentId);

  if (commErr) {
    throw new Error(`Failed to fetch branch commissions: ${commErr.message}`);
  }

  const totalRevenue = (commissions ?? []).reduce(
    (sum, c) =>
      sum + ((c as Record<string, unknown>).commission_amount as number),
    0,
  );

  // Leads assigned to branch members
  const { data: leads, count: totalLeads, error: leadErr } = await supabase
    .from("agent_leads")
    .select("stage", { count: "exact" })
    .eq("agent_id", agentId)
    .in("assigned_to", memberIds);

  if (leadErr) {
    throw new Error(`Failed to fetch branch leads: ${leadErr.message}`);
  }

  const closedLeads = (leads ?? []).filter(
    (l) => (l as Record<string, unknown>).stage === "closed",
  ).length;
  const conversionRate =
    totalLeads && totalLeads > 0 ? closedLeads / totalLeads : 0;

  return {
    listings_sold: soldCount ?? 0,
    avg_time_on_market_days: avgTimeOnMarket,
    total_revenue: totalRevenue,
    conversion_rate: Math.round(conversionRate * 100) / 100,
    avg_rating: 0, // branch-level rating not scoped
  };
}

/**
 * Competitor analysis: group listings by agent in a postcode district.
 */
export async function getCompetitorAnalysis(
  supabase: SupabaseClient,
  agentId: string,
  area: string,
): Promise<CompetitorEntry[]> {
  // Fetch all listings in the same postcode district
  const { data: listings, error } = await supabase
    .from("agent_listings")
    .select("agent_id, price")
    .ilike("postcode", `${area}%`);

  if (error) {
    throw new Error(`Failed to fetch competitor listings: ${error.message}`);
  }

  if (!listings || listings.length === 0) {
    return [];
  }

  // Group by agent_id
  const agentMap = new Map<
    string,
    { count: number; totalPrice: number }
  >();
  const totalListings = listings.length;

  for (const l of listings) {
    const row = l as Record<string, unknown>;
    const aid = row.agent_id as string;
    const price = (row.price as number) ?? 0;
    const entry = agentMap.get(aid) ?? { count: 0, totalPrice: 0 };
    entry.count += 1;
    entry.totalPrice += price;
    agentMap.set(aid, entry);
  }

  return Array.from(agentMap.entries()).map(([aid, stats]) => ({
    agent_id: aid,
    listing_count: stats.count,
    avg_price:
      stats.count > 0 ? Math.round(stats.totalPrice / stats.count) : 0,
    market_share:
      Math.round((stats.count / totalListings) * 100 * 10) / 10,
  }));
}

/**
 * Generate a vendor report for a specific property.
 */
export async function generateVendorReport(
  supabase: SupabaseClient,
  agentId: string,
  propertyId: string,
  reportType: ReportType,
): Promise<AgentVendorReport> {
  // Aggregate property data
  const { data: viewings, error: viewErr } = await supabase
    .from("agent_viewing_slots")
    .select("*")
    .eq("agent_id", agentId)
    .eq("property_id", propertyId);

  if (viewErr) {
    throw new Error(`Failed to fetch viewings for report: ${viewErr.message}`);
  }

  const { data: offers, error: offerErr } = await supabase
    .from("agent_offers")
    .select("*")
    .eq("agent_id", agentId)
    .eq("property_id", propertyId);

  if (offerErr) {
    throw new Error(`Failed to fetch offers for report: ${offerErr.message}`);
  }

  const reportData: Record<string, unknown> = {
    property_id: propertyId,
    report_type: reportType,
    total_viewings: (viewings ?? []).length,
    booked_viewings: (viewings ?? []).filter(
      (v) => (v as Record<string, unknown>).is_booked,
    ).length,
    total_offers: (offers ?? []).length,
    generated_at: new Date().toISOString(),
  };

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

  if (error) {
    throw new Error(`Failed to generate vendor report: ${error.message}`);
  }

  return data as AgentVendorReport;
}

/**
 * Market appraisal: fetch comparables in the same postcode area
 * and compute a suggested price range.
 */
export async function getMarketAppraisalData(
  supabase: SupabaseClient,
  postcode: string,
): Promise<MarketAppraisalData> {
  // Fetch sold listings in same postcode district for comparables
  const district = postcode.split(" ")[0]; // e.g. "SW1A" from "SW1A 1AA"

  const { data: listings, error } = await supabase
    .from("agent_listings")
    .select("id, price, updated_at, address_line_1")
    .ilike("postcode", `${district}%`)
    .eq("status", "sold")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(
      `Failed to fetch comparable listings: ${error.message}`,
    );
  }

  const comparables = (listings ?? []).map((l) => {
    const row = l as Record<string, unknown>;
    return {
      id: row.id as string,
      price: (row.price as number) ?? 0,
      sold_at: (row.updated_at as string) ?? null,
      address: (row.address_line_1 as string) ?? null,
    };
  });

  // Compute suggested range from comparable prices
  const prices = comparables.map((c) => c.price).filter((p) => p > 0);

  if (prices.length === 0) {
    return {
      comparables,
      suggested_range: { low: 0, mid: 0, high: 0 },
    };
  }

  prices.sort((a, b) => a - b);
  const mid =
    prices.length % 2 === 0
      ? Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2)
      : prices[Math.floor(prices.length / 2)];

  const low = Math.round(mid * 0.9);
  const high = Math.round(mid * 1.1);

  return {
    comparables,
    suggested_range: { low, mid, high },
  };
}
