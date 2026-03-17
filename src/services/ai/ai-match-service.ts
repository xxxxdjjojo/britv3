/**
 * AI Match service — preferences, cached results, and Claude-powered analysis.
 *
 * Tables:
 *   ai_match_preferences  (one row per user, upserted)
 *   ai_match_results      (multiple rows per user, expires after 24 h)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { callClaude } from "./claude-service";
import { penceToGBP } from "@/lib/currency";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AiMatchPreferences = {
  id?: string;
  user_id?: string;
  location: string | null;
  budget_min: number | null; // pence
  budget_max: number | null; // pence
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  must_haves: string[];
  lifestyle_factors: Record<string, string>;
  updated_at?: string;
};

export type AiMatchResult = {
  id: string;
  listing_id: string;
  match_score: number;
  match_reasons: string[];
  computed_at: string;
  expires_at: string;
  listing?: {
    id: string;
    address: string;
    price: number;
    bedrooms: number | null;
    property_type: string | null;
  };
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Strip HTML tags and control characters from a user-supplied string to
 * prevent prompt injection when values are embedded in the Claude prompt.
 */
function sanitizeForPrompt(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[\x00-\x1F\x7F]/g, "") // strip control chars
    .trim()
    .slice(0, 500); // max 500 chars per value
}

type RawListing = {
  id: string;
  address: string;
  price: number;
  bedrooms: number | null;
  property_type: string | null;
};

type ClaudeMatchItem = {
  listing_id: string;
  score: number;
  reasons: string[];
};

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Fetch the stored match preferences for a user.
 * Returns null if no row exists yet.
 */
export async function getMatchPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<AiMatchPreferences | null> {
  const { data, error } = await supabase
    .from("ai_match_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    location: data.location ?? null,
    budget_min: data.budget_min ?? null,
    budget_max: data.budget_max ?? null,
    bedrooms_min: data.bedrooms_min ?? null,
    bedrooms_max: data.bedrooms_max ?? null,
    must_haves: (data.must_haves as string[]) ?? [],
    lifestyle_factors: (data.lifestyle_factors as Record<string, string>) ?? {},
    updated_at: data.updated_at,
  };
}

/**
 * Upsert match preferences for a user.
 * Returns the updated row or null on failure.
 */
export async function saveMatchPreferences(
  supabase: SupabaseClient,
  userId: string,
  prefs: Omit<AiMatchPreferences, "id" | "user_id" | "updated_at">,
): Promise<AiMatchPreferences | null> {
  const { data, error } = await supabase
    .from("ai_match_preferences")
    .upsert(
      {
        user_id: userId,
        location: prefs.location,
        budget_min: prefs.budget_min,
        budget_max: prefs.budget_max,
        bedrooms_min: prefs.bedrooms_min,
        bedrooms_max: prefs.bedrooms_max,
        must_haves: prefs.must_haves,
        lifestyle_factors: prefs.lifestyle_factors,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    console.error("[ai-match] saveMatchPreferences error:", error);
    return null;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    location: data.location ?? null,
    budget_min: data.budget_min ?? null,
    budget_max: data.budget_max ?? null,
    bedrooms_min: data.bedrooms_min ?? null,
    bedrooms_max: data.bedrooms_max ?? null,
    must_haves: (data.must_haves as string[]) ?? [],
    lifestyle_factors: (data.lifestyle_factors as Record<string, string>) ?? {},
    updated_at: data.updated_at,
  };
}

/**
 * Fetch non-expired match results for a user, joined with listing data.
 */
export async function getMatchResults(
  supabase: SupabaseClient,
  userId: string,
): Promise<AiMatchResult[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("ai_match_results")
    .select(
      `
      id,
      listing_id,
      match_score,
      match_reasons,
      computed_at,
      expires_at,
      listing:listings (
        id,
        address,
        price,
        bedrooms,
        property_type
      )
    `,
    )
    .eq("user_id", userId)
    .gt("expires_at", now)
    .order("match_score", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const listing = Array.isArray(row.listing) ? row.listing[0] : row.listing;
    return {
      id: row.id as string,
      listing_id: row.listing_id as string,
      match_score: Number(row.match_score),
      match_reasons: (row.match_reasons as string[]) ?? [],
      computed_at: row.computed_at as string,
      expires_at: row.expires_at as string,
      listing: listing
        ? {
            id: listing.id as string,
            address: listing.address as string,
            price: Number(listing.price),
            bedrooms: (listing.bedrooms as number | null) ?? null,
            property_type: (listing.property_type as string | null) ?? null,
          }
        : undefined,
    };
  });
}

type RunMatchResult =
  | { cached: true }
  | { success: true; count: number }
  | { error: string };

/**
 * Run Claude-powered match analysis for a user.
 *
 * 1. Returns early if valid non-expired results already exist.
 * 2. Fetches up to 20 active listings matching rough budget/bedrooms criteria.
 * 3. Sanitizes lifestyle_factors to prevent prompt injection.
 * 4. Calls Claude and parses the JSON response.
 * 5. Replaces old results for this user with fresh rows (expires in 24 h).
 */
export async function runMatchAnalysis(
  supabase: SupabaseClient,
  userId: string,
  prefs: AiMatchPreferences,
): Promise<RunMatchResult> {
  // 1. Check for valid cached results
  const existing = await getMatchResults(supabase, userId);
  if (existing.length > 0) {
    return { cached: true };
  }

  // 2. Fetch up to 20 active listings matching rough criteria
  let query = supabase
    .from("listings")
    .select("id, address, price, bedrooms, property_type")
    .eq("status", "active")
    .limit(20);

  if (prefs.budget_max !== null) {
    query = query.lte("price", prefs.budget_max);
  }
  if (prefs.bedrooms_min !== null) {
    query = query.gte("bedrooms", prefs.bedrooms_min);
  }

  const { data: listings, error: listingsError } = await query;

  if (listingsError) {
    console.error("[ai-match] Failed to fetch listings:", listingsError);
    return { error: "listings_fetch_failed" };
  }

  if (!listings || listings.length === 0) {
    return { error: "no_listings_found" };
  }

  const typedListings = listings as RawListing[];

  // 3. Sanitize lifestyle_factors values
  const sanitizedFactors: Record<string, string> = {};
  for (const [key, value] of Object.entries(prefs.lifestyle_factors)) {
    sanitizedFactors[sanitizeForPrompt(key)] = sanitizeForPrompt(value);
  }

  // 4. Build prompt
  const systemPrompt = `You are a UK property matching AI. Given a buyer's preferences and a list of properties, score each property from 0.0 to 1.0 based on how well it matches. Return ONLY valid JSON with no other text: {"matches": [{"listing_id": "...", "score": 0.85, "reasons": ["reason1", "reason2"]}]}`;

  const userMessage = `
Buyer preferences:
- Location: ${prefs.location ?? "flexible"}
- Budget: £${penceToGBP(prefs.budget_min ?? 0).toLocaleString()} to £${penceToGBP(prefs.budget_max ?? 9999999).toLocaleString()}
- Bedrooms: ${prefs.bedrooms_min ?? 1}–${prefs.bedrooms_max ?? 10}
- Must haves: ${prefs.must_haves.join(", ") || "none specified"}
- Lifestyle: ${Object.entries(sanitizedFactors).map(([k, v]) => `${k}: ${v}`).join("; ") || "none"}

Properties to score:
${typedListings.map((l) => `- ID: ${l.id} | ${l.address} | £${penceToGBP(l.price).toLocaleString()} | ${l.bedrooms ?? "?"} bed | ${l.property_type ?? "unknown"}`).join("\n")}
`;

  // 5. Call Claude
  const aiResult = await callClaude({
    feature: "ai_match",
    userId,
    systemPrompt,
    userMessage,
    maxTokens: 2048,
  });

  if (!aiResult) {
    return { error: "ai_call_failed" };
  }

  // 6. Parse JSON response
  let matches: ClaudeMatchItem[];
  try {
    const parsed = JSON.parse(aiResult.text) as {
      matches: ClaudeMatchItem[];
    };
    matches = parsed.matches;
    if (!Array.isArray(matches)) {
      throw new Error("matches is not an array");
    }
  } catch (parseErr) {
    console.error("[ai-match] Failed to parse Claude response:", parseErr, aiResult.text);
    return { error: "parse_error" };
  }

  // 7. Delete old results for this user, insert new results
  await supabase.from("ai_match_results").delete().eq("user_id", userId);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const rows = matches
    .filter(
      (m) =>
        typeof m.listing_id === "string" &&
        typeof m.score === "number" &&
        m.score >= 0 &&
        m.score <= 1,
    )
    .map((m) => ({
      user_id: userId,
      listing_id: m.listing_id,
      match_score: m.score,
      match_reasons: Array.isArray(m.reasons) ? m.reasons : [],
      expires_at: expiresAt,
    }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("ai_match_results")
      .insert(rows);

    if (insertError) {
      console.error("[ai-match] Failed to insert results:", insertError);
      return { error: "insert_failed" };
    }
  }

  // 8. Return success
  return { success: true, count: rows.length };
}
