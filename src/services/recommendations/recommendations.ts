import { createClient } from "@/lib/supabase/server";

export type PropertyRecommendation = Readonly<{
  id: string;
  title: string;
  property_type: string;
  price: number;
  bedrooms: number;
  postcode: string;
  match_score: number;
}>;

type SavedSearch = Readonly<{
  id: string;
  property_type: string | null;
  min_price: number | null;
  max_price: number | null;
  min_bedrooms: number | null;
  postcode_prefix: string | null;
}>;

const DEFAULT_LIMIT = 10;

/**
 * Get property recommendations for a user based on their saved searches.
 * Uses SQL-based matching -- zero AI cost.
 *
 * - Matches properties against saved search criteria (type, price, bedrooms, location)
 * - Excludes properties the user has already interacted with (viewed, saved, dismissed)
 * - Orders by match quality (most criteria matched first)
 */
export async function getRecommendations(
  userId: string,
  limit: number = DEFAULT_LIMIT,
): Promise<PropertyRecommendation[]> {
  const supabase = await createClient();

  // Fetch user's saved searches
  const { data: savedSearches, error: searchError } = await supabase
    .from("saved_searches")
    .select("id, property_type, min_price, max_price, min_bedrooms, postcode_prefix")
    .eq("user_id", userId);

  if (searchError || !savedSearches || savedSearches.length === 0) {
    return [];
  }

  // Get property IDs user has already interacted with
  const { data: interactions } = await supabase
    .from("property_interactions")
    .select("property_id")
    .eq("user_id", userId);

  const excludedIds = (interactions ?? []).map((i) => i.property_id);

  // Build recommendations from all saved searches
  const allRecommendations: PropertyRecommendation[] = [];

  for (const search of savedSearches as SavedSearch[]) {
    let query = supabase
      .from("properties")
      .select("id, title, property_type, price, bedrooms, postcode, match_score");

    // Apply search criteria filters
    if (search.property_type) {
      query = query.eq("property_type", search.property_type);
    }
    if (search.min_price != null) {
      query = query.gte("price", search.min_price);
    }
    if (search.max_price != null) {
      query = query.lte("price", search.max_price);
    }
    if (search.min_bedrooms != null) {
      query = query.gte("bedrooms", search.min_bedrooms);
    }
    if (search.postcode_prefix) {
      query = query.ilike("postcode", `${search.postcode_prefix}%`);
    }

    // Exclude already-interacted properties
    if (excludedIds.length > 0) {
      query = query.not("id", "in", `(${excludedIds.join(",")})`);
    }

    const { data: properties, error: propError } = await query
      .order("match_score", { ascending: false })
      .limit(limit);

    if (!propError && properties) {
      allRecommendations.push(...(properties as PropertyRecommendation[]));
    }
  }

  // Deduplicate by property ID and sort by match_score
  const seen = new Set<string>();
  const unique = allRecommendations.filter((prop) => {
    if (seen.has(prop.id)) return false;
    seen.add(prop.id);
    return true;
  });

  unique.sort((a, b) => b.match_score - a.match_score);

  return unique.slice(0, limit);
}
