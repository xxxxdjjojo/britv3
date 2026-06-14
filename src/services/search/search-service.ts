/**
 * Search service for property listings.
 * Delegates to query-builder for Supabase queries and logs analytics.
 */

import type { SearchParams, SearchResult } from "@/types/search";
import { createClient } from "@/lib/supabase/server";
import { buildSearchQuery } from "@/lib/search/query-builder";
import { excludeBillingSuspendedListings } from "@/lib/truedeed/listing-visibility";

/**
 * Search properties using filters, location, sort, and cursor pagination.
 * Logs search analytics in the background (fire-and-forget).
 */
export async function searchProperties(
  params: SearchParams,
): Promise<SearchResult> {
  const startTime = performance.now();
  const supabase = await createClient();

  const result = await buildSearchQuery(supabase, params);

  // Truedeed clause 11.1 suspension: hide listings owned by billing-suspended
  // agents. Post-filters the page (the search_listings view has no owner
  // column — see @/lib/truedeed/listing-visibility); `count` may slightly
  // overstate while a suspension is live.
  const visible = await excludeBillingSuspendedListings(result.data);
  const filteredResult =
    visible.length === result.data.length
      ? result
      : { ...result, data: visible };

  // Log analytics (fire-and-forget, don't block the response)
  const duration = Math.round(performance.now() - startTime);
  supabase
    .from("search_analytics")
    .insert({
      filters: params as Record<string, unknown>,
      result_count: result.count,
      query_duration_ms: duration,
    })
    .then(() => {
      // Intentionally ignored -- analytics logging is best-effort
    });

  return filteredResult;
}
