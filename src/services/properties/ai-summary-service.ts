/**
 * "Why you'll love this home" — LLM prose over a structured fact pack.
 *
 * The model receives ONLY computed facts (key stats + the heuristic score
 * bases) and is instructed to invent no figures. Output is Zod-validated by the
 * shared callClaude wrapper. Results are cached in `listing_ai_summary` keyed by
 * a hash of the fact pack, so the model is called again only when the facts
 * change. On any failure (no API key, rate limit, malformed output, missing
 * cache table) it degrades to a deterministic templated summary, so the card
 * always has something honest to show.
 */

import { createHash } from "node:crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { callClaude } from "@/services/ai/claude-service";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PropertyView } from "@/lib/properties/build-property-view";
import type { PropertyScore } from "@/lib/properties/property-score";

const MODEL = "claude-haiku-4-5-20251001";

export const propertySummarySchema = z.object({
  highlights: z.array(z.string()).min(1).max(3),
  pros: z.array(z.string()).min(1).max(3),
  cons: z.array(z.string()).max(3),
  idealFor: z.array(z.string()).min(1).max(3),
});

export type PropertySummary = z.infer<typeof propertySummarySchema>;

const SYSTEM_PROMPT = [
  "You write concise, factual summaries for a UK residential property portal.",
  "Use ONLY the facts provided. Never invent prices, distances, names, schools, or features that are not in the facts.",
  "Return STRICT JSON matching this shape and nothing else:",
  '{"highlights": string[], "pros": string[], "cons": string[], "idealFor": string[]}',
  "1-3 highlights, 1-3 pros, 0-3 cons, 1-3 idealFor. Each item is one short plain sentence, UK English, no markdown.",
  "Base every statement on a supplied fact. If no genuine con is supported by the facts, return an empty cons array.",
].join("\n");

/** Build the structured fact pack — computed facts only, no prose. */
export function buildFactPack(view: PropertyView, score: PropertyScore): string {
  const { listing, property } = view.detail;
  const lines: string[] = [
    `Type: ${view.propertyTypeLabel}`,
    `Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}`,
    view.sqft > 0 ? `Floor area: ${view.sqft} sq ft` : "",
    `Location: ${property.city} ${property.postcode}`,
    `Listing: ${listing.listingType === "rent" ? "to rent" : "for sale"} at ${view.priceFormatted}`,
    property.tenure ? `Tenure: ${property.tenure}` : "",
    property.councilTaxBand ? `Council tax band: ${property.councilTaxBand}` : "",
    view.epc !== "N/A" ? `EPC rating: ${view.epc}` : "",
    property.newBuild ? "New build" : "",
    `TrueDeed score: ${score.overall}/100`,
    ...score.dimensions.map((d) => `Score — ${d.label}: ${d.stars}/5 (${d.basis})`),
    view.features.length > 0
      ? `Features: ${view.features.slice(0, 8).join(", ")}`
      : "",
  ];
  return lines.filter(Boolean).join("\n");
}

function factHash(factPack: string): string {
  return createHash("sha256").update(factPack).digest("hex").slice(0, 16);
}

/** Deterministic fallback summary derived purely from the computed facts. */
export function buildTemplatedSummary(
  view: PropertyView,
  score: PropertyScore,
): PropertySummary {
  const { property } = view.detail;
  const strong = score.dimensions.filter((d) => d.stars >= 4);
  const weak = score.dimensions.filter((d) => d.stars <= 2);

  const highlights = [
    `${view.propertyTypeLabel} with ${property.bedrooms} bedroom${property.bedrooms === 1 ? "" : "s"} in ${property.city}.`,
    ...(strong[0] ? [`${strong[0].label}: ${strong[0].basis.toLowerCase()}.`] : []),
  ].slice(0, 3);

  const pros =
    strong.length > 0
      ? strong.slice(0, 3).map((d) => `${d.label}: ${d.basis.toLowerCase()}.`)
      : [`${property.bedrooms}-bed ${view.propertyTypeLabel.toLowerCase()} in ${property.city}.`];

  const cons = weak.slice(0, 2).map((d) => `${d.label}: ${d.basis.toLowerCase()}.`);

  const idealFor =
    property.bedrooms >= 3
      ? ["Families and those needing more space."]
      : property.bedrooms <= 1
        ? ["Young professionals, singles, or couples."]
        : ["Couples, sharers, or small households."];

  return { highlights, pros, cons, idealFor };
}

/**
 * Returns a cached or freshly generated property summary, falling back to a
 * deterministic templated summary. Never throws — returns a usable summary or
 * null only if even the templated fallback is impossible.
 */
export async function getPropertySummary(
  view: PropertyView,
  score: PropertyScore,
): Promise<PropertySummary | null> {
  const listingId = view.detail.listing.id;
  const factPack = buildFactPack(view, score);
  const hash = factHash(factPack);

  let db: SupabaseClient | null = null;
  try {
    db = createAdminClient() as unknown as SupabaseClient;
  } catch {
    db = null;
  }

  // 1. Cache hit?
  if (db) {
    try {
      const { data } = await db
        .from("listing_ai_summary")
        .select("summary")
        .eq("listing_id", listingId)
        .eq("fact_hash", hash)
        .maybeSingle();
      if (data?.summary) {
        const parsed = propertySummarySchema.safeParse(data.summary);
        if (parsed.success) return parsed.data;
      }
    } catch {
      // cache table absent or unreadable — fall through to generation
    }
  }

  // 2. Generate via the LLM (only when an API key is configured).
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await callClaude<PropertySummary>({
        feature: "property_summary",
        userId: listingId,
        systemPrompt: SYSTEM_PROMPT,
        userMessage: factPack,
        maxTokens: 600,
        timeoutMs: 12_000,
        outputSchema: propertySummarySchema,
      });

      if (result.ok && result.data.parsed) {
        const summary = result.data.parsed;
        if (db) {
          try {
            await db
              .from("listing_ai_summary")
              .upsert(
                { listing_id: listingId, fact_hash: hash, summary, model: MODEL },
                { onConflict: "listing_id,fact_hash" },
              );
          } catch {
            // best-effort cache write
          }
        }
        return summary;
      }
    } catch {
      // generation failed — fall through to templated summary
    }
  }

  // 3. Deterministic fallback.
  return buildTemplatedSummary(view, score);
}
