/**
 * Builds Supabase queries from SearchParams.
 * Uses materialized view for non-location queries, RPC for radius queries.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SearchParams, SearchResult } from "@/types/search";
import type { SearchListingRow } from "@/types/property";

const MILES_TO_METERS = 1609.34;
const DEFAULT_PER_PAGE = 20;
const DEFAULT_RADIUS_MILES = 5;

/**
 * Build and execute a search query against the search_listings materialized view
 * or the search_listings_by_radius RPC function.
 */
export async function buildSearchQuery(
  supabase: SupabaseClient,
  params: SearchParams,
): Promise<SearchResult> {
  const perPage = params.per_page ?? DEFAULT_PER_PAGE;
  const isLocationSearch = params.lat != null && params.lng != null;
  const isPolygonSearch = params.polygon != null && params.polygon.length > 0;

  // Start query: RPC for location/polygon, materialized view otherwise
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any;

  if (isPolygonSearch) {
    query = supabase.rpc("search_listings_by_polygon", {
      polygon_geojson: params.polygon!,
    });
  } else if (isLocationSearch) {
    const radiusMiles = params.radius ?? DEFAULT_RADIUS_MILES;
    query = supabase.rpc("search_listings_by_radius", {
      center_lat: params.lat!,
      center_lng: params.lng!,
      radius_meters: radiusMiles * MILES_TO_METERS,
    });
  } else {
    query = supabase.from("search_listings").select("*", { count: "exact" });
  }

  // Apply filters
  if (params.listing_type) {
    query = query.eq("listing_type", params.listing_type);
  }

  if (params.min_price != null) {
    query = query.gte("price", params.min_price);
  }

  if (params.max_price != null) {
    query = query.lte("price", params.max_price);
  }

  if (params.min_bedrooms != null) {
    query = query.gte("bedrooms", params.min_bedrooms);
  }

  if (params.max_bedrooms != null) {
    query = query.lte("bedrooms", params.max_bedrooms);
  }

  if (params.min_bathrooms != null) {
    query = query.gte("bathrooms", params.min_bathrooms);
  }

  if (params.property_type && params.property_type.length > 0) {
    query = query.in("property_type", params.property_type);
  }

  if (params.epc_rating) {
    query = query.lte("epc_rating", params.epc_rating);
  }

  if (params.new_build != null) {
    query = query.eq("new_build", params.new_build);
  }

  if (params.amenities && params.amenities.length > 0) {
    const featuresFilter: Record<string, boolean> = {};
    for (const amenity of params.amenities) {
      featuresFilter[amenity] = true;
    }
    query = query.contains("features", featuresFilter);
  }

  if (params.q) {
    query = query.textSearch("description_tsv", params.q, {
      type: "websearch",
    });
  }

  if (params.listed_after) {
    query = query.gte("listed_date", params.listed_after);
  }

  // Apply sort
  const sort = params.sort ?? "date_desc";
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "date_asc":
      query = query.order("listed_date", { ascending: true });
      break;
    case "date_desc":
      query = query.order("listed_date", { ascending: false });
      break;
    case "relevance":
      // For relevance, the textSearch already ranks; order by listed_date as tiebreaker
      query = query.order("listed_date", { ascending: false });
      break;
  }

  // Apply cursor pagination
  if (params.cursor) {
    query = query.gt("listing_id", params.cursor);
  }

  query = query.limit(perPage);

  // Execute
  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Search query failed: ${error.message}`);
  }

  const results = (data ?? []) as SearchListingRow[];
  const lastItem = results[results.length - 1];

  return {
    data: results,
    count: count ?? results.length,
    cursor: lastItem?.listing_id ?? null,
  };
}
