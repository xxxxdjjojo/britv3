import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePropertyDescription } from "@/services/ai/description-generator";
import type { Tone } from "@/config/prompts/property-description";

const MAX_REGENERATIONS = 3;

const requestSchema = z.object({
  propertyType: z.string().min(1),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  features: z.array(z.string()),
  location: z.string().min(1),
  price: z.number().positive(),
  tone: z.enum(["professional", "friendly", "premium"]),
  listingId: z.uuid(),
  tenure: z.enum(["freehold", "leasehold"]).optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { propertyType, bedrooms, bathrooms, features, location, price, tone, listingId, tenure } = parsed.data;

    // 3. Check regeneration count
    const admin = createAdminClient();
    const { count, error: countError } = await admin
      .from("ai_usage_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .eq("feature", "property_description");

    if (countError) {
      console.error("[AI] Failed to check regeneration count:", countError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    if ((count ?? 0) >= MAX_REGENERATIONS) {
      return NextResponse.json(
        { error: "Maximum regenerations reached", limit: MAX_REGENERATIONS },
        { status: 429 },
      );
    }

    // 4. Generate description
    const result = await generatePropertyDescription({
      userId: user.id,
      listing: { propertyType, bedrooms, bathrooms, features, location, price, tenure },
      tone: tone as Tone,
    });

    if (!result) {
      return NextResponse.json(
        { error: "AI temporarily unavailable" },
        { status: 503 },
      );
    }

    return NextResponse.json({ description: result.text });
  } catch (err) {
    console.error("[AI] generate-description error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
