// Wave 0 stub — implemented in Plan 13-06
// Covers: SELL-04 (analytics aggregation groups events by day correctly)
import { describe, it } from "vitest";

describe("Analytics Service", () => {
  it.todo("getListingAnalyticsSummary groups view events by day correctly");
  it.todo("getListingAnalyticsSummary computes ctr as (enquiries/views)*100 rounded to 2dp");
  it.todo("getListingAnalyticsSummary returns empty daily_views array when no events in range");
  it.todo("recordAnalyticsEvent inserts a row to listing_analytics_events");
});
