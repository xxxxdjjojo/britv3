/**
 * POST /api/billing/checkout
 *
 * Creates a Stripe Checkout session.
 * Supports both subscription and one-time payment modes.
 *
 * Security:
 * - Requires authentication.
 * - Validates price_id against server-side allowlist.
 * - Validates success_url / cancel_url are same-origin.
 * - Checks user doesn't already have an active subscription (mode=subscription).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPriceIdAllowed, isValidReturnUrl } from "@/lib/billing-config";
import {
  createSubscriptionCheckout,
  createOneTimeCheckout,
  getSubscription,
} from "@/services/billing/billing-service";
import type { BillingRole } from "@/lib/billing-config";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    price_id,
    success_url,
    cancel_url,
    mode = "subscription",
    role,
    metadata,
  } = body as {
    price_id?: string;
    success_url?: string;
    cancel_url?: string;
    mode?: "subscription" | "payment";
    role?: BillingRole;
    metadata?: Record<string, string>;
  };

  // ─── Validation ─────────────────────────────────────────────────────────────
  if (!price_id) {
    return NextResponse.json({ error: "price_id is required" }, { status: 400 });
  }
  if (!success_url) {
    return NextResponse.json({ error: "success_url is required" }, { status: 400 });
  }
  if (!cancel_url) {
    return NextResponse.json({ error: "cancel_url is required" }, { status: 400 });
  }

  if (!isPriceIdAllowed(price_id)) {
    return NextResponse.json({ error: "Invalid price_id" }, { status: 400 });
  }

  if (!isValidReturnUrl(success_url)) {
    return NextResponse.json({ error: "Invalid success_url" }, { status: 400 });
  }
  if (!isValidReturnUrl(cancel_url)) {
    return NextResponse.json({ error: "Invalid cancel_url" }, { status: 400 });
  }

  // ─── Duplicate subscription guard ───────────────────────────────────────────
  if (mode === "subscription") {
    const existing = await getSubscription(supabase, user.id);
    if (existing && (existing.status === "active" || existing.status === "trialing")) {
      return NextResponse.json(
        { error: "You already have an active subscription. Use the portal to manage it." },
        { status: 409 },
      );
    }
  }

  // ─── Create session ──────────────────────────────────────────────────────────
  try {
    let url: string;

    if (mode === "payment") {
      url = await createOneTimeCheckout(user.id, price_id, success_url, cancel_url, metadata);
    } else {
      url = await createSubscriptionCheckout(
        user.id,
        price_id,
        success_url,
        cancel_url,
        role ?? "agent",
      );
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[billing/checkout] Failed to create checkout session:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
