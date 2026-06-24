import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Human label for the area-price page (title, metadata, breadcrumb).
 *
 * The route segment is a raw area_id — an ONS code ("E02000238"), a postcode
 * district ("SW1A") or a slug ("kensington-and-chelsea"). Rendering it verbatim
 * showed users meaningless codes. resolveAreaName looks the id up in
 * geography_boundaries and returns its display_name ("UB6 · Ealing" for
 * MSOA/LSOA) or area_name ("Ealing", "SW1A"), falling back to a humanised slug
 * when nothing matches (slug-based ids, or any lookup failure).
 */

/** Slug/code → title-cased label. Used only when no boundary row matches. */
export function humanizeAreaSlug(areaId: string): string {
  return decodeURIComponent(areaId)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Resolve an area_id to its human display name. Memoised per request via
 * React cache() so generateMetadata and the page share a single query.
 * Server-only (uses the service-role client to read public reference data).
 */
export const resolveAreaName = cache(async (areaId: string): Promise<string> => {
  const decoded = decodeURIComponent(areaId);
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("geography_boundaries")
      .select("display_name, area_name")
      .eq("area_id", decoded)
      .limit(1)
      .maybeSingle();

    const resolved = data?.display_name ?? data?.area_name;
    if (resolved) return resolved;
  } catch {
    // fall through to the slug fallback on any lookup error
  }
  return humanizeAreaSlug(areaId);
});
