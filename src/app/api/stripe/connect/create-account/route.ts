/**
 * POST /api/stripe/connect/create-account
 *
 * Creates a Stripe Express account for the authenticated provider (if one
 * does not already exist) and returns a fresh onboarding link.
 *
 * Auth: cookie-based Supabase session required.
 * Role: provider only (checks service_provider_details row).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  initiateStripeConnect,
  getOnboardingLink,
} from "@/services/provider/provider-payment-service";

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createClient();

    // 1. Auth guard
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // 2. Resolve provider id from service_provider_details
    const { data: providerDetails, error: providerError } = await supabase
      .from("service_provider_details")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (providerError || !providerDetails) {
      return NextResponse.json(
        { error: "Provider profile not found" },
        { status: 404 },
      );
    }

    const providerId = (providerDetails as { id: string }).id;

    // 3. Create Stripe Express account (idempotent — returns existing if present)
    const stripeAccountId = await initiateStripeConnect(
      supabase,
      providerId,
      user.email ?? "",
    );

    // 4. Generate onboarding link
    const origin = new URL(request.url).origin;
    const { url: onboardingUrl } = await getOnboardingLink(stripeAccountId, origin);

    return NextResponse.json({ onboarding_url: onboardingUrl }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create Stripe account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
