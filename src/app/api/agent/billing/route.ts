/**
 * /api/agent/billing
 *
 * GET  -- current subscription info.
 * POST -- create checkout session or get portal URL based on ?action= param:
 *   - checkout → Stripe checkout (stub)
 *   - portal   → Stripe billing portal (stub)
 *   - boost    → purchase feature boost (stub)
 *   - generate-key → generate API key
 *   - revoke-key   → revoke API key
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentSubscription,
  createCheckoutSession,
  getCustomerPortalUrl,
  purchaseFeatureBoost,
  generateApiKey,
  revokeApiKey,
  getApiKeys,
} from "@/services/agent/agent-billing-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const type = params.get("type");

    if (type === "api-keys") {
      const keys = await getApiKeys(supabase, user.id);
      return NextResponse.json({ keys });
    }

    const subscription = await getCurrentSubscription(supabase, user.id);
    return NextResponse.json({ subscription });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch billing data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const action = params.get("action") ?? "checkout";
    const body = (await request.json()) as Record<string, string>;

    switch (action) {
      case "checkout": {
        const { price_id, success_url, cancel_url } = body;
        if (!price_id || !success_url || !cancel_url) {
          return NextResponse.json(
            { error: "price_id, success_url, and cancel_url are required" },
            { status: 400 },
          );
        }
        const session = await createCheckoutSession(
          user.id,
          price_id,
          success_url,
          cancel_url,
        );
        return NextResponse.json({ url: session.url });
      }

      case "portal": {
        const portal = await getCustomerPortalUrl(user.id);
        return NextResponse.json({ url: portal.url });
      }

      case "boost": {
        const { listing_id, duration_days, price_id } = body;
        if (!listing_id || !duration_days || !price_id) {
          return NextResponse.json(
            { error: "listing_id, duration_days, and price_id are required" },
            { status: 400 },
          );
        }
        const boost = await purchaseFeatureBoost(
          user.id,
          listing_id,
          Number(duration_days),
          price_id,
        );
        return NextResponse.json({ url: boost.url });
      }

      case "generate-key": {
        const { name } = body;
        if (!name) {
          return NextResponse.json(
            { error: "name is required for API key generation" },
            { status: 400 },
          );
        }
        const result = await generateApiKey(supabase, user.id, name);
        return NextResponse.json(result, { status: 201 });
      }

      case "revoke-key": {
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

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to process billing action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
