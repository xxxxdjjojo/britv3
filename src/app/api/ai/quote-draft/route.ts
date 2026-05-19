import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import {
  draftTradesQuote,
  draftAgentProposal,
  getMarketPricing,
  getRateCard,
} from "@/services/ai/quote-draft-service";
import { enforceAiRateLimit } from "@/services/ai/rate-limit";

const requestSchema = z.object({
  rfq_description: z.string().min(1).max(5000),
  draft_type: z.enum(["trades", "agent"]),
  context_id: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role as string | undefined;
    if (role !== "service_provider" && role !== "agent") {
      return NextResponse.json(
        { error: "Forbidden: only service providers and agents can draft quotes" },
        { status: 403 },
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { rfq_description, draft_type } = parsed.data;

    // 4. Rate limit: max 10 AI drafts per user per day (Upstash sliding window)
    const rateLimit = await enforceAiRateLimit(user.id, "quote_draft");
    if (!rateLimit.ok) {
      return NextResponse.json(
        {
          error: "Daily AI draft limit reached",
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          reset: rateLimit.reset,
        },
        { status: 429 },
      );
    }

    // 5. Generate draft based on type
    if (draft_type === "trades") {
      const rateCard = await getRateCard(supabase, user.id);
      const marketPricing = await getMarketPricing(
        supabase,
        (rateCard?.service_category as string) ?? "general",
        (rateCard?.region as string) ?? "london",
      );

      const draft = await draftTradesQuote(
        rfq_description,
        rateCard ?? {},
        marketPricing ?? {},
        user.id,
      );

      if (!draft) {
        return NextResponse.json({ draft: null, fallback: true });
      }

      return NextResponse.json({ draft });
    }

    // draft_type === "agent"
    // Fetch property details from context_id if available
    let propertyDetails: Record<string, unknown> = {};
    if (parsed.data.context_id) {
      const context_id = parsed.data.context_id;

      const { data: property } = await supabase
        .from("properties")
        .select("id, title, description, address_line1, city, postcode, property_type, bedrooms, bathrooms, square_footage, epc_rating, year_built")
        .eq("id", context_id)
        .maybeSingle();

      if (property) {
        // Verify the caller owns a listing for this property
        const { data: ownershipCheck } = await supabase
          .from("listings")
          .select("id")
          .eq("property_id", context_id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!ownershipCheck) {
          return NextResponse.json(
            { error: "Property not found or not owned by you" },
            { status: 403 },
          );
        }

        propertyDetails = property as Record<string, unknown>;
      }
    }

    const marketData = await getMarketPricing(supabase, "estate_agency", "london");

    const draft = await draftAgentProposal(
      propertyDetails,
      marketData ?? {},
      user.id,
    );

    if (!draft) {
      return NextResponse.json({ draft: null, fallback: true });
    }

    return NextResponse.json({ draft });
  } catch (err) {
    console.error("[AI] quote-draft error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
