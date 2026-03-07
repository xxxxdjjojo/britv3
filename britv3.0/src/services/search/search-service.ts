/**
 * Search service for property listings.
 * Delegates to query-builder for Supabase queries and logs analytics.
 */

import type { SearchParams, SearchResult } from "@/types/search";
import { createClient } from "@/lib/supabase/server";
import { buildSearchQuery } from "@/lib/search/query-builder";

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

  return result;
}
