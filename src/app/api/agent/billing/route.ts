import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createCheckoutSession,
  getCustomerPortalUrl,
  getCurrentSubscription,
  purchaseFeatureBoost,
  generateApiKey,
  revokeApiKey,
  getApiKeys,
} from "@/services/agent/agent-billing-service";

function isValidReturnUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return false;
  try {
    const parsed = new URL(url);
    const allowed = new URL(appUrl);
    return parsed.origin === allowed.origin;
  } catch {
    return false;
  }
}

/**
 * GET /api/agent/billing
 *
 * Returns current subscription and API keys for the authenticated agent.
 * Accepts ?type=subscription|keys (defaults to subscription).
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "subscription";

  try {
    if (type === "keys") {
      const keys = await getApiKeys(supabase, user.id);
      return NextResponse.json(keys);
    }

    // Default: subscription
    const subscription = await getCurrentSubscription(supabase, user.id);
    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Failed to fetch billing data:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/billing
 *
 * Routes billing actions by ?action= param:
 *   - action=checkout        -> Stripe Checkout for subscription
 *   - action=portal          -> Stripe Customer Portal URL
 *   - action=boost           -> Stripe Checkout for featured listing boost
 *   - action=generate_key    -> Generate new API key
 *
 * Body: varies by action (see inline docs).
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    const body = (await request.json()) as Record<string, unknown>;

    switch (action) {
      case "checkout": {
        const { price_id, success_url, cancel_url } = body as {
          price_id?: string;
          success_url?: string;
          cancel_url?: string;
        };
        if (!price_id || !success_url || !cancel_url) {
          return NextResponse.json(
            { error: "price_id, success_url, and cancel_url are required" },
            { status: 400 },
          );
        }
        if (!isValidReturnUrl(success_url) || !isValidReturnUrl(cancel_url)) {
          return NextResponse.json({ error: "Invalid redirect URL" }, { status: 400 });
        }
        const url = await createCheckoutSession(
          user.id,
          price_id,
          success_url,
          cancel_url,
        );
        return NextResponse.json({ url });
      }

      case "portal": {
        const { return_url } = body as { return_url?: string };
        if (!return_url) {
          return NextResponse.json(
            { error: "return_url is required" },
            { status: 400 },
          );
        }
        if (!isValidReturnUrl(return_url)) {
          return NextResponse.json({ error: "Invalid return URL" }, { status: 400 });
        }
        const url = await getCustomerPortalUrl(supabase, user.id, return_url);
        return NextResponse.json({ url });
      }

      case "boost": {
        const { listing_id, duration_days, price_id, success_url, cancel_url } =
          body as {
            listing_id?: string;
            duration_days?: number;
            price_id?: string;
            success_url?: string;
            cancel_url?: string;
          };
        if (
          !listing_id ||
          duration_days === undefined ||
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

      case "generate_key": {
        const { name } = body as { name?: string };
        if (!name) {
          return NextResponse.json(
            { error: "name is required" },
            { status: 400 },
          );
        }
        const key = await generateApiKey(supabase, user.id, name);
        // Return the raw key — client must store it securely, it won't be shown again
        return NextResponse.json({ key }, { status: 201 });
      }

      default:
        return NextResponse.json(
          {
            error:
              "action is required. Valid values: checkout | portal | boost | generate_key",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Failed to process billing action:", error);
    return NextResponse.json(
      { error: "Failed to process billing action" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agent/billing
 *
 * Revokes an API key. Requires ?keyId= query param.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get("keyId");

  if (!keyId) {
    return NextResponse.json(
      { error: "keyId query parameter is required" },
      { status: 400 },
    );
  }

  try {
    await revokeApiKey(supabase, keyId, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to revoke API key:", error);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 },
    );
  }
}
