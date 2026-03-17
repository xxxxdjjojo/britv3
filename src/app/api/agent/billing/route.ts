import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentSubscription,
  createCheckoutSession,
  getCustomerPortalUrl,
  generateApiKey,
  revokeApiKey,
  purchaseFeatureBoost,
  getApiKeys,
} from "@/services/agent/agent-billing-service";

/**
 * GET /api/agent/billing
 * Returns current subscription and active API keys.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [subscription, apiKeys] = await Promise.allSettled([
      getCurrentSubscription(supabase, user.id),
      getApiKeys(supabase, user.id),
    ]);

    return NextResponse.json({
      subscription:
        subscription.status === "fulfilled" ? subscription.value : null,
      api_keys:
        apiKeys.status === "fulfilled" ? apiKeys.value : [],
    });
  } catch (error) {
    console.error("Failed to fetch billing info:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing info" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/billing
 * ?action=checkout     — create Stripe checkout session
 * ?action=portal       — get customer portal URL
 * ?action=generate_key — generate a new API key
 * ?action=revoke_key   — revoke an API key
 * ?action=boost        — purchase a feature boost
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const action = searchParams.get("action");
    const body = await request.json();

    if (action === "checkout") {
      const { price_id, success_url, cancel_url } = body;
      if (!price_id || !success_url || !cancel_url) {
        return NextResponse.json(
          { error: "price_id, success_url, and cancel_url are required" },
          { status: 400 },
        );
      }
      const url = await createCheckoutSession(
        user.id,
        price_id,
        success_url,
        cancel_url,
      );
      return NextResponse.json({ url });
    }

    if (action === "portal") {
      const { return_url } = body;
      if (!return_url) {
        return NextResponse.json(
          { error: "return_url is required" },
          { status: 400 },
        );
      }
      const url = await getCustomerPortalUrl(supabase, user.id, return_url);
      return NextResponse.json({ url });
    }

    if (action === "generate_key") {
      const { name } = body;
      if (!name) {
        return NextResponse.json(
          { error: "name is required" },
          { status: 400 },
        );
      }
      const result = await generateApiKey(supabase, user.id, name);
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "revoke_key") {
      const { key_id } = body;
      if (!key_id) {
        return NextResponse.json(
          { error: "key_id is required" },
          { status: 400 },
        );
      }
      await revokeApiKey(supabase, key_id, user.id);
      return NextResponse.json({ success: true });
    }

    if (action === "boost") {
      const { listing_id, duration_days, price_id, success_url, cancel_url } =
        body;
      if (
        !listing_id ||
        !duration_days ||
        !price_id ||
        !success_url ||
        !cancel_url
      ) {
        return NextResponse.json(
          {
            error:
              "listing_id, duration_days, price_id, success_url, and cancel_url are required",
          },
          { status: 400 },
        );
      }
      const url = await purchaseFeatureBoost(
        user.id,
        listing_id,
        duration_days,
        price_id,
        success_url,
        cancel_url,
      );
      return NextResponse.json({ url });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to handle billing action:", error);
    return NextResponse.json(
      { error: "Failed to process billing request" },
      { status: 500 },
    );
  }
}
