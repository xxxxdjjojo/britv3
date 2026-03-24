/**
 * ai-description-service.ts
 * Server-side only. Generates listing descriptions via Claude Haiku.
 * Enforces max 3 regenerations per listing stored in listing_description_attempts.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DescriptionTone, SellerListing } from "@/types/seller";
import { sanitizeAiInput } from "@/lib/ai/sanitize";

const PROMPT_FIELD_MAX_LENGTH = 500;

function sanitizeForPrompt(value: string): string {
  // Strip control characters (reuses shared sanitizer)
  let cleaned = sanitizeAiInput(value, { maxLength: PROMPT_FIELD_MAX_LENGTH });
  // Collapse runs of 3+ newlines to prevent instruction injection via whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned;
}

const MAX_ATTEMPTS = 3;

const TONE_PROMPTS: Record<DescriptionTone, string> = {
  professional:
    "Write a professional, estate-agent-style property description. Use precise language, highlight investment potential, mention proximity to amenities. Formal tone, no superlatives.",
  warm:
    "Write a warm, lifestyle-focused property description. Emphasise how the home feels to live in, family-friendly features, community. Conversational, inviting tone.",
  luxury:
    "Write a premium, luxury property description. Use aspirational language, highlight unique features, understated elegance. Avoid clichés. Short sentences with impact.",
};

export async function getAttemptCount(
  supabase: SupabaseClient,
  listingId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("listing_description_attempts")
    .select("*", { count: "exact", head: true })
    .eq("listing_id", listingId);
  if (error) throw error;
  return count ?? 0;
}

export async function generateDescription(
  supabase: SupabaseClient,
  listing: Pick<
    SellerListing,
    | "id"
    | "property_type"
    | "bedrooms"
    | "bathrooms"
    | "features"
    | "city"
    | "postcode"
    | "asking_price"
    | "key_selling_points"
  >,
  tone: DescriptionTone,
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const count = await getAttemptCount(supabase, listing.id);
  if (count >= MAX_ATTEMPTS) {
    throw new Error(`Maximum ${MAX_ATTEMPTS} AI description generations reached for this listing`);
  }

  const priceFormatted = listing.asking_price
    ? `£${(listing.asking_price / 100).toLocaleString("en-GB")}`
    : "price to be confirmed";

  const featuresText = listing.features?.join(", ") ?? "none specified";
  const sellingPoints = listing.key_selling_points?.join("; ") ?? "none specified";

  const safeType = sanitizeForPrompt(listing.property_type ?? "");
  const safeCity = sanitizeForPrompt(listing.city ?? "");
  const safePostcode = sanitizeForPrompt(listing.postcode ?? "");
  const safeFeatures = sanitizeForPrompt(featuresText);
  const safeSellingPoints = sanitizeForPrompt(sellingPoints);

  const prompt = `${TONE_PROMPTS[tone]}

<property_details>
- Type: ${safeType}
- Bedrooms: ${listing.bedrooms ?? "unspecified"}
- Bathrooms: ${listing.bathrooms ?? "unspecified"}
- Location: ${safeCity}, ${safePostcode}
- Asking price: ${priceFormatted}
- Features: ${safeFeatures}
- Key selling points: ${safeSellingPoints}
</property_details>

Write a compelling property description of approximately 150-200 words. Do not include the price. Do not include the full address.`;

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  // Record the attempt
  await supabase.from("listing_description_attempts").insert({
    listing_id: listing.id,
    seller_id: user.id,
    tone,
  });

  return text;
}
