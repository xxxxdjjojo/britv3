/**
 * analytics-service.ts — listing analytics aggregation
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingAnalyticsSummary, AnalyticsEventType } from "@/types/seller";

export async function getListingAnalyticsSummary(
  supabase: SupabaseClient,
  listingId: string,
  days = 30,
): Promise<ListingAnalyticsSummary> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("listing_analytics_events")
    .select("event_type, occurred_at")
    .eq("listing_id", listingId)
    .gte("occurred_at", since.toISOString())
    .order("occurred_at", { ascending: true });

  if (error) throw error;
  const rows = data ?? [];

  const counts = {
    view: 0, save: 0, enquiry: 0, phone_click: 0, email_click: 0,
  } as Record<AnalyticsEventType, number>;
  const dailyMap: Record<string, number> = {};

  for (const row of rows) {
    counts[row.event_type as AnalyticsEventType] = (counts[row.event_type as AnalyticsEventType] ?? 0) + 1;
    if (row.event_type === "view") {
      const day = row.occurred_at.split("T")[0];
      dailyMap[day] = (dailyMap[day] ?? 0) + 1;
    }
  }

  return {
    listing_id: listingId,
    total_views: counts.view,
    total_saves: counts.save,
    total_enquiries: counts.enquiry,
    total_phone_clicks: counts.phone_click,
    total_email_clicks: counts.email_click,
    ctr: counts.view === 0 ? 0 : Math.round((counts.enquiry / counts.view) * 10000) / 100,
    daily_views: Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
  };
}

export async function recordAnalyticsEvent(
  supabase: SupabaseClient,
  listingId: string,
  eventType: AnalyticsEventType,
  fingerprint?: string,
): Promise<void> {
  const { error } = await supabase.from("listing_analytics_events").insert({
    listing_id: listingId,
    event_type: eventType,
    visitor_fingerprint: fingerprint ?? null,
  });
  if (error) throw error;
}
