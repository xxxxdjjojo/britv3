/**
 * POST /api/stripe/connect/onboarding-link
 *
 * Generates a fresh Stripe Connect onboarding link for an existing Express
 * account. Use this when the provider needs to re-enter the onboarding flow
 * (e.g. link expired, incomplete KYC).
 *
 * Auth: cookie-based Supabase session required.
 * Role: provider only (checks service_provider_details row).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStripeConnectAccount,
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

    // 3. Fetch existing Stripe Connect account
    const connectAccount = await getStripeConnectAccount(supabase, providerId);

    if (!connectAccount) {
      return NextResponse.json(
        {
          error: "No Stripe Connect account found. Use /api/stripe/connect/create-account first.",
        },
        { status: 404 },
      );
    }

    // 4. Generate fresh onboarding link
    const origin = new URL(request.url).origin;
    const { url } = await getOnboardingLink(connectAccount.stripe_account_id, origin);

    return NextResponse.json({ url }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate onboarding link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
